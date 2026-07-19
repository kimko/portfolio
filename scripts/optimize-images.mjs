import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'public', 'images');
const OUT_DIR = path.join(ROOT, 'public', 'images-optimized');
const MANIFEST_PATH = path.join(ROOT, 'src', 'data', 'image-manifest.json');

const THUMB_WIDTH = 600;
const THUMB_QUALITY = 80;
const FULL_WIDTH = 1400;
const FULL_QUALITY = 85;
const BLUR_WIDTH = 20;
const BLUR_QUALITY = 20;

async function optimizeImages() {
  console.log('Scanning source images in public/images/...\n');

  // Ensure output directory exists
  await fs.mkdir(OUT_DIR, { recursive: true });

  const manifest = {};
  const projectDirs = await fs.readdir(SRC_DIR);

  for (const projectId of projectDirs) {
    const projectSrcDir = path.join(SRC_DIR, projectId);
    const stat = await fs.stat(projectSrcDir);
    if (!stat.isDirectory()) continue;

    const projectOutDir = path.join(OUT_DIR, projectId);
    await fs.mkdir(projectOutDir, { recursive: true });

    const files = (await fs.readdir(projectSrcDir)).filter(
      (f) => f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png')
    );

    manifest[projectId] = {};

    for (const file of files) {
      const srcPath = path.join(projectSrcDir, file);
      const baseName = path.parse(file).name;

      console.log(`  Processing: ${projectId}/${file}`);

      // Get original dimensions
      const metadata = await sharp(srcPath).metadata();
      console.log(`    Source: ${metadata.width}x${metadata.height}`);

      // Generate thumbnail (for cards)
      const thumbName = `thumb-${baseName}.webp`;
      const thumbPath = path.join(projectOutDir, thumbName);
      const thumbInfo = await sharp(srcPath)
        .resize(THUMB_WIDTH, null, { withoutEnlargement: true })
        .webp({ quality: THUMB_QUALITY })
        .toFile(thumbPath);
      console.log(
        `    Thumb:  ${thumbInfo.width}x${thumbInfo.height} -> ${(thumbInfo.size / 1024).toFixed(0)} KB`
      );

      // Generate full size (for modal)
      const fullName = `full-${baseName}.webp`;
      const fullPath = path.join(projectOutDir, fullName);
      const fullInfo = await sharp(srcPath)
        .resize(FULL_WIDTH, null, { withoutEnlargement: true })
        .webp({ quality: FULL_QUALITY })
        .toFile(fullPath);
      console.log(
        `    Full:   ${fullInfo.width}x${fullInfo.height} -> ${(fullInfo.size / 1024).toFixed(0)} KB`
      );

      // Generate tiny blur placeholder (base64)
      const blurBuffer = await sharp(srcPath)
        .resize(BLUR_WIDTH)
        .webp({ quality: BLUR_QUALITY })
        .toBuffer();
      const blurDataUri = `data:image/webp;base64,${blurBuffer.toString('base64')}`;
      console.log(`    Blur:   ${blurBuffer.length} bytes (base64)\n`);

      manifest[projectId][baseName] = {
        thumb: `images-optimized/${projectId}/${thumbName}`,
        full: `images-optimized/${projectId}/${fullName}`,
        blur: blurDataUri,
      };
    }
  }

  // Write manifest
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest written to: src/data/image-manifest.json`);

  // Summary
  const origFiles = [];
  const optFiles = [];
  for (const projectId of Object.keys(manifest)) {
    for (const baseName of Object.keys(manifest[projectId])) {
      const srcPath = path.join(SRC_DIR, projectId, `${baseName}.jpg`);
      const thumbPath = path.join(OUT_DIR, projectId, `thumb-${baseName}.webp`);
      const fullPath = path.join(OUT_DIR, projectId, `full-${baseName}.webp`);
      try {
        origFiles.push((await fs.stat(srcPath)).size);
      } catch {
        // might be .jpeg or .png
      }
      try {
        optFiles.push((await fs.stat(thumbPath)).size);
        optFiles.push((await fs.stat(fullPath)).size);
      } catch {
        // skip
      }
    }
  }

  const origTotal = origFiles.reduce((a, b) => a + b, 0);
  const optTotal = optFiles.reduce((a, b) => a + b, 0);
  console.log(`\n--- Summary ---`);
  console.log(`Original total:  ${(origTotal / 1024 / 1024).toFixed(1)} MB`);
  console.log(`Optimized total: ${(optTotal / 1024 / 1024).toFixed(1)} MB`);
  console.log(`Reduction:       ${(((origTotal - optTotal) / origTotal) * 100).toFixed(0)}%`);
  console.log(`\nDone!`);
}

optimizeImages().catch((err) => {
  console.error('Error optimizing images:', err);
  process.exit(1);
});
