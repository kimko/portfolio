# Kopowski Woodworks

Woodworking portfolio site featuring an interactive project gallery and inline 3D model viewers.

**Live:** [https://kimko.github.io/portfolio/](https://kimko.github.io/portfolio/)

## Dev

```bash
npm install
npm run dev          # http://localhost:5173/portfolio/
```

## Project Management CLI

Instead of manually editing JSON data, the project includes an interactive CLI to add, edit, and remove portfolio projects. 

```bash
npm run manage
```
This CLI will prompt you for project details (materials, techniques), scan the project's image directory for new assets or 3D models, update `src/data/projects.json`, and automatically run the optimization pipeline.

## Asset Pipeline (Images & 3D)

Source assets belong in `public/images/<project-id>/`. 

- **Images**: Place high-res JPEGs/PNGs here. The pipeline generates optimized WebP variants across three tiers: thumb (600px), full (1400px), and a tiny 20px base64 blur placeholder for instant loading.
- **3D Models**: Place `.fbx` files here alongside a preview thumbnail (e.g. `model.fbx` and `model_preview.jpg`). The app uses Three.js/React-Three-Fiber to render these inline.

To manually run the optimizer:
```bash
npm run optimize
```

## Testing & Quality

- **Tests**: Run `npm test` (or `npm run test:watch`). We use `vitest` and `@testing-library/react` to guarantee routing and modal behaviors don't regress.
- **Linting**: Run `npm run lint`. We use `oxlint` (a blazing fast rust-based linter) with plugins for accessibility (`jsx-a11y`) and React. 
- **Git Hooks**: A `husky` pre-commit hook is configured to automatically run both the linter and test suite before allowing any commits.

## Deploy

Push to `main`. GitHub Actions builds and deploys to Pages automatically.

## Stack

- **Vite** -- build tool
- **React 19** -- UI
- **Chakra UI v2** -- component library
- **Framer Motion** -- animations
- **Three.js & R3F** -- 3D model rendering
- **Vitest & RTL** -- regression testing
- **Oxlint** -- static analysis
- **sharp** -- image optimization
