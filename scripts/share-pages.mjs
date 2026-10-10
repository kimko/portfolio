import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { photoKey } from './content/projects.mjs';

export const SITE_URL = 'https://kimko.github.io/portfolio/';
export const PREVIEW = { width: 1200, height: 630, quality: 80, background: '#15130F' };
const SITE_NAME = 'Woodworks';
const DESCRIPTION_LIMIT = 160;

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

export function shorten(text, limit = DESCRIPTION_LIMIT) {
  const firstSentence = text.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? text;
  if (firstSentence.length <= limit) return firstSentence;
  const cut = firstSentence.slice(0, limit + 1);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:]$/, '')}…`;
}

function renderPage({ title, description, pageUrl, imageUrl, imageAlt, target, linkText }) {
  const e = escapeHtml;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${e(title)}</title>
<meta name="description" content="${e(description)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:title" content="${e(title)}">
<meta property="og:description" content="${e(description)}">
<meta property="og:url" content="${e(pageUrl)}">
<meta property="og:image" content="${e(imageUrl)}">
<meta property="og:image:width" content="${PREVIEW.width}">
<meta property="og:image:height" content="${PREVIEW.height}">
<meta property="og:image:alt" content="${e(imageAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0; url=${e(target)}">
<script>location.replace(${JSON.stringify(target)})</script>
</head>
<body><a href="${e(target)}">${e(linkText)}</a></body>
</html>
`;
}

export function sharePages(projects, manifest, { siteUrl = SITE_URL } = {}) {
  const basePath = new URL(siteUrl).pathname;
  const pages = [];

  const addPage = (project, pagePath, { key, description, imageAlt, target }) => {
    const entry = manifest[project.id]?.[key];
    if (!entry) throw new Error(`${project.id}/${key} has no web copies; run npm run content -- check`);
    pages.push({
      path: pagePath,
      html: renderPage({
        title: `${project.title} · ${SITE_NAME}`,
        description,
        pageUrl: new URL(pagePath, siteUrl).href,
        imageUrl: new URL(`${pagePath}preview.jpg`, siteUrl).href,
        imageAlt,
        target: `${basePath}${target}`,
        linkText: `Open ${project.title}`,
      }),
      image: { source: entry.full, output: `${pagePath}preview.jpg` },
    });
  };

  for (const project of projects) {
    const projectRoute = `#/project/${project.id}`;
    addPage(project, `p/${project.id}/`, {
      key: project.hero.name,
      description: shorten(project.description),
      imageAlt: project.hero.alt,
      target: projectRoute,
    });
    project.images.forEach((image, index) => {
      const key = photoKey(image);
      addPage(project, `p/${project.id}/${key}/`, {
        key,
        description: image.alt,
        imageAlt: image.alt,
        target: index === 0 ? projectRoute : `${projectRoute}/image/${index + 1}`,
      });
    });
  }
  return pages;
}

async function writeSharePages(root) {
  const dist = path.join(root, 'dist');
  const readJson = async (file) => JSON.parse(await fs.readFile(path.join(root, file), 'utf-8'));
  const pages = sharePages(await readJson('src/data/projects.json'), await readJson('src/data/image-manifest.json'));

  await Promise.all(
    pages.map(async (page) => {
      await fs.mkdir(path.join(dist, page.path), { recursive: true });
      await fs.writeFile(path.join(dist, page.path, 'index.html'), page.html);
      await sharp(path.join(dist, page.image.source))
        .resize(PREVIEW.width, PREVIEW.height, { fit: 'contain', background: PREVIEW.background })
        .flatten({ background: PREVIEW.background })
        .jpeg({ quality: PREVIEW.quality, mozjpeg: true })
        .toFile(path.join(dist, page.image.output));
    })
  );
  console.log(`Wrote ${pages.length} share pages with link previews to dist/p/`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeSharePages(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
