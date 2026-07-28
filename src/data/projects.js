import manifest from './image-manifest.json';

const base = import.meta.env.BASE_URL;

// Helper to build image objects from manifest
function img(projectId, imageName, alt) {
  const data = manifest[projectId]?.[imageName];
  if (!data) {
    return { thumb: '', full: '', blur: '', alt };
  }
  return {
    thumb: `${base}${data.thumb}`,
    full: `${base}${data.full}`,
    blur: data.blur,
    alt,
  };
}

// Helper to build 3D fbx objects
function fbx(projectId, fbxName, thumbName, alt) {
  const data = manifest[projectId]?.[thumbName];
  return {
    is3D: true,
    url: `${base}/images/${projectId}/${fbxName}`,
    thumb: data ? `${base}${data.thumb}` : '',
    blur: data ? data.blur : undefined,
    alt,
  };
}

import projectsData from './projects.json';

export const projects = projectsData.map(project => ({
  ...project,
  hero: project.hero.type === 'img' 
    ? img(project.id, project.hero.name, project.hero.alt)
    : fbx(project.id, project.hero.file, project.hero.thumb, project.hero.alt),
  images: project.images.map(image => 
    image.type === 'img'
      ? img(project.id, image.name, image.alt)
      : fbx(project.id, image.file, image.thumb, image.alt)
  )
}));
