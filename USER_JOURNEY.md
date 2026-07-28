# User Journeys

This document outlines the primary interaction flows for both visitors to the portfolio and the administrator maintaining it. Understanding these journeys provides context for why the application is architected the way it is.

---

## 1. The Visitor Journey (Public Facing)

### Discovery
* **Landing (`/#/`)**: A visitor arrives at the main portfolio URL. They are immediately presented with a responsive, masonry-style grid of woodworking projects.
* **Loading**: To ensure a premium feel even on slow connections, projects first render an inline blurred placeholder (a tiny 20px base64 string), which seamlessly cross-fades into a high-res (600px width) optimized WebP thumbnail once downloaded.

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

### Project Creation
* **Completion**: The administrator finishes building a new piece of furniture in the woodshop and decides to add it to the portfolio.
* **CLI Invocation**: Instead of manually writing JSON objects, the admin runs `npm run manage` in the terminal.

### Data Entry
* **Interactive Prompts**: The CLI (powered by Inquirer) asks for the project's internal ID, display title, materials used, techniques applied, and a full text description.
* **Asset Ingestion**: The admin exports `.jpg` photos from their camera and an `.fbx` file from Fusion 360, placing them into a new directory: `public/images/<project-id>/`.
* **Registration**: The CLI scans the directory, prompting the admin to identify the "Hero" image, provide alt-text for accessibility, and pair the `.fbx` model with a preview thumbnail.

### Optimization Pipeline
* **Processing**: The CLI automatically triggers the image optimizer script (`npm run optimize`).
* **Generation**: Using `sharp`, the script chews through the raw source images and generates three tiers of WebP assets per image: a 600px thumbnail, a 1400px full-res version, and a 20px blurred base64 string.
* **Manifesting**: A JSON manifest is updated linking the assets together.

### Deployment & CI/CD
* **Validation**: The admin runs `git commit`. A `husky` pre-commit hook automatically intercepts the commit.
* **Enforcement**: The hook runs `oxlint` (checking for React best practices and accessibility flaws) and `vitest` (running regression tests against the routing logic and modal rendering).
* **Shipping**: Once the pre-commit checks pass, the admin runs `git push`. A GitHub Action automatically builds the Vite application and deploys the optimized static bundle to GitHub Pages.
