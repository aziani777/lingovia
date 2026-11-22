import cv2, numpy as np, json, sys, mediapipe as mp
from mediapipe.tasks import python as mpp
from mediapipe.tasks.python import vision
D='/tmp/claude-0/-home-user-nowera/c1ee66a9-671a-52e7-bd42-9242331d3053/scratchpad/dl/'
det=vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(base_options=mpp.BaseOptions(model_asset_path='face_landmarker.task'),output_face_blendshapes=True,num_faces=1))
def frames(path):
    c=cv2.VideoCapture(path); out=[]
    while True:
        ok,f=c.read()
        if not ok: break
        out.append(f)
    return out
def analyse(f):
    r=det.detect(mp.Image(image_format=mp.ImageFormat.SRGB,data=cv2.cvtColor(f,cv2.COLOR_BGR2RGB)))
    if not r.face_landmarks: return None
    h,w=f.shape[:2]
    pts=np.array([[p.x*w,p.y*h] for p in r.face_landmarks[0]],np.float32)
    bs={b.category_name:b.score for b in r.face_blendshapes[0]}
    return pts,bs
STABLE=[33,133,362,263,6,168,10,127,356,197,195]
talk=frames(D+'talk_raw.mp4'); idle=frames(D+'idle_raw.mp4')
print('frames',len(talk),len(idle),talk[0].shape)
ref=talk[0]; rp,rb=analyse(ref); H,W=ref.shape[:2]
def align(f,pts):
    M,_=cv2.estimateAffinePartial2D(pts[STABLE],rp[STABLE],method=cv2.LMEDS)
    a=cv2.warpAffine(f,M,(W,H),flags=cv2.INTER_LANCZOS4,borderMode=cv2.BORDER_REFLECT)
    p2=cv2.transform(pts[None],M)[0]
    err=float(np.abs(p2[STABLE]-rp[STABLE]).mean())
    return a,p2,err,M
face_h=float(np.linalg.norm(rp[10]-rp[152]))
rows=[]
for i,f in enumerate(talk):
    r=analyse(f)
    if r is None: continue
    pts,bs=r; a,p2,err,M=align(f,pts)
    op=float(np.linalg.norm(p2[13]-p2[14])/face_h); wd=float(np.linalg.norm(p2[61]-p2[291])/face_h)
    rot=abs(np.degrees(np.arctan2(M[1,0],M[0,0]))); 
    rows.append(dict(i=i,op=op,wd=wd,err=err,rot=float(rot),jaw=bs.get('jawOpen',0),a=a,p=p2))
ops=np.array([r['op'] for r in rows]); print('openness min/med/max',ops.min(),np.median(ops),ops.max(),'ref',float(np.linalg.norm(rp[13]-rp[14])/face_h), 'err med',np.median([r['err'] for r in rows]))
# region: mouth + chin, generous
xs=[rp[i][0] for i in (61,291,172,397,132,361)]; 
x0=int(min(xs)-0.02*W); x1=int(max(xs)+0.02*W); y0=int(rp[2][1]-0.005*H); y1=int(min(H-1,rp[152][1]+0.05*H))
x0-=x0%2; y0-=y0%2; x1+= (x1-x0)%2; y1+=(y1-y0)%2
pw,ph=x1-x0,y1-y0; print('patch',x0,y0,pw,ph)
# feather mask: ellipse, 1 in the centre, 0 at the border
yy,xx=np.mgrid[0:ph,0:pw].astype(np.float32)
d=np.sqrt(((xx-pw/2)/(pw/2))**2+((yy-ph*0.45)/(ph*0.55))**2)
mask=np.clip((1.0-d)/0.28,0,1); mask=cv2.GaussianBlur(mask,(0,0),6)[...,None]
K=8
targets=np.linspace(0,np.percentile(ops,97),K)
base_op=float(np.linalg.norm(rp[13]-rp[14])/face_h)
chosen=[]; patches=[]
for k,t in enumerate(targets):
    if k==0: patches.append(ref[y0:y1,x0:x1].copy()); chosen.append(('ref',base_op)); continue
    # nearest openness, penalise alignment error, rotation and unusual width
    best=min(rows,key=lambda r: abs(r['op']-t)*400 + r['err']*1.5 + r['rot']*2 + abs(r['wd']-np.median([q['wd'] for q in rows]))*120)
    a=best['a'][y0:y1,x0:x1].astype(np.float32); b=ref[y0:y1,x0:x1].astype(np.float32)
    # match overall brightness of the patch border to the base
    patches.append(np.clip(a*mask+b*(1-mask),0,255).astype(np.uint8)); chosen.append((best['i'],round(best['op'],4),round(best['err'],2)))
print('chosen',chosen)
# blink patches from the idle video
ex=[rp[i][0] for i in (33,263,127,356)]; ey=[rp[i][1] for i in (105,334,230,450)]
bx0=int(min(ex)+0.0*W); bx1=int(max(ex)); by0=int(min(ey)-0.01*H); by1=int(max(ey)+0.01*H)
bx0-=bx0%2; by0-=by0%2; bx1+=(bx1-bx0)%2; by1+=(by1-by0)%2
bw,bh=bx1-bx0,by1-by0
yy,xx=np.mgrid[0:bh,0:bw].astype(np.float32)
d=np.maximum(np.abs(xx-bw/2)/(bw/2),np.abs(yy-bh/2)/(bh/2)); bm=cv2.GaussianBlur(np.clip((1-d)/0.25,0,1),(0,0),5)[...,None]
irows=[]
for i,f in enumerate(idle):
    r=analyse(f)
    if r is None: continue
    pts,bs=r; a,p2,err,M=align(f,pts)
    irows.append(dict(i=i,bl=(bs.get('eyeBlinkLeft',0)+bs.get('eyeBlinkRight',0))/2,err=err,a=a))
bl=np.array([r['bl'] for r in irows]); print('blink max',bl.max(),'ref',(rb.get('eyeBlinkLeft',0)+rb.get('eyeBlinkRight',0))/2)
bp=[]
for t in (bl.max()*0.55,bl.max()):
    best=min(irows,key=lambda r: abs(r['bl']-t)*30+r['err']*1.5)
    a=best['a'][by0:by1,bx0:bx1].astype(np.float32); b=ref[by0:by1,bx0:bx1].astype(np.float32)
    bp.append(np.clip(a*bm+b*(1-bm),0,255).astype(np.uint8)); print('blink frame',best['i'],round(best['bl'],2),round(best['err'],2))
S=640/W  # output scale
def sc(img): return cv2.resize(img,(round(img.shape[1]*S),round(img.shape[0]*S)),interpolation=cv2.INTER_AREA)
cv2.imwrite('base.jpg',sc(ref),[cv2.IMWRITE_JPEG_QUALITY,86])
cv2.imwrite('mouth.jpg',np.hstack([sc(p) for p in patches]),[cv2.IMWRITE_JPEG_QUALITY,88])
cv2.imwrite('blink.jpg',np.hstack([sc(p) for p in bp]),[cv2.IMWRITE_JPEG_QUALITY,88])
meta=dict(size=640,mouth=dict(x=round(x0*S),y=round(y0*S),w=round(pw*S),h=round(ph*S),n=K),blink=dict(x=round(bx0*S),y=round(by0*S),w=round(bw*S),h=round(bh*S),n=2))
json.dump(meta,open('face.json','w')); print(meta)
# preview: each level composited on the base
prev=[]
for p in patches:
    f=ref.copy(); f[y0:y1,x0:x1]=p; prev.append(cv2.resize(f[int(H*0.25):int(H*0.85),int(W*0.2):int(W*0.8)],(300,300)))
f=ref.copy(); f[by0:by1,bx0:bx1]=bp[1]; prev.append(cv2.resize(f[int(H*0.25):int(H*0.85),int(W*0.2):int(W*0.8)],(300,300)))
cv2.imwrite('preview.jpg',np.vstack([np.hstack(prev[:5]),np.hstack(prev[5:]+[np.zeros((300,300,3),np.uint8)]*(10-len(prev)))]))
