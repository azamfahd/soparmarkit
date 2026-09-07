import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SRC_ICON = path.resolve('public/icon.png');
const RES_DIR = path.resolve('android/app/src/main/res');

// Background color for launcher and splash
const BG_COLOR = { r: 15, g: 23, b: 42, alpha: 1 }; // #0f172a (Dark Slate / Navy)

const densities = [
  { name: 'mdpi', iconSize: 48, fgSize: 108 },
  { name: 'hdpi', iconSize: 72, fgSize: 162 },
  { name: 'xhdpi', iconSize: 96, fgSize: 216 },
  { name: 'xxhdpi', iconSize: 144, fgSize: 324 },
  { name: 'xxxhdpi', iconSize: 192, fgSize: 432 },
];

const splashScreens = [
  { dir: 'drawable', width: 480, height: 320 },
  { dir: 'drawable-port-mdpi', width: 320, height: 480 },
  { dir: 'drawable-port-hdpi', width: 480, height: 800 },
  { dir: 'drawable-port-xhdpi', width: 720, height: 1280 },
  { dir: 'drawable-port-xxhdpi', width: 960, height: 1600 },
  { dir: 'drawable-port-xxxhdpi', width: 1280, height: 1920 },
  { dir: 'drawable-land-mdpi', width: 480, height: 320 },
  { dir: 'drawable-land-hdpi', width: 800, height: 480 },
  { dir: 'drawable-land-xhdpi', width: 1280, height: 720 },
  { dir: 'drawable-land-xxhdpi', width: 1600, height: 960 },
  { dir: 'drawable-land-xxxhdpi', width: 1920, height: 1280 },
];

async function run() {
  console.log('--- Generating Android Icons & Splash Assets ---');

  if (!fs.existsSync(SRC_ICON)) {
    throw new Error(`Source icon not found at ${SRC_ICON}`);
  }

  // 1. Generate Mipmap Icons
  for (const d of densities) {
    const dir = path.join(RES_DIR, `mipmap-${d.name}`);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // A. ic_launcher.png (Legacy square icon with #0f172a background & subtle rounded rect)
    const iconCorner = Math.round(d.iconSize * 0.2);
    const rectSvg = Buffer.from(
      `<svg width="${d.iconSize}" height="${d.iconSize}"><rect x="0" y="0" width="${d.iconSize}" height="${d.iconSize}" rx="${iconCorner}" ry="${iconCorner}" fill="#0f172a"/></svg>`
    );
    const innerIconSize = Math.round(d.iconSize * 0.85);
    const innerPadding = Math.round((d.iconSize - innerIconSize) / 2);

    const resizedLogoForIcon = await sharp(SRC_ICON)
      .resize(innerIconSize, innerIconSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp(rectSvg)
      .composite([{ input: resizedLogoForIcon, top: innerPadding, left: innerPadding }])
      .png()
      .toFile(path.join(dir, 'ic_launcher.png'));

    // B. ic_launcher_round.png (Circular icon with #0f172a background)
    const circleSvg = Buffer.from(
      `<svg width="${d.iconSize}" height="${d.iconSize}"><circle cx="${d.iconSize / 2}" cy="${d.iconSize / 2}" r="${d.iconSize / 2}" fill="#0f172a"/></svg>`
    );
    await sharp(circleSvg)
      .composite([{ input: resizedLogoForIcon, top: innerPadding, left: innerPadding }])
      .png()
      .toFile(path.join(dir, 'ic_launcher_round.png'));

    // C. ic_launcher_foreground.png (Transparent canvas, logo in safe area ~66%)
    const safeLogoSize = Math.round(d.fgSize * 0.65);
    const safePadding = Math.round((d.fgSize - safeLogoSize) / 2);

    const resizedLogoForFg = await sharp(SRC_ICON)
      .resize(safeLogoSize, safeLogoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp({
      create: {
        width: d.fgSize,
        height: d.fgSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: resizedLogoForFg, top: safePadding, left: safePadding }])
      .png()
      .toFile(path.join(dir, 'ic_launcher_foreground.png'));

    console.log(`✓ Generated icons for mipmap-${d.name}`);
  }

  // 2. Update background XML
  const bgXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0f172a</color>
</resources>
`;
  fs.writeFileSync(path.join(RES_DIR, 'values/ic_launcher_background.xml'), bgXml, 'utf-8');

  const drawableBgXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportHeight="108"
    android:viewportWidth="108">
    <path
        android:fillColor="#0f172a"
        android:pathData="M0,0h108v108h-108z" />
</vector>
`;
  fs.writeFileSync(path.join(RES_DIR, 'drawable/ic_launcher_background.xml'), drawableBgXml, 'utf-8');

  // 3. Generate Splash Screens
  for (const s of splashScreens) {
    const splashDir = path.join(RES_DIR, s.dir);
    if (!fs.existsSync(splashDir)) fs.mkdirSync(splashDir, { recursive: true });

    // Logo should occupy about 25-35% of shortest screen dimension
    const minDim = Math.min(s.width, s.height);
    const logoSize = Math.min(Math.round(minDim * 0.4), 384);
    const topPos = Math.round((s.height - logoSize) / 2);
    const leftPos = Math.round((s.width - logoSize) / 2);

    const splashLogo = await sharp(SRC_ICON)
      .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp({
      create: {
        width: s.width,
        height: s.height,
        channels: 4,
        background: BG_COLOR,
      },
    })
      .composite([{ input: splashLogo, top: topPos, left: leftPos }])
      .png()
      .toFile(path.join(splashDir, 'splash.png'));

    console.log(`✓ Generated splash for ${s.dir} (${s.width}x${s.height})`);
  }

  console.log('=== All Android assets successfully generated! ===');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
