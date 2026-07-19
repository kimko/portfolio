# Kopowski Woodworks

Woodworking portfolio site. Vite + React + Chakra UI v2.

**Live:** [https://kimko.github.io/portfolio/](https://kimko.github.io/portfolio/)

## Dev

```bash
npm install
npm run dev          # http://localhost:5173/portfolio/
```

## Image Pipeline

Source JPEGs go in `public/images/<project>/`. Run the optimizer to generate WebP variants:

```bash
npm run optimize     # generates public/images-optimized/ + src/data/image-manifest.json
```

Three tiers per image: thumb (600px), full (1400px), blur placeholder (20px base64).

## Deploy

Push to `main`. GitHub Actions builds and deploys to Pages automatically.

## Stack

- **Vite** -- build tool
- **React** -- UI
- **Chakra UI v2** -- component library
- **Framer Motion** -- animations
- **sharp** -- image optimization (dev)
- **GitHub Pages** -- hosting
