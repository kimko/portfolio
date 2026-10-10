import fs from 'node:fs/promises';

export async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf-8'));
  } catch (error) {
    if (error.code === 'ENOENT' && fallback !== undefined) return fallback;
    throw error;
  }
}

export async function writeJson(file, data, { trailingNewline = true } = {}) {
  await fs.writeFile(file, JSON.stringify(data, null, 2) + (trailingNewline ? '\n' : ''));
}

export async function loadState(paths) {
  const [projects, manifest, photoMap] = await Promise.all([
    readJson(paths.projects),
    readJson(paths.manifest, {}),
    readJson(paths.photoMap, {}),
  ]);
  return { projects, manifest, photoMap };
}

export async function saveState(paths, { projects, manifest, photoMap }) {
  await Promise.all([
    writeJson(paths.projects, projects),
    writeJson(paths.manifest, manifest, { trailingNewline: false }),
    writeJson(paths.photoMap, photoMap),
  ]);
}
