import { describe, it, expect } from 'vitest';
import { sharePages, shorten } from '../../scripts/share-pages.mjs';

const cover = { type: 'img', name: 'hero', alt: 'Finished "walnut" bench <front>' };
const bench = {
  id: 'bench',
  title: 'Bench & Stool',
  description: 'A bench built in class. It has dovetails.',
  hero: cover,
  images: [
    { type: 'fbx', file: 'bench.fbx', thumb: 'bench_preview', alt: 'Bench model' },
    cover,
    { type: 'img', name: 'detail-1', alt: 'Glue-up' },
  ],
};
const manifest = {
  bench: Object.fromEntries(
    ['hero', 'detail-1', 'bench_preview'].map((key) => [key, { full: `images-optimized/bench/full-${key}.webp` }])
  ),
};

const pageAt = (pages, path) => pages.find((page) => page.path === path);
const tag = (html, property) => new RegExp(`property="${property}" content="([^"]*)"`).exec(html)?.[1];

describe('share pages', () => {
  it('makes one page for the project and one per photo or 3D model', () => {
    const paths = sharePages([bench], manifest).map((page) => page.path);
    expect(paths).toEqual(['p/bench/', 'p/bench/bench_preview/', 'p/bench/hero/', 'p/bench/detail-1/']);
  });

  it('previews each photo with its own image and caption', () => {
    const page = pageAt(sharePages([bench], manifest), 'p/bench/detail-1/');
    expect(tag(page.html, 'og:image')).toBe('https://kimko.github.io/portfolio/p/bench/detail-1/preview.jpg');
    expect(tag(page.html, 'og:url')).toBe('https://kimko.github.io/portfolio/p/bench/detail-1/');
    expect(tag(page.html, 'og:description')).toBe('Glue-up');
    expect(page.image).toEqual({ source: 'images-optimized/bench/full-detail-1.webp', output: 'p/bench/detail-1/preview.jpg' });
  });

  it('previews the project with its cover photo and the first sentence of its description', () => {
    const page = pageAt(sharePages([bench], manifest), 'p/bench/');
    expect(page.image.source).toBe('images-optimized/bench/full-hero.webp');
    expect(tag(page.html, 'og:description')).toBe('A bench built in class.');
  });

  it('forwards to the photo where it currently sits, so reordering keeps shared links working', () => {
    const before = pageAt(sharePages([bench], manifest), 'p/bench/detail-1/');
    expect(before.html).toContain('url=/portfolio/#/project/bench/image/3');

    const reordered = { ...bench, images: [bench.images[2], bench.images[0], bench.images[1]] };
    const after = pageAt(sharePages([reordered], manifest), 'p/bench/detail-1/');
    expect(after.html).toContain('url=/portfolio/#/project/bench"');
  });

  it('escapes titles and captions so quotes and angle brackets cannot break the page', () => {
    const html = pageAt(sharePages([bench], manifest), 'p/bench/hero/').html;
    expect(html).toContain('<title>Bench &amp; Stool · Woodworks</title>');
    expect(tag(html, 'og:description')).toBe('Finished &quot;walnut&quot; bench &lt;front&gt;');
  });

  it('stops the build when a photo has no web copies', () => {
    expect(() => sharePages([bench], { bench: {} })).toThrow(/bench\/hero has no web copies/);
  });
});

describe('shortening descriptions', () => {
  it('keeps a short first sentence as it is', () => {
    expect(shorten('Short one. Then more.')).toBe('Short one.');
  });

  it('cuts a long first sentence on a word boundary', () => {
    const long = `${'word '.repeat(50)}end.`;
    const result = shorten(long, 40);
    expect(result.length).toBeLessThanOrEqual(41);
    expect(result).toMatch(/word…$/);
  });
});
