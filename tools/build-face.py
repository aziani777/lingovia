"""Build the animated-face assets of a video tutor from two generated clips.

    python3 tools/build-face.py <talk.mp4> <idle.mp4> <out_dir> [output_width] [live.mp4]

From the talking clip it picks mouth shapes (3 lip widths x 6 openings), aligns them on the first
frame and writes them as a sprite sheet. From the idle clip it takes a half and a full blink.
The optional live clip (body language with the mouth closed, shown while the tutor talks) gets its own face track.
Outputs base.jpg, mouth.webp, blink.jpg, face.json and preview.jpg in <out_dir>.

Needs: pip install mediapipe opencv-python-headless numpy, and face_landmarker.task next to this
script or in the working directory (https://storage.googleapis.com/mediapipe-models/face_landmarker/
face_landmarker/float16/1/face_landmarker.task).
"""
import cv2, numpy as np, json, sys, os, mediapipe as mp
from mediapipe.tasks import python as mpp
from mediapipe.tasks.python import vision

talk_path, idle_path, out = sys.argv[1], sys.argv[2], sys.argv[3]
OUT_W = int(sys.argv[4]) if len(sys.argv) > 4 else 540
os.makedirs(out, exist_ok=True)
model = next(p for p in ('face_landmarker.task', os.path.join(os.path.dirname(__file__), 'face_landmarker.task')) if os.path.exists(p))
det = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(
    base_options=mpp.BaseOptions(model_asset_path=model), output_face_blendshapes=True, num_faces=1))

def frames(path):
    c = cv2.VideoCapture(path); res = []
    while True:
        ok, f = c.read()
        if not ok: break
        res.append(f)
    return res

def analyse(f):
    r = det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(f, cv2.COLOR_BGR2RGB)))
    if not r.face_landmarks: return None
    h, w = f.shape[:2]
    pts = np.array([[p.x * w, p.y * h] for p in r.face_landmarks[0]], np.float32)
    return pts, {b.category_name: b.score for b in r.face_blendshapes[0]}

STABLE = [33, 133, 362, 263, 6, 168, 10, 127, 356, 197, 195]   # eye corners, nose bridge, temples: they do not move when talking
talk, idle = frames(talk_path), frames(idle_path)
ref = talk[0]; H, W = ref.shape[:2]
rp, rb = analyse(ref)
face_h = float(np.linalg.norm(rp[10] - rp[152]))
print('frames', len(talk), len(idle), 'size', W, H, 'face height', round(face_h))

def align(f, pts):
    M, _ = cv2.estimateAffinePartial2D(pts[STABLE], rp[STABLE], method=cv2.LMEDS)
    a = cv2.warpAffine(f, M, (W, H), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)
    p2 = cv2.transform(pts[None], M)[0]
    return a, p2, float(np.abs(p2[STABLE] - rp[STABLE]).mean()), abs(np.degrees(np.arctan2(M[1, 0], M[0, 0])))

rows = []
for i, f in enumerate(talk):
    r = analyse(f)
    if r is None: continue
    a, p2, err, rot = align(f, r[0])
    rows.append(dict(i=i, a=a, err=err / face_h * 100, rot=float(rot),
                     op=float(np.linalg.norm(p2[13] - p2[14]) / face_h), wd=float(np.linalg.norm(p2[61] - p2[291]) / face_h)))
ops = np.array([r['op'] for r in rows]); wds = np.array([r['wd'] for r in rows])
print('faces found in', len(rows), 'talk frames | opening', round(float(ops.min()), 3), 'to', round(float(ops.max()), 3))

# lower face region (cheeks, nose, mouth, jaw: they all move when someone talks), with a soft elliptical mask
# so the patch melts into the frame underneath
m = 0.05 * face_h
xs = [rp[i][0] for i in (234, 454, 172, 397, 132, 361)]
x0, x1 = int(min(xs) - m), int(max(xs) + m)
y0, y1 = int(rp[197][1] + 0.03 * face_h), int(min(H - 1, rp[152][1] + 0.18 * face_h))
x0 -= x0 % 2; y0 -= y0 % 2; x1 += (x1 - x0) % 2; y1 += (y1 - y0) % 2
pw, ph = x1 - x0, y1 - y0
yy, xx = np.mgrid[0:ph, 0:pw].astype(np.float32)
d = np.sqrt(((xx - pw / 2) / (pw / 2)) ** 2 + ((yy - ph * 0.52) / (ph * 0.5)) ** 2)
mask = cv2.GaussianBlur(np.clip((1.0 - d) / 0.34, 0, 1), (0, 0), max(1.5, face_h / 50))[..., None]

wt = [np.percentile(wds, 12), np.percentile(wds, 50), np.percentile(wds, 90)]     # rounded, neutral, wide lips
ot = np.linspace(0, np.percentile(ops, 96), 6)                                    # closed to open
ws, os_ = wds.std() + 1e-6, ops.std() + 1e-6
grid = []
for wi, w in enumerate(wt):
    row = []
    for k, t in enumerate(ot):
        if k == 0 and wi == 1: row.append(ref[y0:y1, x0:x1].astype(np.float32)); continue
        best = min(rows, key=lambda r: ((r['op'] - t) / os_) ** 2 * 3 + ((r['wd'] - w) / ws) ** 2 + r['err'] * 0.6 + r['rot'] * 0.4)
        row.append(best['a'][y0:y1, x0:x1].astype(np.float32))
    grid.append(row)

# blink: eyes region from the idle clip
ex = [rp[i][0] for i in (33, 263, 127, 356)]; ey = [rp[i][1] for i in (105, 334, 230, 450)]
bx0, bx1 = int(min(ex)), int(max(ex)); by0, by1 = int(min(ey) - 0.03 * face_h), int(max(ey) + 0.03 * face_h)
bx0 -= bx0 % 2; by0 -= by0 % 2; bx1 += (bx1 - bx0) % 2; by1 += (by1 - by0) % 2
bw, bh = bx1 - bx0, by1 - by0
yy, xx = np.mgrid[0:bh, 0:bw].astype(np.float32)
d = np.maximum(np.abs(xx - bw / 2) / (bw / 2), np.abs(yy - bh / 2) / (bh / 2))
bm = cv2.GaussianBlur(np.clip((1 - d) / 0.25, 0, 1), (0, 0), max(1.5, face_h / 70))[..., None]
# where the face is in every frame of the idle loop, so the animated lower face can ride on the moving head
track, last = [], [1.0, 0.0, 0.0, 0.0]
irows = []
for f in idle:
    r = analyse(f)
    if r is None: track.append(last); continue
    Mi, _ = cv2.estimateAffinePartial2D(rp[STABLE], r[0][STABLE], method=cv2.LMEDS)      # base frame -> this frame
    last = [float(Mi[0, 0]), float(Mi[1, 0]), float(Mi[0, 2]), float(Mi[1, 2])]; track.append(last)
    a, _, err, _ = align(f, r[0])
    irows.append(dict(a=a, err=err / face_h * 100, bl=(r[1].get('eyeBlinkLeft', 0) + r[1].get('eyeBlinkRight', 0)) / 2))
bl = np.array([r['bl'] for r in irows]); print('blink max', round(float(bl.max()), 2))
bp = []
for t in (bl.max() * 0.55, bl.max()):
    best = min(irows, key=lambda r: abs(r['bl'] - t) * 30 + r['err'] * 0.6)
    a, b = best['a'][by0:by1, bx0:bx1].astype(np.float32), ref[by0:by1, bx0:bx1].astype(np.float32)
    bp.append(np.clip(a * bm + b * (1 - bm), 0, 255).astype(np.uint8))

S = OUT_W / W
sc = lambda im, w, h: cv2.resize(im, (w, h), interpolation=cv2.INTER_AREA)
MW, MH, BW, BH = round(pw * S), round(ph * S), round(bw * S), round(bh * S)
cv2.imwrite(f'{out}/base.jpg', sc(ref, OUT_W, round(H * S)), [cv2.IMWRITE_JPEG_QUALITY, 86])
# the sheet is transparent towards the edge of each patch, so it fades into whatever frame is underneath
alpha = (sc(mask[..., 0], MW, MH) * 255).astype(np.uint8)
cell = lambda p: np.dstack([sc(np.clip(p, 0, 255).astype(np.uint8), MW, MH), alpha])
cv2.imwrite(f'{out}/mouth.webp', np.vstack([np.hstack([cell(p) for p in row]) for row in grid]), [cv2.IMWRITE_WEBP_QUALITY, 92])
cv2.imwrite(f'{out}/blink.jpg', np.hstack([sc(p, BW, BH) for p in bp]), [cv2.IMWRITE_JPEG_QUALITY, 90])
tr = np.array(track); k = np.ones(5) / 5                                    # light smoothing against tracking jitter
tr = np.stack([np.convolve(np.pad(tr[:, j], 2, mode='wrap'), k, mode='valid') for j in range(4)], 1)
fps = cv2.VideoCapture(idle_path).get(cv2.CAP_PROP_FPS) or 24
meta = dict(w=OUT_W, h=round(H * S), fps=round(float(fps), 3),
            track=[[round(float(a), 5), round(float(b), 5), round(float(tx) * S, 2), round(float(ty) * S, 2)] for a, b, tx, ty in tr], mouth=dict(x=round(x0 * S), y=round(y0 * S), w=MW, h=MH, n=6, rows=3),
            blink=dict(x=round(bx0 * S), y=round(by0 * S), w=BW, h=BH),
            face=dict(x=round(float(rp[:, 0].min()) * S), y=round(float(rp[10][1] - 0.35 * face_h) * S), w=round(float(rp[:, 0].max() - rp[:, 0].min()) * S), h=round(face_h * 1.5 * S)))
def face_track(path):
    res, last = [], [1.0, 0.0, 0.0, 0.0]
    for f in frames(path):
        r = analyse(f)
        if r is not None:
            Mi, _ = cv2.estimateAffinePartial2D(rp[STABLE], r[0][STABLE], method=cv2.LMEDS)
            last = [float(Mi[0, 0]), float(Mi[1, 0]), float(Mi[0, 2]), float(Mi[1, 2])]
        res.append(last)
    t = np.array(res); t = np.stack([np.convolve(np.pad(t[:, j], 2, mode='wrap'), k, mode='valid') for j in range(4)], 1)
    return dict(fps=round(float(cv2.VideoCapture(path).get(cv2.CAP_PROP_FPS) or 24), 3),
                track=[[round(float(a), 5), round(float(b), 5), round(float(tx) * S, 2), round(float(ty) * S, 2)] for a, b, tx, ty in t])
if len(sys.argv) > 5 and os.path.exists(sys.argv[5]):
    meta['live'] = face_track(sys.argv[5])
    rot = [abs(np.degrees(np.arctan2(q[1], q[0]))) for q in meta['live']['track']]
    print('live clip:', len(rot), 'frames, head tilt up to', round(max(rot), 1), 'deg')
json.dump(meta, open(f'{out}/face.json', 'w')); print({k: v for k, v in meta.items() if k not in ('track', 'live')}, 'track', len(track))

# preview of every mouth shape and the closed eyes, composited on the base frame
cx0, cx1 = int(max(0, rp[:, 0].min() - 0.3 * face_h)), int(min(W, rp[:, 0].max() + 0.3 * face_h))
cy0, cy1 = int(max(0, rp[10][1] - 0.4 * face_h)), int(min(H, rp[152][1] + 0.4 * face_h))
prev = []
for row in grid:
    for p in row:
        f = ref.copy(); f[y0:y1, x0:x1] = np.clip(p * mask + ref[y0:y1, x0:x1] * (1 - mask), 0, 255).astype(np.uint8); prev.append(cv2.resize(f[cy0:cy1, cx0:cx1], (220, 260)))
f = ref.copy(); f[by0:by1, bx0:bx1] = bp[1]; blink_prev = cv2.resize(f[cy0:cy1, cx0:cx1], (220, 260))
cv2.imwrite(f'{out}/preview.jpg', np.vstack([np.hstack(prev[i * 6:(i + 1) * 6]) for i in range(3)] + [np.hstack([blink_prev] + [np.zeros((260, 220, 3), np.uint8)] * 5)]))
