import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import sharp from 'sharp';
import exifReader from 'exif-reader';
import { ContentError } from './projects.mjs';

export const THUMB = { width: 1000, quality: 72 };
export const FULL = { longEdge: 2400, quality: 75 };
export const BLUR = { width: 20, quality: 20 };

export const PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.heic', '.heif'];

const run = promisify(execFile);

export function isPhotoFile(file) {
  return PHOTO_EXTENSIONS.includes(path.extname(file).toLowerCase());
}

function isHeic(file) {
  return ['.heic', '.heif'].includes(path.extname(file).toLowerCase());
}

export async function fingerprint(file) {
  return createHash('sha1').update(await fs.readFile(file)).digest('hex');
}

async function readableSource(file) {
  if (!isHeic(file)) return { source: file, cleanup: async () => {} };
  if (process.platform !== 'darwin') {
    throw new ContentError(`${path.basename(file)} is HEIC, which needs macOS to convert. Export it as JPEG and try again.`);
  }
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'portfolio-heic-'));
  const source = path.join(dir, `${path.parse(file).name}.jpg`);
  await run('sips', ['-s', 'format', 'jpeg', file, '--out', source]);
  return { source, cleanup: () => fs.rm(dir, { recursive: true, force: true }) };
}

export async function makeCopies(file, { optimizedDir, projectId, name }) {
  const outDir = path.join(optimizedDir, projectId);
  await fs.mkdir(outDir, { recursive: true });
  const { source, cleanup } = await readableSource(file);
  try {
    const upright = () => sharp(source).autoOrient();
    const thumbName = `thumb-${name}.webp`;
    const fullName = `full-${name}.webp`;
    const [thumb, full, blur] = await Promise.all([
      upright()
        .resize({ width: THUMB.width, withoutEnlargement: true })
        .webp({ quality: THUMB.quality })
        .toFile(path.join(outDir, thumbName)),
      upright()
        .resize({ width: FULL.longEdge, height: FULL.longEdge, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: FULL.quality })
        .toFile(path.join(outDir, fullName)),
      upright().resize({ width: BLUR.width }).webp({ quality: BLUR.quality }).toBuffer(),
    ]);
    return {
      entry: {
        thumb: `images-optimized/${projectId}/${thumbName}`,
        full: `images-optimized/${projectId}/${fullName}`,
        blur: `data:image/webp;base64,${blur.toString('base64')}`,
      },
      sizes: { thumb, full },
    };
  } finally {
    await cleanup();
  }
}

function readDateTaken(exif) {
  try {
    const taken = exifReader(exif).Photo?.DateTimeOriginal;
    return taken instanceof Date && !Number.isNaN(taken.getTime()) ? taken.toISOString().slice(0, 10) : null;
  } catch {
    return null;
  }
}

export async function dateTaken(file) {
  const { source, cleanup } = await readableSource(file);
  try {
    const { exif } = await sharp(source).metadata();
    return exif ? readDateTaken(exif) : null;
  } finally {
    await cleanup();
  }
}

export async function deleteCopies({ optimizedDir, projectId, name }) {
  await Promise.all(
    [`thumb-${name}.webp`, `full-${name}.webp`].map((file) =>
      fs.rm(path.join(optimizedDir, projectId, file), { force: true })
    )
  );
}
