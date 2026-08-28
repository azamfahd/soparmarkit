const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');
const source = path.join(publicDir, 'icon.svg');
const targets = [
  ['icons/icon-192.png', 192],
  ['icons/icon-512.png', 512],
  ['icons/apple-touch-icon.png', 180],
];

async function main() {
  for (const [relative, size] of targets) {
    const output = path.join(publicDir, relative);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    await sharp(source)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(`${output}.tmp`);
    fs.renameSync(`${output}.tmp`, output);
  }

  // Keep the existing icon.png path working, but make it a real PNG.
  await sharp(source).resize(512, 512, { fit: 'cover' }).png().toFile(`${path.join(publicDir, 'icon.png')}.tmp`);
  fs.renameSync(`${path.join(publicDir, 'icon.png')}.tmp`, path.join(publicDir, 'icon.png'));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
