#!/usr/bin/env node
// Build a single composite skills SVG that mimics skillicons.dev's aesthetic
// (48px tiles, 24px corner radius, brand colors, white-on-color logos) but
// includes icons skillicons.dev doesn't ship — Claude, OpenAI, MCP, Spark.
//
// Run:  node build-skills-svg.mjs
// Out:  ~/code/ugudlado-profile/assets/skills.svg

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';

// ----- Configuration ---------------------------------------------------------

// Each entry: [label, brand-bg-hex, simple-icons-slug | { custom: 'svg-path-d' }]
// Use simple-icons slugs (https://simpleicons.org). For brands not in
// simple-icons (MCP, Spark already exists as 'apachespark'), we provide a custom path.
const ICONS = [
  ['Go',             '00ADD8', 'go'],
  ['Python',         '3776AB', 'python'],
  ['TypeScript',     '3178C6', 'typescript'],
  ['C#',             '512BD4', 'csharp'],
  ['React',          '20232A', 'react'],
  ['Node.js',        '339933', 'nodedotjs'],
  ['VS Code',        '007ACC', 'visualstudiocode'],
  ['Docker',         '2496ED', 'docker'],
  ['AWS',            '232F3E', 'amazonwebservices'],
  ['Terraform',      '7B42BC', 'terraform'],
  ['GitHub Actions', '2088FF', 'githubactions'],
  ['Postgres',       '4169E1', 'postgresql'],
  ['GraphQL',        'E10098', 'graphql'],
  ['Claude',         'D97757', 'anthropic'],
  ['OpenAI',         '412991', 'openai'],
  ['Spark',          'E25A1C', 'apachespark'],
  // MCP has no simple-icons entry. Use a clean monogram tile: bold "MCP" text.
  ['MCP',            '1F1F1F', { text: 'MCP' }],
];

// skillicons.dev visual constants — matched by inspection.
const TILE = 48;
const RADIUS = 10;
const GAP = 12;

// ----- Fetch simple-icons paths ---------------------------------------------

async function fetchSlugPath(slug) {
  const url = `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${slug}.svg`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${slug}: ${res.status}`);
  const xml = await res.text();
  // simple-icons SVGs are 24x24 viewBox with one <path d="...">
  const match = xml.match(/<path d="([^"]+)"/);
  if (!match) throw new Error(`No path in ${slug} SVG`);
  return match[1];
}

async function fetchAll() {
  const results = [];
  for (const [label, bg, slug] of ICONS) {
    if (typeof slug === 'object' && slug.text) {
      results.push({ label, bg, kind: 'text', text: slug.text });
    } else if (typeof slug === 'object' && slug.custom) {
      results.push({ label, bg, kind: 'path', d: slug.custom });
    } else {
      const d = await fetchSlugPath(slug);
      results.push({ label, bg, kind: 'path', d });
    }
  }
  return results;
}

// ----- Compose SVG -----------------------------------------------------------

function tile({ label, bg, kind, d, text }, x) {
  // The logo is rendered at 24x24, scaled to ~28x28 inside the 48x48 tile,
  // so the inner padding feels right (~10px).
  const inner = 28;
  const padding = (TILE - inner) / 2;

  const titleEl = `<title>${escape(label)}</title>`;
  const rect = `<rect width="${TILE}" height="${TILE}" rx="${RADIUS}" fill="#${bg}"/>`;

  let logo;
  if (kind === 'path') {
    // simple-icons paths assume a 24x24 viewBox. We translate to (padding,padding)
    // and scale 24→inner. Render in white for contrast on the colored tile.
    const scale = inner / 24;
    logo = `<g transform="translate(${padding},${padding}) scale(${scale})" fill="#FFFFFF"><path d="${d}"/></g>`;
  } else if (kind === 'text') {
    // For MCP — bold sans monogram, centered.
    logo = `<text x="${TILE/2}" y="${TILE/2 + 5}" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif" font-size="14" font-weight="700" text-anchor="middle" fill="#FFFFFF" letter-spacing="0.5">${escape(text)}</text>`;
  }

  return `<g transform="translate(${x},0)">${titleEl}${rect}${logo}</g>`;
}

function escape(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function compose(items) {
  const width  = items.length * TILE + (items.length - 1) * GAP;
  const height = TILE;
  const tiles = items.map((it, i) => tile(it, i * (TILE + GAP))).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Skills: ${items.map(i => i.label).join(', ')}">
  <title>Skills: ${items.map(i => i.label).join(', ')}</title>
  ${tiles}
</svg>
`;
}

// ----- Main ------------------------------------------------------------------

const items = await fetchAll();
const svg = compose(items);

const outDir = resolve(homedir(), 'code/ugudlado-profile/assets');
mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, 'skills.svg');
writeFileSync(outPath, svg);

console.log(`Wrote ${svg.length} bytes to ${outPath}`);
console.log(`${items.length} icons: ${items.map(i => i.label).join(', ')}`);
