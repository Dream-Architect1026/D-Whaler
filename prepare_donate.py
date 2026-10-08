# -*- coding: utf-8 -*-
import base64, io, os
from PIL import Image

SRC = r"C:\(D)_Application\Application_DBS\WechatFiles\xwechat_files\wxid_6yygp80l8i7l22_befa\temp\RWTemp\2026-10\9e20f478899dc29eb19741386f9343c8\3b6dfd10e052ac39ee9453adcbb70686.jpg"
OUTDIR = r"C:\Users\D_A\DoubaoWork\chats\2026-10-05\new-chat-4"

img = Image.open(SRC).convert("RGB")
print("ORIG_SIZE =", img.size)

# downscale so width = 360 (QR stays scannable)
TARGET_W = 360
w, h = img.size
nh = round(h * TARGET_W / w)
small = img.resize((TARGET_W, nh), Image.LANCZOS)

buf = io.BytesIO()
small.save(buf, format="JPEG", quality=82, optimize=True)
b = buf.getvalue()
b64 = base64.b64encode(b).decode("ascii")
data_uri = "data:image/jpeg;base64," + b64
print("DONATE_BYTES =", len(b), "B64_LEN =", len(b64))

with open(os.path.join(OUTDIR, "_donate_data_uri.txt"), "w", encoding="utf-8") as f:
    f.write(data_uri)

# standalone file for GitHub assets
assets = os.path.join(OUTDIR, "assets")
os.makedirs(assets, exist_ok=True)
donate_path = os.path.join(assets, "donate-alipay.jpg")
small.save(donate_path, format="JPEG", quality=88)
print("STANDALONE =", donate_path)
