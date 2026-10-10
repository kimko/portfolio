export class ContentError extends Error {}

const PROJECT_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function findProject(projects, id) {
  const project = projects.find((p) => p.id === id);
  if (!project) {
    const known = projects.map((p) => p.id).join(', ');
    throw new ContentError(`No project called "${id}". Projects: ${known}`);
  }
  return project;
}

export function replaceProject(projects, updated) {
  return projects.map((p) => (p.id === updated.id ? updated : p));
}

export function photoKey(image) {
  return image.type === 'fbx' ? image.thumb : image.name;
}

function findPhoto(project, name) {
  const photo = project.images.find((image) => image.type === 'img' && image.name === name);
  if (!photo) {
    const names = project.images.filter((image) => image.type === 'img').map((image) => image.name);
    throw new ContentError(`${project.id} has no photo called "${name}". Photos: ${names.join(', ')}`);
  }
  return photo;
}

export function createProject(projects, { id, title, description, materials = [], techniques = [], cover }) {
  if (!PROJECT_ID.test(id)) {
    throw new ContentError(`"${id}" can't be a project id. Use lowercase letters, numbers and dashes, like walnut-desk.`);
  }
  if (projects.some((p) => p.id === id)) {
    throw new ContentError(`A project called "${id}" already exists. Use edit or add-photo to change it.`);
  }
  if (!title || !description) {
    throw new ContentError('A new project needs a --title and a --description.');
  }
  const coverPhoto = { type: 'img', name: cover.name, alt: cover.alt };
  const project = {
    id,
    title,
    description,
    hero: coverPhoto,
    images: [coverPhoto],
    materials: unique(materials),
    techniques: unique(techniques),
  };
  return [...projects, project];
}

function unique(values) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function addTags(current, additions, kind, projectId) {
  const cleaned = unique(additions);
  for (const tag of cleaned) {
    if (current.includes(tag)) throw new ContentError(`${projectId} already has the ${kind} "${tag}".`);
  }
  return [...current, ...cleaned];
}

function removeTags(current, removals, kind, projectId) {
  const cleaned = unique(removals);
  for (const tag of cleaned) {
    if (!current.includes(tag)) {
      throw new ContentError(`${projectId} has no ${kind} "${tag}". It has: ${current.join(', ') || 'none'}`);
    }
  }
  return current.filter((tag) => !cleaned.includes(tag));
}

export function editProject(project, changes) {
  const updated = { ...project };
  if (changes.title !== undefined) updated.title = changes.title;
  if (changes.description !== undefined) updated.description = changes.description;
  updated.materials = removeTags(project.materials ?? [], changes.removeMaterials ?? [], 'material', project.id);
  updated.materials = addTags(updated.materials, changes.addMaterials ?? [], 'material', project.id);
  updated.techniques = removeTags(project.techniques ?? [], changes.removeTechniques ?? [], 'technique', project.id);
  updated.techniques = addTags(updated.techniques, changes.addTechniques ?? [], 'technique', project.id);
  return updated;
}

export function nextPhotoName(project, manifestEntries = {}) {
  const taken = [...project.images.map(photoKey), ...Object.keys(manifestEntries)];
  const numbers = taken.map((name) => /^detail-(\d+)$/.exec(name)?.[1]).filter(Boolean).map(Number);
  return `detail-${Math.max(0, ...numbers) + 1}`;
}

function withCoverFirst(project, cover) {
  const rest = project.images.filter((image) => image !== cover);
  return { ...project, hero: cover, images: [cover, ...rest] };
}

export function addPhoto(project, { name, alt, cover = false }) {
  if (!alt) throw new ContentError('Every photo needs --alt text describing what it shows.');
  if (project.images.some((image) => photoKey(image) === name)) {
    throw new ContentError(`${project.id} already has a photo called "${name}".`);
  }
  const photo = { type: 'img', name, alt };
  const updated = { ...project, images: [...project.images, photo] };
  return cover ? withCoverFirst(updated, photo) : updated;
}

export function findPhotoOrModel(project, name) {
  const item = project.images.find((image) => (image.type === 'fbx' ? image.file : image.name) === name);
  if (!item) {
    const names = project.images.map((image) => (image.type === 'fbx' ? image.file : image.name));
    throw new ContentError(`${project.id} has no photo or 3D model called "${name}". It has: ${names.join(', ')}`);
  }
  return item;
}

export function addModel(project, { file, thumb, alt }) {
  if (!alt) throw new ContentError('Every 3D model needs --alt text describing what it shows.');
  if (project.images.some((image) => image.type === 'fbx' && image.file === file)) {
    throw new ContentError(`${project.id} already has a 3D model called "${file}".`);
  }
  return { ...project, images: [...project.images, { type: 'fbx', file, thumb, alt }] };
}

export function removePhoto(project, name) {
  const photo = findPhotoOrModel(project, name);
  if (photo.type === 'img' && project.hero?.name === name) {
    throw new ContentError(`"${name}" is the cover photo of ${project.id}. Pick another cover with set-cover first.`);
  }
  return { ...project, images: project.images.filter((image) => image !== photo) };
}

export function setCover(project, name) {
  return withCoverFirst(project, findPhoto(project, name));
}

export function setAlt(project, name, alt) {
  if (!alt) throw new ContentError('Alt text can\'t be empty.');
  const photo = findPhoto(project, name);
  const updatedPhoto = { ...photo, alt };
  const images = project.images.map((image) => (image === photo ? updatedPhoto : image));
  const hero = project.hero?.name === name ? updatedPhoto : project.hero;
  return { ...project, images, hero };
}

export function tagCounts(projects) {
  const count = (field) => {
    const counts = {};
    for (const project of projects) {
      for (const tag of project[field] ?? []) counts[tag] = (counts[tag] ?? 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  };
  return { materials: count('materials'), techniques: count('techniques') };
}
