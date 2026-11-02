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

export const STAGES = ['plan', 'in-progress', 'final'];

function stagePart(stage, day) {
  if (stage === undefined) {
    if (day !== undefined) throw new ContentError('A --day needs --stage in-progress.');
    return {};
  }
  if (!STAGES.includes(stage)) throw new ContentError(`"${stage}" isn't a stage. Use ${STAGES.join(', ')}.`);
  if (day === undefined) return { stage };
  if (stage !== 'in-progress') throw new ContentError('Only in-progress photos have a day.');
  if (!Number.isInteger(day) || day < 1) throw new ContentError(`The day must be a whole number from 1 up, not "${day}".`);
  return { stage, day };
}

function compareStages(a, b) {
  const stage = (image) => (image.stage ? STAGES.indexOf(image.stage) : STAGES.length);
  const day = (image) => image.day ?? Number.MAX_SAFE_INTEGER;
  return stage(a) - stage(b) || day(a) - day(b);
}

function describeStage(image) {
  if (!image.stage) return 'no stage';
  return image.day ? `${image.stage}, day ${image.day}` : image.stage;
}

export function sortByStage(images) {
  return images.toSorted(compareStages);
}

function firstOutOfStageOrder(images) {
  const staged = images.filter((image) => image.stage);
  const index = staged.findIndex((image, i) => i > 0 && compareStages(staged[i - 1], image) > 0);
  return index === -1 ? null : [staged[index - 1], staged[index]];
}

export function stageProblems(project) {
  const unstaged = project.images.filter((image) => !image.stage);
  if (unstaged.length === project.images.length) return [];
  const problems = [];
  if (unstaged.length > 0) problems.push(`no stage on ${unstaged.map(itemName).join(', ')}`);
  const inProgress = project.images.filter((image) => image.stage === 'in-progress');
  const withDay = inProgress.filter((image) => image.day);
  if (withDay.length > 0 && withDay.length < inProgress.length) {
    problems.push(`no day on ${inProgress.filter((image) => !image.day).map(itemName).join(', ')}`);
  }
  const outOfOrder = firstOutOfStageOrder(project.images);
  if (outOfOrder) {
    const [before, after] = outOfOrder;
    problems.push(`${itemName(after)} (${describeStage(after)}) comes after ${itemName(before)} (${describeStage(before)})`);
  }
  return problems;
}

export function addPhoto(project, { name, alt, cover = false, stage, day }) {
  if (!alt) throw new ContentError('Every photo needs --alt text describing what it shows.');
  if (project.images.some((image) => photoKey(image) === name)) {
    throw new ContentError(`${project.id} already has a photo called "${name}".`);
  }
  const photo = { type: 'img', name, alt, ...stagePart(stage, day) };
  const updated = { ...project, images: sortByStage([...project.images, photo]) };
  return cover ? { ...updated, hero: photo } : updated;
}

export function itemName(image) {
  return image.type === 'fbx' ? image.file : image.name;
}

export function findPhotoOrModel(project, name) {
  const item = project.images.find((image) => itemName(image) === name);
  if (!item) {
    const names = project.images.map(itemName);
    throw new ContentError(`${project.id} has no photo or 3D model called "${name}". It has: ${names.join(', ')}`);
  }
  return item;
}

export function addModel(project, { file, thumb, alt, stage, day }) {
  if (!alt) throw new ContentError('Every 3D model needs --alt text describing what it shows.');
  if (project.images.some((image) => image.type === 'fbx' && image.file === file)) {
    throw new ContentError(`${project.id} already has a 3D model called "${file}".`);
  }
  const model = { type: 'fbx', file, thumb, alt, ...stagePart(stage, day) };
  return { ...project, images: sortByStage([...project.images, model]) };
}

function restaged(project, update) {
  const images = project.images.map(update);
  const heroIndex = project.images.findIndex((image) => image.type === 'img' && image.name === project.hero?.name);
  const hero = heroIndex === -1 ? project.hero : images[heroIndex];
  return { ...project, images: sortByStage(images), hero };
}

export function setStage(project, stage, names, { day } = {}) {
  const part = stagePart(stage, day);
  if (part.stage === undefined) throw new ContentError(`Give a stage: ${STAGES.join(', ')}.`);
  const targets = new Set(names.map((name) => findPhotoOrModel(project, name)));
  return restaged(project, (image) => {
    if (!targets.has(image)) return image;
    const updated = { ...image, ...part };
    if (part.day === undefined) delete updated.day;
    return updated;
  });
}

export function setDays(project, daysByName) {
  return restaged(project, (image) => {
    const day = daysByName.get(itemName(image));
    return day === undefined ? image : { ...image, ...stagePart('in-progress', day) };
  });
}

export function removePhoto(project, name) {
  const photo = findPhotoOrModel(project, name);
  if (photo.type === 'img' && project.hero?.name === name) {
    throw new ContentError(`"${name}" is the cover photo of ${project.id}. Pick another cover with set-cover first.`);
  }
  return { ...project, images: project.images.filter((image) => image !== photo) };
}

export function setCover(project, name) {
  return { ...project, hero: findPhoto(project, name) };
}

export function reorderPhotos(project, names) {
  const current = project.images.map(itemName);
  const unknown = names.filter((name) => !current.includes(name));
  const repeated = names.filter((name, index) => names.indexOf(name) !== index);
  const missing = current.filter((name) => !names.includes(name));
  if (unknown.length || repeated.length || missing.length) {
    const problems = [
      unknown.length && `not in ${project.id}: ${unknown.join(', ')}`,
      repeated.length && `listed twice: ${repeated.join(', ')}`,
      missing.length && `missing: ${missing.join(', ')}`,
    ].filter(Boolean);
    throw new ContentError(`List every photo and 3D model of ${project.id} exactly once (${problems.join('; ')}).`);
  }
  const images = names.map((name) => findPhotoOrModel(project, name));
  const outOfOrder = firstOutOfStageOrder(images);
  if (outOfOrder) {
    const [before, after] = outOfOrder;
    throw new ContentError(
      `That order mixes up the stages: ${itemName(after)} (${describeStage(after)}) would come after ${itemName(before)} (${describeStage(before)}). Use set-stage to move a photo to another stage.`
    );
  }
  return { ...project, images };
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
