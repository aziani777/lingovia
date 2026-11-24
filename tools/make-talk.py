"""Turn a generated talking clip into a seamless loop for the app.

    python3 tools/make-talk.py <raw.mp4> <out.mp4> [width]

Generated clips start and end with a second of closed-mouth smile. This finds the part where the tutor is
really talking (from the mouth opening, measured on face landmarks), keeps it, and appends the same part
played backwards, so the loop never jumps. Needs mediapipe, opencv, ffmpeg and face_landmarker.task
(see build-face.py).
"""
import cv2, numpy as np, sys, os, subprocess, tempfile, mediapipe as mp
from mediapipe.tasks import python as mpp
from mediapipe.tasks.python import vision

raw, out = sys.argv[1], sys.argv[2]
W = int(sys.argv[3]) if len(sys.argv) > 3 else 540
model = next(p for p in ('face_landmarker.task', os.path.join(os.path.dirname(__file__), 'face_landmarker.task')) if os.path.exists(p))
det = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(base_options=mpp.BaseOptions(model_asset_path=model), num_faces=1))
cap = cv2.VideoCapture(raw); fps = cap.get(cv2.CAP_PROP_FPS) or 24; ops = []
while True:
    ok, f = cap.read()
    if not ok: break
    r = det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(f, cv2.COLOR_BGR2RGB)))
    if not r.face_landmarks: ops.append(0.0); continue
    p = r.face_landmarks[0]
    ops.append(abs(p[13].y - p[14].y) / max(1e-6, abs(p[10].y - p[152].y)))
det.close()
ops = np.array(ops); talking = np.where(ops > 0.035)[0]
if len(talking) < fps:            # hardly any talking found: keep the whole clip
    a, b = 0, len(ops) - 1
else:
    a, b = max(0, talking[0] - 1), min(len(ops) - 1, talking[-1] + 1)
print(f'{os.path.basename(raw)}: {len(ops)} frames, talking from {a / fps:.2f}s to {b / fps:.2f}s, mouth open in {100 * (ops[a:b + 1] > 0.035).mean():.0f}% of it')
with tempfile.TemporaryDirectory() as d:
    fwd = os.path.join(d, 'f.mp4')
    enc = ['-an', '-c:v', 'libx264', '-crf', '27', '-preset', 'slow', '-pix_fmt', 'yuv420p']
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw, '-vf', f'trim=start_frame={a}:end_frame={b + 1},setpts=PTS-STARTPTS,scale={W}:-2', *enc, fwd], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', fwd, '-filter_complex', '[0:v]split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1[v]', '-map', '[v]', *enc, '-movflags', '+faststart', out], check=True)
