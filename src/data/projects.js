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

export const projects = [
  {
    id: 'small-table',
    title: 'Small Table',
    shortDescription:
      'Built during the "Foundations of Furniture Making" class at Chicago School of Woodworking, focused on precision milling and mortise-and-tenon joinery.',
    fullDescription:
      'This small table was my first furniture project, built during the "Foundations of Furniture Making" class at the Chicago School of Woodworking. The core focus of the class was the milling process -- jointing a face and an edge, ripping to width, planing to thickness, and crosscutting to final length, ensuring each board is accurately squared and ready for joinery and assembly. The table features mortise-and-tenon joinery created using a router table, mortising machine, tenoning jig, and a Festool Domino.',
    hero: img('small-table', 'hero', 'Completed small table'),
    images: [
      img('small-table', 'hero', 'Completed small table'),
    ],
  },
  {
    id: 'shaker-bench',
    title: 'Shaker Style Bench',
    shortDescription:
      'Frame-and-panel construction with half-blind dovetails and tongue-and-groove joints, built at Chicago School of Woodworking.',
    fullDescription:
      'This Shaker-style bench was built during the "Furniture Making - Joinery and Jigs" class at the Chicago School of Woodworking. A key component of the class is frame-and-panel construction, which allows for seasonal wood movement. The bench features tongue-and-groove joints made using both a router table and a dado blade. I used a router with a jig to create half-blind dovetails, the router table for chamfered edges, and the Festool Domino for accurate, efficient joinery.',
    hero: img('shaker-bench', 'hero', 'Completed Shaker-style bench'),
    images: [
      img('shaker-bench', 'hero', 'Completed Shaker-style bench'),
      img('shaker-bench', 'detail-1', 'Bench joinery and construction details'),
    ],
  },
  {
    id: 'shaker-nightstands',
    title: 'Shaker Style Nightstands',
    shortDescription:
      'My first independently designed project -- a pair of nightstands iterating on the Shaker bench design.',
    fullDescription:
      'These two Shaker-style nightstands were my first project designed and executed completely on my own. I iterated on the design from the Shaker-style bench, adapting the frame-and-panel construction and joinery techniques I learned in class into a new form factor. Building a matching pair added an extra layer of challenge -- every cut, every joint had to be replicated precisely across both pieces.',
    hero: img('shaker-nightstands', 'hero', 'Pair of Shaker-style nightstands'),
    images: [
      img('shaker-nightstands', 'hero', 'Pair of Shaker-style nightstands'),
      img('shaker-nightstands', 'detail-1', 'Nightstand detail view'),
      img('shaker-nightstands', 'detail-2', 'Nightstand construction detail'),
      img('shaker-nightstands', 'detail-3', 'Nightstand close-up'),
    ],
  },
  {
    id: 'mcm-coffee-table',
    title: 'MCM Coffee Table',
    shortDescription:
      'Mid-century modern coffee table designed in Fusion 360, featuring precise 10-degree angled legs.',
    fullDescription:
      'I designed this mid-century modern coffee table using Fusion 360, which was a fun learning experiment in CAD modeling for furniture. The build featured my first time using precise 10-degree angle cuts for the angled legs, a defining characteristic of the MCM aesthetic. Translating a digital design into a physical piece taught me a lot about the gap between CAD precision and workshop reality.',
    hero: img('mcm-coffee-table', 'hero', 'MCM coffee table in living space'),
    images: [
      img('mcm-coffee-table', 'hero', 'MCM coffee table in living space'),
      img('mcm-coffee-table', 'detail-1', 'Angled leg detail'),
      img('mcm-coffee-table', 'detail-2', 'Table top and leg joinery'),
    ],
  },
  {
    id: 'dresser',
    title: 'Dresser',
    shortDescription:
      'An ambitious work-in-progress, fully designed from scratch in Fusion 360.',
    fullDescription:
      'This dresser is my most ambitious project to date and is currently a work in progress. I designed everything from scratch in Fusion 360, working through the engineering challenges of drawer construction, panel alignment, and structural integrity at this scale. The design features multiple drawer configurations and frame-and-panel side construction.',
    hero: img('dresser', 'hero', 'Dresser Fusion 360 design render'),
    images: [
      img('dresser', 'hero', 'Dresser Fusion 360 design render'),
      img('dresser', 'detail-1', 'Dresser work in progress'),
      img('dresser', 'detail-2', 'Dresser construction progress'),
      img('dresser', 'detail-3', 'Dresser 3D model render'),
    ],
  },
];
