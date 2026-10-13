#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Renders public/og.png (1200x630) from src/assets/og.svg with sharp.
//
// librsvg cannot read the WOFF2 files shipped by @fontsource, so the script converts the
// two variable fonts to TTF with fontTools (python3 + fontTools + brotli) into a temporary
// directory and points fontconfig at it. The PNG is committed; run this only when
// src/assets/og.svg changes:
//
//   node scripts/build-og.mjs

import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fonts = [
	'node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2',
	'node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2',
].map((f) => resolve(root, f));

const work = mkdtempSync(join(tmpdir(), 'kk-og-'));
try {
	execFileSync(
		'python3',
		[
			'-c',
			[
				'import sys',
				'from fontTools.ttLib import TTFont',
				'out = sys.argv[1]',
				'for i, src in enumerate(sys.argv[2:]):',
				'    f = TTFont(src); f.flavor = None; f.save(f"{out}/font{i}.ttf")',
			].join('\n'),
			work,
			...fonts,
		],
		{ stdio: 'inherit' },
	);
	const conf = join(work, 'fonts.conf');
	writeFileSync(
		conf,
		`<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${work}</dir>
  <cachedir>${work}/cache</cachedir>
</fontconfig>
`,
	);
	process.env.FONTCONFIG_FILE = conf;

	// sharp must be imported after FONTCONFIG_FILE is set.
	const { default: sharp } = await import('sharp');
	const svg = readFileSync(resolve(root, 'src/assets/og.svg'));
	const out = resolve(root, 'public/og.png');
	await sharp(svg, { density: 96 }).resize(1200, 630).png({ compressionLevel: 9 }).toFile(out);
	console.log(`wrote ${out}`);
} finally {
	rmSync(work, { recursive: true, force: true });
}
