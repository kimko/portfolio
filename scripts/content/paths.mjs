import path from 'node:path';

export function contentPaths(root) {
  return {
    root,
    projects: path.join(root, 'src', 'data', 'projects.json'),
    manifest: path.join(root, 'src', 'data', 'image-manifest.json'),
    optimized: path.join(root, 'public', 'images-optimized'),
    models: path.join(root, 'public', 'models'),
    originals: path.join(root, 'content', 'originals'),
    photoMap: path.join(root, 'content', 'photo-map.json'),
  };
}
