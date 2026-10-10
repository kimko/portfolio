# User Journeys

This document outlines the primary interaction flows for both visitors to the portfolio and the administrator maintaining it. Understanding these journeys provides context for why the application is architected the way it is.

---

## 1. The Visitor Journey (Public Facing)

### Discovery
* **Landing (`/#/`)**: A visitor arrives at the main portfolio URL. They are immediately presented with a responsive, masonry-style grid of woodworking projects.
* **Loading**: To ensure a premium feel even on slow connections, projects first render an inline blurred placeholder (a tiny 20px base64 string), which seamlessly cross-fades into a 1000px-wide optimized WebP card image once downloaded.

### Exploration
* **Selection**: The visitor clicks on a project card (e.g., *MCM Coffee Table*).
* **Transition**: A smooth Framer Motion animation scales the project into a full-screen Modal, and the URL hash updates to `/#/project/mcm-coffee-table` without a page reload.

### Deep Dive
* **Context**: A translucent, glassmorphism-styled info panel overlays the left side of the screen, detailing the project's title, materials, techniques, and the builder's notes. (On mobile, this panel can be toggled via an Info button to save screen space).
* **Media Inspection**: The visitor uses the bottom thumbnail strip to toggle between different views of the piece. The URL updates dynamically (e.g., `/#/project/mcm-coffee-table/image/2`) so they can share a direct link to a specific construction detail.
* **Interactive 3D**: The visitor notices a thumbnail with a cube icon. Clicking it loads a 3D WebGL `ModelViewer` (using React-Three-Fiber). They can pan, zoom, and orbit around the exported Fusion 360 `.fbx` model to inspect the joinery and design from any angle.
* **Exit**: The visitor presses `Escape` or clicks the close button. The modal gracefully animates away, returning them to the exact scroll position in the main grid, and the URL resets to `/#/`.

---

## 2. The Administrator Journey (Internal Tooling)

### Dropping Photos
* **Completion**: The administrator finishes a piece in the woodshop, or takes new photos of one in progress.
* **Drop**: They copy the photos straight from the phone (HEIC is fine) into `content/originals/<project-id>/`. A new folder means a new project. `.fbx` models exported from Fusion 360 go in the same folder, with a render to use as the preview.

### Working with Claude
* **Status**: Claude Code runs `npm run content -- status` (guided by the `portfolio-content` skill) and reports what's new, for example "3 new photos in dresser".
* **Review**: Claude looks at each photo, proposes alt text, the cover photo and any to skip, and maps the administrator's tags onto names already used on the site. Descriptions keep the administrator's own words.
* **Apply**: After a dry run and the administrator's OK, Claude runs `new`, `add-photo`, `add-model`, `edit` or `remove-photo`. Only the project and photos being changed are touched.

### Optimization Pipeline
* **Generation**: For each new photo the tool converts HEIC with macOS `sips`, then uses `sharp` to make a 1000px-wide card image (WebP, quality 72), a 2400px full image (WebP, quality 75) and a 20px blur placeholder, turned upright and without location data.
* **Records**: `src/data/image-manifest.json` links each photo to its web copies, and `content/photo-map.json` records which original became which photo so the next `status` knows what's new. Originals stay on the administrator's computer and are not committed.

### Deployment & CI/CD
* **Validation**: The admin runs `git commit`. A `husky` pre-commit hook automatically intercepts the commit.
* **Enforcement**: The hook runs `oxlint` (checking for React best practices and accessibility flaws) and `vitest` (running regression tests against the routing logic and modal rendering).
* **Shipping**: Once the pre-commit checks pass, the admin runs `git push`. A GitHub Action automatically builds the Vite application and deploys the optimized static bundle to GitHub Pages.
