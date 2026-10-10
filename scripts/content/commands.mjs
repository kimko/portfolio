import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { loadState, saveState } from './store.mjs';
import { deleteCopies, fingerprint, isPhotoFile, makeCopies } from './photos.mjs';
import {
  ContentError,
  addModel,
  addPhoto,
  createProject,
  editProject,
  findPhotoOrModel,
  findProject,
  nextPhotoName,
  photoKey,
  removePhoto,
  replaceProject,
  setAlt,
  setCover,
  tagCounts,
} from './projects.mjs';

async function listFolder(dir) {
  try {
    return (await fs.readdir(dir, { withFileTypes: true })).filter((entry) => !entry.name.startsWith('.'));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

function mapEntriesFor(photoMap, projectId) {
  return Object.entries(photoMap).filter(([key]) => key.startsWith(`${projectId}/`));
}

function resolveOriginal(paths, projectId, file) {
  const dropFolder = path.join(paths.originals, projectId);
  const candidates = [path.resolve(file), path.join(dropFolder, file)];
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) throw new ContentError(`Can't find ${file}. Put it in content/originals/${projectId}/ or give its full path.`);
  if (!isPhotoFile(found)) throw new ContentError(`${path.basename(found)} isn't a photo (JPEG, PNG or HEIC).`);
  const destination = path.join(dropFolder, path.basename(found));
  return { found, destination, key: `${projectId}/${path.basename(found)}`, needsCopy: found !== destination };
}

async function ingestPhoto({ paths, state, projectId, file, name, dryRun }) {
  const original = resolveOriginal(paths, projectId, file);
  const existing = state.photoMap[original.key];
  if (existing?.photo) {
    throw new ContentError(`${original.key} is already on the site as "${existing.photo}".`);
  }
  if (original.needsCopy && existsSync(original.destination)) {
    throw new ContentError(`content/originals/${original.key} already exists. Rename the new file and try again.`);
  }
  if (dryRun) return { original };

  if (original.needsCopy) {
    await fs.mkdir(path.dirname(original.destination), { recursive: true });
    await fs.copyFile(original.found, original.destination);
  }
  const { entry, sizes } = await makeCopies(original.destination, {
    optimizedDir: paths.optimized,
    projectId,
    name,
  });
  state.manifest[projectId] = { ...state.manifest[projectId], [name]: entry };
  state.photoMap[original.key] = { photo: name, sha1: await fingerprint(original.destination) };
  return { original, sizes };
}

function describeSizes(sizes) {
  if (!sizes) return '';
  const kb = (info) => `${Math.round(info.size / 1024)} KB`;
  return ` (card ${sizes.thumb.width}x${sizes.thumb.height}, ${kb(sizes.thumb)}; full ${sizes.full.width}x${sizes.full.height}, ${kb(sizes.full)})`;
}

export async function status(paths) {
  const { projects, photoMap } = await loadState(paths);
  const projectIds = new Set(projects.map((p) => p.id));
  const report = { newPhotos: {}, newProjects: {}, newModels: {}, changed: [], missingOriginals: [] };

  for (const folder of await listFolder(paths.originals)) {
    if (!folder.isDirectory()) continue;
    const entries = (await listFolder(path.join(paths.originals, folder.name))).filter((entry) => entry.isFile());
    const files = entries.map((entry) => entry.name).filter(isPhotoFile).sort();
    const models = entries.map((entry) => entry.name).filter((name) => path.extname(name).toLowerCase() === '.fbx');
    for (const model of models.sort()) {
      if (!existsSync(path.join(paths.models, folder.name, model))) (report.newModels[folder.name] ??= []).push(model);
    }
    for (const file of files) {
      const key = `${folder.name}/${file}`;
      const known = photoMap[key];
      if (!known) {
        const bucket = projectIds.has(folder.name) ? report.newPhotos : report.newProjects;
        (bucket[folder.name] ??= []).push(file);
      } else if (known.photo && known.sha1 !== (await fingerprint(path.join(paths.originals, key)))) {
        report.changed.push({ original: key, photo: known.photo });
      }
    }
  }

  for (const [key, entry] of Object.entries(photoMap)) {
    if (entry.photo && !existsSync(path.join(paths.originals, key))) {
      report.missingOriginals.push({ original: key, photo: entry.photo });
    }
  }
  return report;
}

export async function list(paths, projectId) {
  const { projects } = await loadState(paths);
  return projectId ? [findProject(projects, projectId)] : projects;
}

export async function tags(paths) {
  const { projects } = await loadState(paths);
  return tagCounts(projects);
}

export async function newProject(paths, projectId, options, { dryRun = false } = {}) {
  if (!options.photo) throw new ContentError('A new project needs a cover photo: --photo <file> --alt <text>.');
  if (!options.alt) throw new ContentError('The cover photo needs --alt text describing what it shows.');
  const state = await loadState(paths);
  const projects = createProject(state.projects, {
    id: projectId,
    title: options.title,
    description: options.description,
    materials: options.materials,
    techniques: options.techniques,
    cover: { name: 'hero', alt: options.alt },
  });
  const { original, sizes } = await ingestPhoto({ paths, state, projectId, file: options.photo, name: 'hero', dryRun });
  if (!dryRun) await saveState(paths, { ...state, projects });
  return `Created ${projectId} "${options.title}" with cover photo ${original.key}${describeSizes(sizes)}`;
}

export async function edit(paths, projectId, changes, { dryRun = false } = {}) {
  const state = await loadState(paths);
  const before = findProject(state.projects, projectId);
  const after = editProject(before, changes);
  const changed = ['title', 'description', 'materials', 'techniques'].filter(
    (field) => JSON.stringify(before[field]) !== JSON.stringify(after[field])
  );
  if (changed.length === 0) throw new ContentError('Nothing to change. Give at least one of the edit options.');
  if (!dryRun) await saveState(paths, { ...state, projects: replaceProject(state.projects, after) });
  return `Updated ${changed.join(', ')} on ${projectId}`;
}

export async function addPhotoCommand(paths, projectId, file, { alt, cover = false }, { dryRun = false } = {}) {
  const state = await loadState(paths);
  const project = findProject(state.projects, projectId);
  const name = nextPhotoName(project, state.manifest[projectId]);
  const updated = addPhoto(project, { name, alt, cover });
  const { original, sizes } = await ingestPhoto({ paths, state, projectId, file, name, dryRun });
  if (!dryRun) await saveState(paths, { ...state, projects: replaceProject(state.projects, updated) });
  return `Added ${original.key} to ${projectId} as ${name}${cover ? ' (cover)' : ''}${describeSizes(sizes)}`;
}

export async function skip(paths, projectId, file, { dryRun = false } = {}) {
  const state = await loadState(paths);
  const original = resolveOriginal(paths, projectId, file);
  if (original.needsCopy) throw new ContentError(`Only photos already in content/originals/${projectId}/ can be skipped.`);
  const existing = state.photoMap[original.key];
  if (existing?.photo) {
    throw new ContentError(`${original.key} is on the site as "${existing.photo}". Use remove-photo instead.`);
  }
  if (!dryRun) {
    state.photoMap[original.key] = { skipped: true, sha1: await fingerprint(original.found) };
    await saveState(paths, state);
  }
  return `Skipped ${original.key}; status won't offer it again`;
}

export async function removePhotoCommand(paths, projectId, name, { dryRun = false } = {}) {
  const state = await loadState(paths);
  const project = findProject(state.projects, projectId);
  const item = findPhotoOrModel(project, name);
  const updated = removePhoto(project, name);
  const copiesName = photoKey(item);
  if (!dryRun) {
    await deleteCopies({ optimizedDir: paths.optimized, projectId, name: copiesName });
    if (item.type === 'fbx') await fs.rm(path.join(paths.models, projectId, item.file), { force: true });
    if (state.manifest[projectId]) delete state.manifest[projectId][copiesName];
    for (const [key, entry] of mapEntriesFor(state.photoMap, projectId)) {
      if (entry.photo === copiesName) state.photoMap[key] = { skipped: true, sha1: entry.sha1 };
    }
    await saveState(paths, { ...state, projects: replaceProject(state.projects, updated) });
  }
  return `Removed ${name} from ${projectId}; the original stays in content/originals/${projectId}/`;
}

export async function addModelCommand(paths, projectId, file, { preview, alt }, { dryRun = false } = {}) {
  if (!preview) throw new ContentError('A 3D model needs a --preview image for its thumbnail.');
  const state = await loadState(paths);
  const project = findProject(state.projects, projectId);
  const candidates = [path.resolve(file), path.join(paths.originals, projectId, file)];
  const model = candidates.find((candidate) => existsSync(candidate));
  if (!model) throw new ContentError(`Can't find ${file}. Put it in content/originals/${projectId}/ or give its full path.`);
  if (path.extname(model).toLowerCase() !== '.fbx') throw new ContentError(`${path.basename(model)} isn't an .fbx model.`);
  const modelName = path.basename(model);
  const destination = path.join(paths.models, projectId, modelName);
  if (existsSync(destination)) throw new ContentError(`public/models/${projectId}/${modelName} already exists.`);

  const thumb = `${path.parse(modelName).name}_preview`;
  const updated = addModel(project, { file: modelName, thumb, alt });
  const { original, sizes } = await ingestPhoto({ paths, state, projectId, file: preview, name: thumb, dryRun });
  if (!dryRun) {
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(model, destination);
    await saveState(paths, { ...state, projects: replaceProject(state.projects, updated) });
  }
  return `Added 3D model ${modelName} to ${projectId} with preview ${original.key}${describeSizes(sizes)}`;
}

export async function setCoverCommand(paths, projectId, name, { dryRun = false } = {}) {
  const state = await loadState(paths);
  const updated = setCover(findProject(state.projects, projectId), name);
  if (!dryRun) await saveState(paths, { ...state, projects: replaceProject(state.projects, updated) });
  return `${name} is now the cover photo of ${projectId}`;
}

export async function setAltCommand(paths, projectId, name, alt, { dryRun = false } = {}) {
  const state = await loadState(paths);
  const updated = setAlt(findProject(state.projects, projectId), name, alt);
  if (!dryRun) await saveState(paths, { ...state, projects: replaceProject(state.projects, updated) });
  return `Updated the alt text of ${name} on ${projectId}`;
}

export async function removeProject(paths, projectId, { dryRun = false } = {}) {
  const state = await loadState(paths);
  findProject(state.projects, projectId);
  if (!dryRun) {
    await fs.rm(path.join(paths.optimized, projectId), { recursive: true, force: true });
    await fs.rm(path.join(paths.models, projectId), { recursive: true, force: true });
    delete state.manifest[projectId];
    for (const [key, entry] of mapEntriesFor(state.photoMap, projectId)) {
      state.photoMap[key] = { skipped: true, sha1: entry.sha1 };
    }
    await saveState(paths, { ...state, projects: state.projects.filter((p) => p.id !== projectId) });
  }
  return `Removed ${projectId}; its originals stay in content/originals/${projectId}/`;
}

export async function rebuild(paths, projectId, { dryRun = false } = {}) {
  const state = await loadState(paths);
  if (projectId) findProject(state.projects, projectId);
  const targets = Object.entries(state.photoMap).filter(
    ([key, entry]) => entry.photo && (!projectId || key.startsWith(`${projectId}/`))
  );
  const missing = targets.filter(([key]) => !existsSync(path.join(paths.originals, key))).map(([key]) => key);
  if (missing.length > 0) {
    throw new ContentError(`Can't rebuild without these originals on this computer: ${missing.join(', ')}`);
  }
  if (dryRun) return `${targets.length} photos to remake from their originals`;
  for (const [key, entry] of targets) {
    const [id] = key.split('/');
    const file = path.join(paths.originals, key);
    const { entry: manifestEntry } = await makeCopies(file, { optimizedDir: paths.optimized, projectId: id, name: entry.photo });
    state.manifest[id] = { ...state.manifest[id], [entry.photo]: manifestEntry };
    state.photoMap[key] = { photo: entry.photo, sha1: await fingerprint(file) };
  }
  await saveState(paths, state);
  return `Remade ${targets.length} photos`;
}

export async function check(paths) {
  const { projects, manifest } = await loadState(paths);
  const problems = [];
  const unused = [];

  for (const project of projects) {
    const entries = manifest[project.id] ?? {};
    if (!project.hero || !project.images.some((image) => photoKey(image) === project.hero.name)) {
      problems.push(`${project.id}: the cover photo isn't in its photo list`);
    }
    for (const image of project.images) {
      const key = photoKey(image);
      const entry = entries[key];
      if (!entry) {
        problems.push(`${project.id}: ${key} has no optimized copies`);
        continue;
      }
      for (const file of [entry.thumb, entry.full]) {
        if (!existsSync(path.join(paths.root, 'public', file))) problems.push(`${project.id}: missing ${file}`);
      }
      if (image.type === 'fbx' && !existsSync(path.join(paths.models, project.id, image.file))) {
        problems.push(`${project.id}: missing 3D model public/models/${project.id}/${image.file}`);
      }
    }
    const used = new Set(project.images.map(photoKey));
    for (const key of Object.keys(entries)) {
      if (!used.has(key)) unused.push(`${project.id}/${key}`);
    }
  }
  return { problems, unused };
}
