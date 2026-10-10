import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { contentPaths } from './paths.mjs';
import { ContentError } from './projects.mjs';
import * as commands from './commands.mjs';

const USAGE = `Usage: npm run content -- <command> [options]

Look around
  status                         New photos in content/originals/ and anything out of date
  list [project]                 Projects, photos, tags and descriptions
  tags                           Materials and techniques in use, with counts
  check                          Every photo on the site has its files

Change things (add --dry-run to preview)
  new <project> --title <t> --description <d> --photo <file> --alt <text>
      [--material <m>]... [--technique <t>]...
  edit <project> [--title <t>] [--description <d>]
      [--add-material <m>]... [--remove-material <m>]...
      [--add-technique <t>]... [--remove-technique <t>]...
  add-photo <project> <file> --alt <text> [--cover]
  add-model <project> <model.fbx> --preview <image> --alt <text>
  skip <project> <file>          Don't offer this dropped photo again
  remove-photo <project> <photo or model.fbx>
  set-cover <project> <photo>   Card image; doesn't change the order
  order <project> <photo>...    Every photo and model, in the order to show them
  set-alt <project> <photo> <text>
  remove-project <project>
  rebuild [project]              Remake web copies from the originals

Add --json to status, list, tags or check for machine-readable output.`;

const OPTIONS = {
  title: { type: 'string' },
  description: { type: 'string' },
  photo: { type: 'string' },
  preview: { type: 'string' },
  alt: { type: 'string' },
  cover: { type: 'boolean' },
  material: { type: 'string', multiple: true },
  technique: { type: 'string', multiple: true },
  'add-material': { type: 'string', multiple: true },
  'remove-material': { type: 'string', multiple: true },
  'add-technique': { type: 'string', multiple: true },
  'remove-technique': { type: 'string', multiple: true },
  'dry-run': { type: 'boolean' },
  json: { type: 'boolean' },
  help: { type: 'boolean', short: 'h' },
};

function needs(positionals, count, usage) {
  if (positionals.length < count) throw new ContentError(`Usage: npm run content -- ${usage}`);
  return positionals;
}

function printStatus(report) {
  const lines = [];
  for (const [id, files] of Object.entries(report.newPhotos)) {
    lines.push(`New photos in ${id} (${files.length}): ${files.join(', ')}`);
  }
  for (const [id, files] of Object.entries(report.newProjects)) {
    lines.push(`New project folder ${id} (${files.length} photos): ${files.join(', ')}`);
  }
  for (const [id, files] of Object.entries(report.newModels)) {
    lines.push(`New 3D models in ${id}: ${files.join(', ')}`);
  }
  for (const { original, photo } of report.changed) {
    lines.push(`Changed since it was processed: ${original} (${photo}). Run rebuild to update the site copy.`);
  }
  if (report.missingOriginals.length > 0) {
    lines.push(`${report.missingOriginals.length} site photos have no original on this computer. The site still works; only rebuild needs them.`);
  }
  return lines.length > 0 ? lines.join('\n') : 'Nothing new in content/originals/.';
}

function printProjects(projects) {
  return projects
    .map((project) => {
      const photos = project.images.map((image) => {
        const name = image.type === 'fbx' ? `${image.file} [3D]` : image.name;
        const cover = image.type === 'img' && image.name === project.hero?.name ? ' (cover)' : '';
        return `    ${name}${cover}: ${image.alt}`;
      });
      return [
        `${project.id}: ${project.title}`,
        `  Materials: ${project.materials.join(', ') || 'none'}`,
        `  Techniques: ${project.techniques.join(', ') || 'none'}`,
        '  Photos:',
        ...photos,
        `  Description: ${project.description}`,
      ].join('\n');
    })
    .join('\n\n');
}

function printTags({ materials, techniques }) {
  const format = (entries) => entries.map(([tag, count]) => `${tag} (${count})`).join(', ');
  return `Materials: ${format(materials)}\nTechniques: ${format(techniques)}`;
}

function printCheck({ problems, unused }) {
  const lines = problems.length > 0 ? ['Problems:', ...problems.map((p) => `  ${p}`)] : ['All site photos have their files.'];
  if (unused.length > 0) lines.push(`Processed but not used on the site: ${unused.join(', ')}`);
  return lines.join('\n');
}

async function main(argv) {
  const { values, positionals } = parseArgs({ args: argv, options: OPTIONS, allowPositionals: true });
  const [command, ...rest] = positionals;
  if (!command || values.help) return { text: USAGE };

  const paths = contentPaths(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..'));
  const write = { dryRun: Boolean(values['dry-run']) };
  const output = (data, format) => (values.json ? { json: data } : { text: format(data) });
  const changed = (summary) => ({ text: write.dryRun ? `Dry run, nothing written: ${summary}` : summary });

  switch (command) {
    case 'status':
      return output(await commands.status(paths), printStatus);
    case 'list':
      return output(await commands.list(paths, rest[0]), printProjects);
    case 'tags':
      return output(await commands.tags(paths), printTags);
    case 'check': {
      const result = await commands.check(paths);
      return { ...output(result, printCheck), failed: result.problems.length > 0 };
    }
    case 'new': {
      const [id] = needs(rest, 1, 'new <project> --title <t> --description <d> --photo <file> --alt <text>');
      return changed(
        await commands.newProject(
          paths,
          id,
          {
            title: values.title,
            description: values.description,
            photo: values.photo,
            alt: values.alt,
            materials: values.material ?? [],
            techniques: values.technique ?? [],
          },
          write
        )
      );
    }
    case 'edit': {
      const [id] = needs(rest, 1, 'edit <project> [options]');
      return changed(
        await commands.edit(
          paths,
          id,
          {
            title: values.title,
            description: values.description,
            addMaterials: values['add-material'],
            removeMaterials: values['remove-material'],
            addTechniques: values['add-technique'],
            removeTechniques: values['remove-technique'],
          },
          write
        )
      );
    }
    case 'add-photo': {
      const [id, file] = needs(rest, 2, 'add-photo <project> <file> --alt <text> [--cover]');
      return changed(await commands.addPhotoCommand(paths, id, file, { alt: values.alt, cover: values.cover }, write));
    }
    case 'add-model': {
      const [id, file] = needs(rest, 2, 'add-model <project> <model.fbx> --preview <image> --alt <text>');
      return changed(await commands.addModelCommand(paths, id, file, { preview: values.preview, alt: values.alt }, write));
    }
    case 'skip': {
      const [id, file] = needs(rest, 2, 'skip <project> <file>');
      return changed(await commands.skip(paths, id, file, write));
    }
    case 'remove-photo': {
      const [id, name] = needs(rest, 2, 'remove-photo <project> <photo>');
      return changed(await commands.removePhotoCommand(paths, id, name, write));
    }
    case 'set-cover': {
      const [id, name] = needs(rest, 2, 'set-cover <project> <photo>');
      return changed(await commands.setCoverCommand(paths, id, name, write));
    }
    case 'order': {
      const [id, ...names] = needs(rest, 2, 'order <project> <photo or model.fbx>...');
      return changed(await commands.order(paths, id, names, write));
    }
    case 'set-alt': {
      const [id, name, alt] = needs(rest, 3, 'set-alt <project> <photo> <text>');
      return changed(await commands.setAltCommand(paths, id, name, alt, write));
    }
    case 'remove-project': {
      const [id] = needs(rest, 1, 'remove-project <project>');
      return changed(await commands.removeProject(paths, id, write));
    }
    case 'rebuild':
      return changed(await commands.rebuild(paths, rest[0], write));
    default:
      throw new ContentError(`Unknown command "${command}".\n\n${USAGE}`);
  }
}

main(process.argv.slice(2))
  .then(({ text, json, failed }) => {
    console.log(json !== undefined ? JSON.stringify(json, null, 2) : text);
    if (failed) process.exitCode = 1;
  })
  .catch((error) => {
    const isUsageError = error instanceof ContentError || error.code?.startsWith('ERR_PARSE_ARGS');
    console.error(isUsageError ? error.message : error);
    process.exitCode = 1;
  });
