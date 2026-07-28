import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { select, input, confirm } from '@inquirer/prompts';

const PROJECTS_JSON_PATH = path.join(process.cwd(), 'src', 'data', 'projects.json');
const IMAGES_DIR = path.join(process.cwd(), 'public', 'images');

// Helper to read and write JSON
function loadProjects() {
  return JSON.parse(fs.readFileSync(PROJECTS_JSON_PATH, 'utf-8'));
}

function saveProjects(projects) {
  fs.writeFileSync(PROJECTS_JSON_PATH, JSON.stringify(projects, null, 2));
}

// Ensure directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Ask for basic details
async function promptDetails(existing = {}) {
  const id = existing.id || await input({ message: 'Project ID (e.g. shaker-bench):' });
  const title = await input({ message: 'Title:', default: existing.title });
  const shortDescription = await input({ message: 'Short Description:', default: existing.shortDescription });
  const fullDescription = await input({ message: 'Full Description:', default: existing.fullDescription });
  
  const mats = await input({ message: 'Materials (comma separated):', default: (existing.materials || []).join(', ') });
  const materials = mats.split(',').map(m => m.trim()).filter(Boolean);
  
  const techs = await input({ message: 'Techniques (comma separated):', default: (existing.techniques || []).join(', ') });
  const techniques = techs.split(',').map(m => m.trim()).filter(Boolean);

  return { id, title, shortDescription, fullDescription, materials, techniques };
}

// Scan image directory
async function processImages(projectId) {
  const projectImgDir = path.join(IMAGES_DIR, projectId);
  ensureDir(projectImgDir);
  
  await confirm({ message: `Please place all images and FBX models into public/images/${projectId}/ now. Press Enter when ready.` });

  const files = fs.readdirSync(projectImgDir).filter(f => !f.startsWith('.'));
  
  if (files.length === 0) {
    console.log('No files found in directory.');
    return { hero: null, images: [] };
  }

  const images = [];
  let hero = null;

  for (const file of files) {
    const isFbx = file.endsWith('.fbx');
    const isImage = /\.(jpg|jpeg|png|webp)$/i.test(file);
    
    if (isFbx) {
      // Find matching preview thumbnail (assuming it exists, or ask)
      const baseName = path.basename(file, '.fbx');
      const thumb = await input({ message: `Preview thumbnail name (without extension) for ${file}?`, default: `${baseName}_preview` });
      const alt = await input({ message: `Alt text for ${file}?`, default: `${baseName} 3D Model` });
      
      images.push({ type: 'fbx', file, thumb, alt });
      
    } else if (isImage) {
      // It's an image. What's its ID?
      const baseName = path.parse(file).name;
      const isHero = hero === null ? await confirm({ message: `Is ${file} the hero image?` }) : false;
      const name = isHero ? 'hero' : await input({ message: `Internal name for ${file} (e.g. detail-1)?`, default: baseName });
      const alt = await input({ message: `Alt text for ${file}?` });

      const imgObj = { type: 'img', name, alt };
      images.push(imgObj);
      
      if (isHero) hero = imgObj;
    }
  }

  if (!hero && images.length > 0) {
    const firstImg = images.find(img => img.type === 'img');
    if (firstImg) hero = firstImg;
  }

  return { hero, images };
}

async function addProject() {
  console.log('\n--- Add New Project ---');
  const details = await promptDetails();
  const { hero, images } = await processImages(details.id);

  const project = { ...details, hero, images };
  const projects = loadProjects();
  projects.push(project);
  
  saveProjects(projects);
  
  console.log('\nRunning image optimizer...');
  execSync('npm run optimize', { stdio: 'inherit' });
  console.log('\nProject added successfully!');
}

async function editProject() {
  console.log('\n--- Edit Project ---');
  const projects = loadProjects();
  
  if (projects.length === 0) {
    console.log('No projects to edit.');
    return;
  }

  const projectId = await select({
    message: 'Select a project to edit:',
    choices: projects.map(p => ({ name: p.title, value: p.id }))
  });

  const index = projects.findIndex(p => p.id === projectId);
  const project = projects[index];

  const details = await promptDetails(project);
  
  const updateImages = await confirm({ message: 'Do you want to re-scan and update the images?' });
  let newImgData = { hero: project.hero, images: project.images };
  
  if (updateImages) {
    newImgData = await processImages(project.id);
  }

  projects[index] = { ...details, ...newImgData };
  saveProjects(projects);

  if (updateImages) {
    console.log('\nRunning image optimizer...');
    execSync('npm run optimize', { stdio: 'inherit' });
  }

  console.log('\nProject updated successfully!');
}

async function removeProject() {
  console.log('\n--- Remove Project ---');
  const projects = loadProjects();
  
  if (projects.length === 0) {
    console.log('No projects to remove.');
    return;
  }

  const projectId = await select({
    message: 'Select a project to remove:',
    choices: projects.map(p => ({ name: p.title, value: p.id }))
  });

  const index = projects.findIndex(p => p.id === projectId);
  projects.splice(index, 1);
  saveProjects(projects);

  const deleteDir = await confirm({ message: `Delete the public/images/${projectId} folder?` });
  if (deleteDir) {
    const projectImgDir = path.join(IMAGES_DIR, projectId);
    if (fs.existsSync(projectImgDir)) {
      fs.rmSync(projectImgDir, { recursive: true, force: true });
    }
    // Note: optimization script won't automatically clean up the optimized dir, 
    // but this removes the source.
  }

  console.log('\nProject removed successfully!');
}

async function main() {
  while (true) {
    const action = await select({
      message: 'What would you like to do?',
      choices: [
        { name: 'Add Project', value: 'add' },
        { name: 'Edit Project', value: 'edit' },
        { name: 'Remove Project', value: 'remove' },
        { name: 'Exit', value: 'exit' },
      ],
    });

    if (action === 'exit') break;

    try {
      if (action === 'add') await addProject();
      if (action === 'edit') await editProject();
      if (action === 'remove') await removeProject();
    } catch (err) {
      console.error('Operation cancelled or failed:', err.message);
    }
  }
}

main().catch(console.error);
