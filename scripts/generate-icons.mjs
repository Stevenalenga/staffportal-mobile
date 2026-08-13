/**
 * Generates app icons and splash assets from assets/logo.webp.
 * Run: node scripts/generate-icons.mjs
 */
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const assets = path.join(root, "assets");
const logoPath = path.join(assets, "logo.webp");

const BRAND = { r: 4, g: 120, b: 87, alpha: 1 }; // #047857
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

async function logoOnBrandSquare(size, logoScale = 0.62, whitePad = false) {
  const logoSize = Math.round(size * logoScale);
  let logo = sharp(logoPath).resize(logoSize, logoSize, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });

  if (whitePad) {
    const pad = Math.round(logoSize * 0.12);
    logo = logo.extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background: WHITE,
    });
  }

  const logoBuffer = await logo.png().toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BRAND,
    },
  }).composite([{ input: logoBuffer, gravity: "center" }]);
}

async function main() {
  const meta = await sharp(logoPath).metadata();
  console.log("Logo:", meta.width, "x", meta.height, meta.format);

  // App Store / Play Store icon
  await (await logoOnBrandSquare(1024, 0.58, true)).png().toFile(path.join(assets, "icon.png"));
  console.log("Wrote icon.png");

  // Android adaptive icon layers (1024 x 1024)
  await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: BRAND },
  })
    .png()
    .toFile(path.join(assets, "android-icon-background.png"));
  console.log("Wrote android-icon-background.png");

  const fgSize = 660;
  const fgLogo = await sharp(logoPath)
    .resize(Math.round(fgSize * 0.78), Math.round(fgSize * 0.78), {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend({
      top: Math.round((1024 - fgSize) / 2),
      bottom: Math.round((1024 - fgSize) / 2),
      left: Math.round((1024 - fgSize) / 2),
      right: Math.round((1024 - fgSize) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: fgLogo, gravity: "center" }])
    .png()
    .toFile(path.join(assets, "android-icon-foreground.png"));
  console.log("Wrote android-icon-foreground.png");

  // Monochrome (Android 13+) – simplified white tile
  await (await logoOnBrandSquare(1024, 0.55, true))
    .png()
    .toFile(path.join(assets, "android-icon-monochrome.png"));
  console.log("Wrote android-icon-monochrome.png");

  // Splash + favicon
  await (await logoOnBrandSquare(512, 0.55, true))
    .png()
    .toFile(path.join(assets, "splash-icon.png"));
  console.log("Wrote splash-icon.png");

  await sharp(path.join(assets, "splash-icon.png"))
    .resize(48, 48)
    .png()
    .toFile(path.join(assets, "favicon.png"));
  console.log("Wrote favicon.png");

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
