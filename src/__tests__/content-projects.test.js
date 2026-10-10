import { describe, it, expect } from 'vitest';
import {
  ContentError,
  addPhoto,
  createProject,
  editProject,
  nextPhotoName,
  removePhoto,
  reorderPhotos,
  setAlt,
  setCover,
} from '../../scripts/content/projects.mjs';

const cover = { type: 'img', name: 'hero', alt: 'Finished bench' };
const bench = {
  id: 'bench',
  title: 'Bench',
  description: 'A bench.',
  hero: cover,
  images: [cover, { type: 'img', name: 'detail-1', alt: 'Dovetail' }, { type: 'fbx', file: 'bench.fbx', thumb: 'bench_preview', alt: 'Model' }],
  materials: ['Walnut', 'Maple'],
  techniques: ['Dovetails'],
};

describe('editing tags', () => {
  it('adds and removes only the named tags', () => {
    const updated = editProject(bench, { addMaterials: ['Cherry'], removeMaterials: ['Maple'] });
    expect(updated.materials).toEqual(['Walnut', 'Cherry']);
    expect(updated.techniques).toEqual(['Dovetails']);
    expect(updated.title).toBe('Bench');
  });

  it('refuses to remove a tag the project does not have, so typos are caught', () => {
    expect(() => editProject(bench, { removeMaterials: ['Wallnut'] })).toThrow(ContentError);
  });

  it('refuses to add a tag twice', () => {
    expect(() => editProject(bench, { addTechniques: ['Dovetails'] })).toThrow(/already has/);
  });

  it('ignores stray spaces when spotting a duplicate tag', () => {
    expect(() => editProject(bench, { addMaterials: [' Walnut'] })).toThrow(/already has/);
  });

  it('ignores stray spaces when removing a tag', () => {
    expect(editProject(bench, { removeMaterials: ['Walnut '] }).materials).toEqual(['Maple']);
  });
});

describe('naming new photos', () => {
  it('continues after the highest detail number in use', () => {
    expect(nextPhotoName(bench)).toBe('detail-2');
  });

  it('skips numbers already processed but not shown, so old copies are never overwritten', () => {
    expect(nextPhotoName(bench, { hero: {}, 'detail-1': {}, 'detail-5': {} })).toBe('detail-6');
  });
});

describe('cover photo', () => {
  it('refuses to remove the cover photo', () => {
    expect(() => removePhoto(bench, 'hero')).toThrow(/set-cover/);
  });

  it('changes the card image without moving any photos', () => {
    const updated = setCover(bench, 'detail-1');
    expect(updated.hero.name).toBe('detail-1');
    expect(updated.images).toEqual(bench.images);
  });

  it('adds a new cover at the end, leaving the order alone', () => {
    const updated = addPhoto(bench, { name: 'detail-2', alt: 'Glue-up', cover: true });
    expect(updated.hero.name).toBe('detail-2');
    expect(updated.images.map((image) => image.name ?? image.file)).toEqual(['hero', 'detail-1', 'bench.fbx', 'detail-2']);
  });

  it('keeps the cover alt text in step with the photo list', () => {
    const updated = setAlt(bench, 'hero', 'Walnut bench in the living room');
    expect(updated.hero.alt).toBe('Walnut bench in the living room');
    expect(updated.images[0].alt).toBe('Walnut bench in the living room');
  });
});

describe('ordering photos', () => {
  it('puts photos and models in the given order, keeping the cover', () => {
    const updated = reorderPhotos(bench, ['bench.fbx', 'detail-1', 'hero']);
    expect(updated.images.map((image) => image.name ?? image.file)).toEqual(['bench.fbx', 'detail-1', 'hero']);
    expect(updated.hero.name).toBe('hero');
  });

  it('refuses an order that leaves a photo out, so nothing disappears by accident', () => {
    expect(() => reorderPhotos(bench, ['bench.fbx', 'hero'])).toThrow(/missing: detail-1/);
  });

  it('refuses names that are not in the project or are listed twice', () => {
    expect(() => reorderPhotos(bench, ['hero', 'hero', 'detail-1', 'bench.fbx'])).toThrow(/listed twice: hero/);
    expect(() => reorderPhotos(bench, ['hero', 'detail-1', 'bench.fbx', 'detail-9'])).toThrow(/not in bench: detail-9/);
  });
});

describe('new projects', () => {
  const details = { title: 'Desk', description: 'A desk.', cover: { name: 'hero', alt: 'Desk' } };

  it('adds the project at the end so it shows first on the site', () => {
    const projects = createProject([bench], { id: 'walnut-desk', ...details });
    expect(projects.map((p) => p.id)).toEqual(['bench', 'walnut-desk']);
    expect(projects[1].hero).toEqual({ type: 'img', name: 'hero', alt: 'Desk' });
  });

  it('refuses an id that already exists', () => {
    expect(() => createProject([bench], { id: 'bench', ...details })).toThrow(/already exists/);
  });

  it('refuses ids that would make bad links', () => {
    expect(() => createProject([bench], { id: 'Walnut Desk', ...details })).toThrow(/can't be a project id/);
  });

  it('requires alt text on every photo', () => {
    expect(() => addPhoto(bench, { name: 'detail-2', alt: '' })).toThrow(/alt/);
  });
});
