#!/usr/bin/env python3
"""Build local educational surfaces and previews from the supplied DICOM archive.

No clinical interpretation or organ/disease segmentation is performed. All images
remain local. Source geometry, thresholds and mappings are recorded in metadata.
"""
from __future__ import annotations
import base64
import io
import json
import struct
import zipfile
from pathlib import Path
from collections import defaultdict
import numpy as np
import pydicom
from scipy import ndimage as ndi
from skimage.measure import marching_cubes
from PIL import Image, ImageOps, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'husam-body/assets/ct'
ARCHIVE = ROOT / 'Study0908095422986.zip'
SELECTED = '1.3.12.2.1107.5.1.4.95218.30000026090209252164000009980'
TARGET_MM = 2.5

def js_array(array):
    arr = np.ascontiguousarray(array)
    return base64.b64encode(arr.tobytes()).decode('ascii')

def compact_mesh(vertices, faces, cluster_mm):
    """Spatial vertex clustering; preserve physical coordinates and prune flats."""
    if cluster_mm:
        cells = np.floor(vertices / cluster_mm).astype(np.int32)
        _, inverse, counts = np.unique(cells, axis=0, return_inverse=True, return_counts=True)
        points = np.zeros((len(counts), 3), dtype=np.float64)
        for axis in range(3):
            points[:, axis] = np.bincount(inverse, weights=vertices[:, axis]) / counts
        faces = inverse[faces]
        faces = faces[(faces[:,0]!=faces[:,1]) & (faces[:,0]!=faces[:,2]) & (faces[:,1]!=faces[:,2])]
        _, unique = np.unique(np.sort(faces, axis=1), axis=0, return_index=True)
        faces = faces[np.sort(unique)]
        vertices = points
    used, remap = np.unique(faces, return_inverse=True)
    vertices = vertices[used].astype(np.float32)
    faces = remap.reshape(-1,3).astype(np.uint32)
    a,b,c=vertices[faces[:,0]],vertices[faces[:,1]],vertices[faces[:,2]]
    face_normals = np.cross(b-a,c-a)
    nonflat = np.linalg.norm(face_normals,axis=1)>1e-9
    faces = faces[nonflat]
    face_normals=face_normals[nonflat]
    normals=np.zeros_like(vertices)
    for index in range(3):
        np.add.at(normals,faces[:,index],face_normals)
    normals /= np.maximum(np.linalg.norm(normals,axis=1,keepdims=True),1e-12)
    return vertices, normals, faces

def write_glb(path, positions, normals, faces, name, rgba):
    chunks=[]; views=[]; accessors=[]; offset=0
    for array, component_type, typ, target in [(positions,5126,'VEC3',34962),(normals,5126,'VEC3',34962),(faces.ravel(),5125,'SCALAR',34963)]:
        data=np.ascontiguousarray(array).tobytes()
        views.append({'buffer':0,'byteOffset':offset,'byteLength':len(data),'target':target})
        ac={'bufferView':len(views)-1,'componentType':component_type,'count':len(array),'type':typ}
        if typ=='VEC3': ac.update(min=array.min(0).tolist(),max=array.max(0).tolist())
        accessors.append(ac)
        chunks.append(data)
        offset+=len(data)
    content={'asset':{'version':'2.0','generator':'Local educational DICOM threshold reconstruction'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'mesh':0,'name':name}],'meshes':[{'name':name,'primitives':[{'attributes':{'POSITION':0,'NORMAL':1},'indices':2,'material':0}]}],'materials':[{'name':name,'pbrMetallicRoughness':{'baseColorFactor':rgba,'metallicFactor':0.12,'roughnessFactor':0.54},'doubleSided':True,'alphaMode':'BLEND' if rgba[3]<1 else 'OPAQUE'}],'buffers':[{'byteLength':offset}],'bufferViews':views,'accessors':accessors}
    j=json.dumps(content,separators=(',',':')).encode(); j+=b' '*((-len(j))%4)
    binary=b''.join(chunks);binary+=b'\x00'*((-len(binary))%4)
    full=struct.pack('<III',0x46546C67,2,12+8+len(j)+8+len(binary))+struct.pack('<II',len(j),0x4E4F534A)+j+struct.pack('<II',len(binary),0x004E4942)+binary
    path.write_bytes(full)

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    groups=defaultdict(list)
    selected=[]
    with zipfile.ZipFile(ARCHIVE) as archive:
        for name in archive.namelist():
            if not name.lower().endswith('.dcm'):continue
            with archive.open(name) as file: d=pydicom.dcmread(file,stop_before_pixels=True)
            uid=str(getattr(d,'SeriesInstanceUID',''))
            groups[uid].append((name,d))
        selected=groups[SELECTED]
        first=selected[0][1]
        iop=np.array(first.ImageOrientationPatient,dtype=float)
        xdirection,ydirection=iop[:3],iop[3:]
        normal=np.cross(xdirection,ydirection)
        selected.sort(key=lambda pair: float(np.dot(np.array(pair[1].ImagePositionPatient,dtype=float),normal)))
        locations=np.array([np.dot(np.array(d.ImagePositionPatient,dtype=float),normal) for _,d in selected])
        dz=float(np.median(np.diff(locations)))
        if not np.allclose(np.diff(locations),dz,atol=.05):raise ValueError('Irregular slice spacing')
        first=selected[0][1]
        spacing=np.array([dz,*[float(v) for v in first.PixelSpacing]])
        hu=[]
        for name,header in selected:
            if not np.allclose(np.array(header.ImageOrientationPatient,dtype=float),iop):raise ValueError('Mixed orientation')
            with archive.open(name) as file:d=pydicom.dcmread(file)
            hu.append((d.pixel_array.astype(np.float32)*float(d.RescaleSlope)+float(d.RescaleIntercept)).astype(np.int16))
        volume=np.stack(hu)
    print('volume',volume.shape,'spacing',spacing,'range',int(volume.min()),int(volume.max()),flush=True)
    # One largest soft-tissue component per axial image removes the scan table.
    # Fill enclosed lung/bowel air only for the external envelope.
    body=np.zeros(volume.shape,dtype=bool)
    structure=ndi.generate_binary_structure(2,1)
    for zi in range(len(volume)):
        candidate=ndi.binary_opening(volume[zi]>-450,structure=structure,iterations=3)
        labels,n=ndi.label(candidate)
        sizes=np.bincount(labels.ravel());sizes[0]=0
        component=labels==int(sizes.argmax())
        component=ndi.binary_closing(component,iterations=4)
        body[zi]=ndi.binary_fill_holes(component)
    # Dense surfaces are not uniquely bone; avoid claiming anatomical segmentation.
    dense=(volume>300) & ndi.binary_erosion(body,iterations=2)
    labels,n=ndi.label(dense)
    sizes=np.bincount(labels.ravel());sizes[0]=0
    dense=np.isin(labels,np.flatnonzero(sizes>=30))
    origin=np.array(first.ImagePositionPatient,dtype=float)
    idxcenter=(np.array(volume.shape)-1)/2
    center_lps=origin+normal*idxcenter[0]*spacing[0]+ydirection*idxcenter[1]*spacing[1]+xdirection*idxcenter[2]*spacing[2]
    # DICOM LPS to viewer: +X left, +Y superior, +Z anterior. determinant +1.
    lps_to_view=np.array([[1,0,0],[0,0,1],[0,-1,0]],dtype=float)
    exports=[];mesh_info={}
    for key,mask,clustering,rgba in [('body',body,6.0,[.24,.8,.81,.3]),('bone',dense,4.0,[.96,.9,.73,1])]:
        target_shape=np.maximum(2,np.round((np.array(mask.shape)-1)*spacing/TARGET_MM).astype(int)+1)
        factors=(target_shape-1)/(np.array(mask.shape)-1)
        resampled=ndi.zoom(mask.astype(np.float32),factors,order=1,grid_mode=False)
        actual_spacing=(np.array(mask.shape)-1)*spacing/(np.array(resampled.shape)-1)
        smoothed=ndi.gaussian_filter(resampled,sigma=.65 if key=='body' else .45)
        field=np.pad(smoothed,1)
        verts,faces,_,_=marching_cubes(field,level=.48,spacing=tuple(actual_spacing),allow_degenerate=False,gradient_direction='ascent')
        verts-=actual_spacing
        verts,normals,faces=compact_mesh(verts,faces,clustering)
        # Marching cubes coordinates are slice,row,column physical offsets.
        lps=origin+verts[:,0,None]*normal+verts[:,1,None]*ydirection+verts[:,2,None]*xdirection
        positions=((lps-center_lps)@lps_to_view.T/1000).astype('<f4')
        # Recompute normals after coordinate mapping: permutation slice,row,column -> LPS is det -1.
        faces=faces[:,[0,2,1]].astype('<u4')
        a,b,c=positions[faces[:,0]],positions[faces[:,1]],positions[faces[:,2]]
        fn=np.cross(b-a,c-a);normals=np.zeros_like(positions)
        for ix in range(3):np.add.at(normals,faces[:,ix],fn)
        normals/=np.maximum(np.linalg.norm(normals,axis=1,keepdims=True),1e-12)
        normals=normals.astype('<f4')
        exports.append(f"export const CT_{key.upper()} = {{positions:decode('{js_array(positions)}',Float32Array),normals:decode('{js_array(normals)}',Float32Array),indices:decode('{js_array(faces)}',Uint32Array)}};")
        filename='body-surface.glb' if key=='body' else 'bone-density.glb'
        write_glb(OUT/filename,positions,normals,faces,'CT external envelope' if key=='body' else 'CT dense-voxel surface',rgba)
        mesh_info[key]={'file':filename,'vertices':len(positions),'triangles':len(faces),'minMeters':positions.min(0).tolist(),'maxMeters':positions.max(0).tolist(),'thresholdHU':-450 if key=='body' else 300,'spatialClusteringMm':clustering}
        print('mesh',key,mesh_info[key],flush=True)
    preamble="""// Generated entirely from local DICOM pixels by scripts/build_ct_assets.py.
// Educational threshold surfaces. No organs, lesions or disease are segmented.
// Shared centered metric space: +X patient left; +Y superior; +Z anterior.
function decode(base64, Type) {const raw=atob(base64); const bytes=new Uint8Array(raw.length); for(let i=0;i<raw.length;i++) bytes[i]=raw.charCodeAt(i);return new Type(bytes.buffer);}
"""
    (OUT/'geometry.js').write_text(preamble+'\n'.join(exports)+'\n')
    previews=[]
    indices=np.unique(np.linspace(len(volume)-5,4,12).round().astype(int))
    indices=indices[::-1] # superior to inferior for intuitive scroll order
    for previewindex,zi in enumerate(indices):
        arr=np.clip((volume[zi].astype(float)-(-160))/400*255,0,255).astype(np.uint8)
        filename=f'axial-{previewindex+1:02d}.jpg'
        Image.fromarray(arr).save(OUT/filename,quality=88,optimize=True)
        name,d=selected[int(zi)]
        previews.append({'file':filename,'sequence':previewindex+1,'sliceIndex':int(zi),'instanceNumber':int(getattr(d,'InstanceNumber',0)),'sourceFile':name,'sopInstanceUID':str(d.SOPInstanceUID),'imagePositionPatientMm':[float(v) for v in d.ImagePositionPatient],'windowCenterHU':40,'windowWidthHU':400,'positionFromCenterMeters':float((np.array(d.ImagePositionPatient,dtype=float)[2]-center_lps[2])/1000)})
    summaries=[]
    for uid,entries in groups.items():
        d=entries[0][1]
        summaries.append({'seriesInstanceUID':uid,'seriesNumber':str(getattr(d,'SeriesNumber','')),'description':str(getattr(d,'SeriesDescription','')),'modality':str(getattr(d,'Modality','')),'files':len(entries),'selectedForReconstruction':uid==SELECTED})
    metadata={'sourceArchive':ARCHIVE.name,'studyDate':'2026-09-02','sourceDicomFileCount':sum(len(v) for v in groups.values()),'selectedSeries':{'seriesInstanceUID':SELECTED,'seriesNumber':int(first.SeriesNumber),'description':str(first.SeriesDescription),'slices':len(volume),'rows':int(first.Rows),'columns':int(first.Columns),'spacingSliceRowColumnMm':spacing.tolist(),'imageOrientationPatient':iop.tolist(),'firstImagePositionPatientMm':origin.tolist(),'lastImagePositionPatientMm':[float(v) for v in selected[-1][1].ImagePositionPatient],'coverageMm':float(locations[-1]-locations[0])},'coordinates':{'units':'meters','axes':{'x':'patient left','y':'superior / head','z':'anterior / front'},'originDICOMLPSmm':center_lps.tolist(),'formula':'viewer_m = [[1,0,0],[0,0,1],[0,-1,0]] * (DICOM_LPS_mm - originDICOMLPSmm) / 1000','lpsToViewerRotation':lps_to_view.tolist()},'limitations':['Educational, threshold-derived surfaces only; not a clinical or surgical reconstruction.','Only anatomy within the selected CT coverage is represented; this is not a whole-body scan.','The external envelope uses a filled largest-component threshold mask and smooths edges.','Dense voxels are not uniquely bone; the density surface may include other dense structures and can omit thin bone.','No organs, lesions, obstruction, or disease locations have been segmented or inferred from CT images.','Original axial previews use a fixed illustrative soft-tissue window and do not replace a DICOM viewer.'],'processing':{'bodyThresholdHU':-450,'densityThresholdHU':300,'targetResamplingMm':TARGET_MM,'surfaceExtraction':'scikit-image marching cubes','meshReduction':'spatial vertex clustering','sourceHUConversion':'RescaleSlope * stored pixel + RescaleIntercept'},'meshes':mesh_info,'previews':previews,'allSeries':summaries}
    (OUT/'metadata.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
    # Lightweight study data can be bundled directly without filesystem fetch.
    (OUT/'metadata.js').write_text('export default '+json.dumps(metadata,ensure_ascii=False,separators=(',',':'))+';\n')
    montage=Image.new('RGB',(4*256,3*290),(10,19,26))
    draw=ImageDraw.Draw(montage)
    for i,p in enumerate(previews):
        im=Image.open(OUT/p['file']).resize((256,256))
        x,y=(i%4)*256,(i//4)*290
        montage.paste(im,(x,y));draw.text((x+10,y+263),f"{i+1:02d} / source slice {p['sliceIndex']+1}",fill=(184,222,229))
    montage.save(OUT/'preview-contact-sheet.jpg',quality=88)
    print('TOTAL MB',round(sum(p.stat().st_size for p in OUT.iterdir())/1e6,2),flush=True)

if __name__=='__main__': main()
