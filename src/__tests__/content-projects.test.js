import { describe, it, expect } from 'vitest';
import {
  ContentError,
  addPhoto,
  createProject,
  editProject,
  nextPhotoName,
  removePhoto,
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

  it('moves a new cover to the front so the project opens on it', () => {
    const updated = setCover(bench, 'detail-1');
    expect(updated.hero.name).toBe('detail-1');
    expect(updated.images[0].name).toBe('detail-1');
    expect(updated.images).toHaveLength(3);
  });

  it('can add a photo straight in as the cover', () => {
    const updated = addPhoto(bench, { name: 'detail-2', alt: 'Glue-up', cover: true });
    expect(updated.hero.name).toBe('detail-2');
    expect(updated.images.map((image) => image.name ?? image.file)).toEqual(['detail-2', 'hero', 'detail-1', 'bench.fbx']);
  });

  it('keeps the cover alt text in step with the photo list', () => {
    const updated = setAlt(bench, 'hero', 'Walnut bench in the living room');
    expect(updated.hero.alt).toBe('Walnut bench in the living room');
    expect(updated.images[0].alt).toBe('Walnut bench in the living room');
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
