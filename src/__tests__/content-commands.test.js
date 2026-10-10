import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { contentPaths } from '../../scripts/content/paths.mjs';
import { fingerprint } from '../../scripts/content/photos.mjs';
import * as content from '../../scripts/content/commands.mjs';

let paths;

async function makeJpeg(file, { width = 300, height = 200, exif, orientation } = {}) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  let image = sharp({ create: { width, height, channels: 3, background: '#a0643c' } }).jpeg();
  if (exif) image = image.withExif(exif);
  if (orientation) image = image.withMetadata({ orientation });
  await image.toFile(file);
}

const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf-8'));
const original = (...parts) => path.join(paths.originals, ...parts);

beforeEach(async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'portfolio-content-'));
  paths = contentPaths(root);
  const cover = { type: 'img', name: 'hero', alt: 'Finished bench' };
  await fs.mkdir(path.dirname(paths.projects), { recursive: true });
  await fs.writeFile(
    paths.projects,
    JSON.stringify([{ id: 'bench', title: 'Bench', description: 'A bench.', hero: cover, images: [cover], materials: ['Walnut'], techniques: [] }])
  );
  await fs.writeFile(paths.manifest, JSON.stringify({ bench: { hero: { thumb: 'x', full: 'y', blur: 'z' } } }));
  await makeJpeg(original('bench', 'hero.jpg'));
  const sha1 = await fingerprint(original('bench', 'hero.jpg'));
  await fs.writeFile(paths.photoMap, JSON.stringify({ 'bench/hero.jpg': { photo: 'hero', sha1 } }));
});

afterEach(async () => {
  await fs.rm(paths.root, { recursive: true, force: true });
});

describe('status', () => {
  it('reports a photo dropped into a project folder as new, until it is added', async () => {
    await makeJpeg(original('bench', 'IMG_0001.jpg'));
    expect((await content.status(paths)).newPhotos).toEqual({ bench: ['IMG_0001.jpg'] });

    await content.addPhotoCommand(paths, 'bench', 'IMG_0001.jpg', { alt: 'Leg joint' });
    expect((await content.status(paths)).newPhotos).toEqual({});
  });

  it('stops offering a photo once it is skipped', async () => {
    await makeJpeg(original('bench', 'IMG_0002.jpg'));
    await content.skip(paths, 'bench', 'IMG_0002.jpg');
    expect((await content.status(paths)).newPhotos).toEqual({});
  });

  it('treats a folder that is not a project yet as a new project', async () => {
    await makeJpeg(original('walnut-desk', 'IMG_0003.jpg'));
    expect((await content.status(paths)).newProjects).toEqual({ 'walnut-desk': ['IMG_0003.jpg'] });
  });

  it('flags an original that changed after it was processed', async () => {
    await makeJpeg(original('bench', 'IMG_0004.jpg'));
    await content.addPhotoCommand(paths, 'bench', 'IMG_0004.jpg', { alt: 'Top' });
    await makeJpeg(original('bench', 'IMG_0004.jpg'), { width: 400 });
    expect((await content.status(paths)).changed).toEqual([{ original: 'bench/IMG_0004.jpg', photo: 'detail-1' }]);
  });
});

describe('adding photos', () => {
  it('makes a card copy and a full copy within the size limits', async () => {
    await makeJpeg(original('bench', 'big.jpg'), { width: 3000, height: 2000 });
    await content.addPhotoCommand(paths, 'bench', 'big.jpg', { alt: 'Whole bench' });

    const entry = (await readJson(paths.manifest)).bench['detail-1'];
    const thumb = await sharp(path.join(paths.root, 'public', entry.thumb)).metadata();
    const full = await sharp(path.join(paths.root, 'public', entry.full)).metadata();
    expect([thumb.width, thumb.height]).toEqual([1000, 667]);
    expect([full.width, full.height]).toEqual([2400, 1600]);
    expect(entry.blur).toMatch(/^data:image\/webp;base64,/);
  });

  it('records the photo in the project, the manifest and the photo map', async () => {
    await makeJpeg(original('bench', 'IMG_0005.jpg'));
    await content.addPhotoCommand(paths, 'bench', 'IMG_0005.jpg', { alt: 'Leg joint' });

    const [project] = await readJson(paths.projects);
    expect(project.images.at(-1)).toEqual({ type: 'img', name: 'detail-1', alt: 'Leg joint' });
    expect((await readJson(paths.photoMap))['bench/IMG_0005.jpg'].photo).toBe('detail-1');
  });

  it('removes location data from the published copies', async () => {
    await makeJpeg(original('bench', 'gps.jpg'), {
      exif: { IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '41/1 52/1 0/1' } },
    });
    expect((await sharp(original('bench', 'gps.jpg')).metadata()).exif).toBeDefined();

    await content.addPhotoCommand(paths, 'bench', 'gps.jpg', { alt: 'Shop' });
    const entry = (await readJson(paths.manifest)).bench['detail-1'];
    expect((await sharp(path.join(paths.root, 'public', entry.full)).metadata()).exif).toBeUndefined();
  });

  it('turns sideways phone photos upright', async () => {
    await makeJpeg(original('bench', 'sideways.jpg'), { width: 300, height: 200, orientation: 6 });
    await content.addPhotoCommand(paths, 'bench', 'sideways.jpg', { alt: 'Side' });

    const entry = (await readJson(paths.manifest)).bench['detail-1'];
    const full = await sharp(path.join(paths.root, 'public', entry.full)).metadata();
    expect([full.width, full.height]).toEqual([200, 300]);
  });

  it.runIf(process.platform === 'darwin')('accepts HEIC photos straight from a phone', async () => {
    await makeJpeg(path.join(paths.root, 'source.jpg'));
    execFileSync('sips', ['-s', 'format', 'heic', path.join(paths.root, 'source.jpg'), '--out', original('bench', 'IMG_0006.HEIC')], { stdio: 'ignore' });

    await content.addPhotoCommand(paths, 'bench', 'IMG_0006.HEIC', { alt: 'From the phone' });
    const entry = (await readJson(paths.manifest)).bench['detail-1'];
    expect((await sharp(path.join(paths.root, 'public', entry.full)).metadata()).format).toBe('webp');
  });

  it('writes nothing on a dry run', async () => {
    await makeJpeg(original('bench', 'IMG_0007.jpg'));
    const before = await Promise.all([paths.projects, paths.manifest, paths.photoMap].map((f) => fs.readFile(f, 'utf-8')));

    const summary = await content.addPhotoCommand(paths, 'bench', 'IMG_0007.jpg', { alt: 'Leg' }, { dryRun: true });

    expect(summary).toMatch(/detail-1/);
    const after = await Promise.all([paths.projects, paths.manifest, paths.photoMap].map((f) => fs.readFile(f, 'utf-8')));
    expect(after).toEqual(before);
    await expect(fs.access(path.join(paths.optimized, 'bench'))).rejects.toThrow(/ENOENT/);
  });
});

describe('removing photos', () => {
  it('deletes the web copies, keeps the original, and does not offer it again', async () => {
    await makeJpeg(original('bench', 'IMG_0008.jpg'));
    await content.addPhotoCommand(paths, 'bench', 'IMG_0008.jpg', { alt: 'Leg' });

    await content.removePhotoCommand(paths, 'bench', 'detail-1');

    const [project] = await readJson(paths.projects);
    expect(project.images.map((image) => image.name)).toEqual(['hero']);
    expect((await readJson(paths.manifest)).bench['detail-1']).toBeUndefined();
    await expect(fs.access(path.join(paths.optimized, 'bench', 'full-detail-1.webp'))).rejects.toThrow(/ENOENT/);
    await expect(fs.access(original('bench', 'IMG_0008.jpg'))).resolves.toBeUndefined();
    expect((await content.status(paths)).newPhotos).toEqual({});
  });
});

describe('3D models', () => {
  it('reports a dropped model, then publishes it with its preview', async () => {
    await fs.writeFile(original('bench', 'bench.fbx'), 'fbx bytes');
    await makeJpeg(original('bench', 'bench-render.png'));
    expect((await content.status(paths)).newModels).toEqual({ bench: ['bench.fbx'] });

    await content.addModelCommand(paths, 'bench', 'bench.fbx', { preview: 'bench-render.png', alt: 'Bench model' });

    const [project] = await readJson(paths.projects);
    expect(project.images.at(-1)).toEqual({ type: 'fbx', file: 'bench.fbx', thumb: 'bench_preview', alt: 'Bench model' });
    expect(await fs.readFile(path.join(paths.models, 'bench', 'bench.fbx'), 'utf-8')).toBe('fbx bytes');
    expect((await readJson(paths.manifest)).bench.bench_preview).toBeDefined();
    expect(await content.status(paths)).toMatchObject({ newModels: {}, newPhotos: {} });
  });

  it('removes a model and its preview from the site', async () => {
    await fs.writeFile(original('bench', 'bench.fbx'), 'fbx bytes');
    await makeJpeg(original('bench', 'bench-render.png'));
    await content.addModelCommand(paths, 'bench', 'bench.fbx', { preview: 'bench-render.png', alt: 'Bench model' });

    await content.removePhotoCommand(paths, 'bench', 'bench.fbx');

    const [project] = await readJson(paths.projects);
    expect(project.images.map((image) => image.name ?? image.file)).toEqual(['hero']);
    await expect(fs.access(path.join(paths.models, 'bench', 'bench.fbx'))).rejects.toThrow(/ENOENT/);
    expect((await readJson(paths.manifest)).bench.bench_preview).toBeUndefined();
  });
});

describe('new projects', () => {
  it('creates a project from a photo in a new folder', async () => {
    await makeJpeg(original('walnut-desk', 'IMG_0009.jpg'));

    await content.newProject(paths, 'walnut-desk', {
      title: 'Walnut Desk',
      description: 'A desk.',
      photo: 'IMG_0009.jpg',
      alt: 'Walnut desk by a window',
      materials: ['Walnut'],
      techniques: [],
    });

    const projects = await readJson(paths.projects);
    expect(projects.at(-1)).toMatchObject({ id: 'walnut-desk', hero: { name: 'hero', alt: 'Walnut desk by a window' } });
    expect((await content.status(paths)).newProjects).toEqual({});
  });
});
