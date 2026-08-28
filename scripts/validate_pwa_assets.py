import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = {
    'public/icon.png': (512, 512),
    'public/icons/icon-192.png': (192, 192),
    'public/icons/icon-512.png': (512, 512),
    'public/icons/apple-touch-icon.png': (180, 180),
    'public/screenshot-wide.png': (1280, 720),
    'public/screenshot-narrow.png': (540, 1170),
}
SIGNATURE = b'\x89PNG\r\n\x1a\n'
errors = []
for relative, expected_size in EXPECTED.items():
    path = ROOT / relative
    if not path.exists():
        errors.append(f'missing: {relative}')
        continue
    raw = path.read_bytes()
    if not raw.startswith(SIGNATURE):
        errors.append(f'bad PNG signature: {relative}')
    try:
        with Image.open(path) as im:
            im.verify()
        with Image.open(path) as im:
            actual_size = im.size
        if actual_size != expected_size:
            errors.append(f'wrong dimensions: {relative}={actual_size}, expected={expected_size}')
    except Exception as exc:
        errors.append(f'unreadable: {relative}: {exc}')

manifest_path = ROOT / 'public/manifest.json'
try:
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    for icon in manifest.get('icons', []):
        src = icon.get('src', '')
        if not src.startswith('/icons/') or icon.get('type') != 'image/png':
            errors.append(f'invalid manifest icon: {icon}')
        if src.startswith('/') and not (ROOT / 'public' / src[1:]).exists():
            errors.append(f'missing manifest icon: {src}')
    for shot in manifest.get('screenshots', []):
        src = shot.get('src', '')
        if src.startswith('/') and not (ROOT / 'public' / src[1:]).exists():
            errors.append(f'missing manifest screenshot: {src}')
except Exception as exc:
    errors.append(f'invalid manifest: {exc}')

if errors:
    print('\n'.join(errors))
    raise SystemExit(1)
print('PWA asset validation passed')
for relative, size in EXPECTED.items():
    print(f'{relative}: {size[0]}x{size[1]} PNG')
