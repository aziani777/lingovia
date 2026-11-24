#!/bin/bash
# Turn a tutor's generated clips into app assets.
#   tools/make-tutor.sh <id> <work_dir>
# <work_dir> must hold idle_raw.mp4 and talk_raw.mp4, plus any of live_raw.mp4 (body language
# with the mouth closed, shown while talking), wave_raw.mp4, thumbs_raw.mp4, laugh_raw.mp4.
# Writes assets/avatars/<id>/ (idle loop, reaction clips, mouth and blink sprites) and assets/avatars/<id>.jpg (thumbnail).
set -e
id=$1; work=$2; root=$(cd "$(dirname "$0")/.." && pwd); out=$root/assets/avatars/$id
mkdir -p "$out"
(cd "$work" && python3 "$root/tools/build-face.py" talk_raw.mp4 idle_raw.mp4 face 540 live_raw.mp4 2>&1 | grep -E "^(frames|faces|blink|live|\{)")
rm -f "$out/mouth.jpg"
cp "$work"/face/{base.jpg,mouth.webp,blink.jpg,face.json} "$out"/
for n in idle live wave thumbs laugh; do
  [ -f "$work/${n}_raw.mp4" ] && ffmpeg -y -loglevel error -i "$work/${n}_raw.mp4" -an -vf scale=540:-2 -c:v libx264 -crf 27 -preset slow -pix_fmt yuv420p -movflags +faststart "$out/$n.mp4"
done
python3 - "$out" "$root/assets/avatars/$id.jpg" <<'PY'
import json, subprocess, sys
out, thumb = sys.argv[1], sys.argv[2]
f = json.load(open(out + '/face.json'))['face']
s = round(f['w'] * 1.9); x = max(0, round(f['x'] + f['w'] / 2 - s / 2)); y = max(0, round(f['y'] + f['h'] * 0.45 - s / 2))
subprocess.run(['convert', out + '/base.jpg', '-crop', f'{s}x{s}+{x}+{y}', '+repage', '-resize', '320x320', '-quality', '88', thumb], check=True)
PY
cp "$work/face/preview.jpg" "$work/preview_$id.jpg"
ls "$out"
