// SPDX-License-Identifier: Apache-2.0
// Documentation stays in the code repository; this script only produces ignored build inputs.
import { execFileSync } from 'node:child_process';
import { cp, lstat, mkdir, readFile, readdir, realpath, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';
import { slug as githubSlug } from 'github-slugger';

const root = fileURLToPath(new URL('../', import.meta.url));
const repo = process.env.KARAKORAM_REPO || 'KarakoramDev/Karakoram';
const ref = process.env.KARAKORAM_REF || 'main';
const base = `/${(process.env.BASE_PATH || '/').split('/').filter(Boolean).join('/')}/`.replace(/^\/\/$/, '/');
const output = path.join(root, 'src/content/docs/docs');
const generated = path.join(root, 'src/generated');
const parser = unified().use(remarkParse).use(remarkGfm);
const encodePath = (value) => value.split('/').map(encodeURIComponent).join('/');
const github = `https://github.com/${repo}`;
const cacheDirectory = path.join(root, '.cache/karakoram');
const cacheGitEnv = { ...process.env, GIT_CEILING_DIRECTORIES: path.dirname(cacheDirectory) };
const git = (dir, ...args) => execFileSync('git', ['-C', dir, ...args], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
  env: dir === cacheDirectory ? cacheGitEnv : process.env,
}).trim();
const exists = async (file) => { try { return await stat(file); } catch (error) { if (error.code === 'ENOENT') return undefined; throw error; } };
const text = (node) => node.value ?? node.alt ?? (node.children || []).map(text).join('');
const friendly = (name) => name.replace(/[-_]/g, ' ').replace(/^./, (letter) => letter.toUpperCase());
const escapeHtml = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const concise = (value) => {
  const paragraph = value.replace(/\s+/g, ' ').trim();
  if (paragraph.length <= 160) return paragraph;
  return paragraph.slice(0, 157).replace(/\s+\S*$/, '').trimEnd() + '…';
};

async function sourceDirectory() {
  if (process.env.KARAKORAM_DOCS_DIR) {
    const directory = process.env.KARAKORAM_DOCS_DIR.replace(/^~(?=\/|$)/, process.env.HOME || '~');
    return path.resolve(directory);
  }
  const cache = cacheDirectory;
  const cacheInfo = await lstat(cache).catch((error) => {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  });
  if (cacheInfo?.isSymbolicLink()) throw new Error(`Refusing documentation cache symlink: ${cache}`);
  if (!cacheInfo) {
    await mkdir(path.dirname(cache), { recursive: true });
    execFileSync('git', ['clone', '--depth=1', '--branch', ref, `${github}.git`, cache], { stdio: 'inherit', env: cacheGitEnv });
  } else {
    if (!cacheInfo.isDirectory()) throw new Error(`Documentation cache is not a directory: ${cache}`);
    const gitInfo = await lstat(path.join(cache, '.git')).catch((error) => {
      if (error.code === 'ENOENT') return undefined;
      throw error;
    });
    if (!gitInfo?.isDirectory()) throw new Error(`Documentation cache must contain a real .git directory: ${cache}`);
    let checkoutRoot;
    try {
      checkoutRoot = await realpath(git(cache, 'rev-parse', '--show-toplevel'));
    } catch (error) {
      throw new Error(`Cannot validate documentation cache repository ${cache}: ${error.message}`);
    }
    if (checkoutRoot !== await realpath(cache)) throw new Error(`Refusing documentation cache outside its repository root: ${cache} (Git root: ${checkoutRoot})`);
    git(cache, 'remote', 'set-url', 'origin', `${github}.git`);
    git(cache, 'fetch', '--depth=1', 'origin', ref);
    // The hard reset is deliberately confined to our disposable cache, never a supplied checkout.
    git(cache, 'reset', '--hard', 'FETCH_HEAD');
  }
  return cache;
}

async function walk(directory, prefix = '') {
  const files = [];
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path.join(directory, entry.name), relative));
    else files.push(relative);
  }
  return files;
}

function pageSlug(original) {
  const fixed = {
    'README.md': 'docs',
    'CONTRIBUTING.md': 'docs/contributing',
    'CODE_OF_CONDUCT.md': 'docs/code-of-conduct',
    'docs/quickstart.md': 'docs/getting-started/quickstart',
    'docs/install.md': 'docs/getting-started/install',
    'docs/upgrade.md': 'docs/getting-started/upgrade',
  };
  if (fixed[original]) return fixed[original];
  return original.replace(/\.md$/i, '').replace(/\/(?:readme|index)$/i, '').split('/').map(githubSlug).join('/');
}

// Sidebar layout: getting started, backend-neutral control-plane pages, fleet operations, backends, interfaces, AI agents, then one group per engine.
// Pages missing from this list are appended to their directory's group (or "Control plane"); pages absent from the checkout are skipped.
const sections = [
  ['Getting started', {
    'docs/quickstart.md': 'Quick start', 'docs/install.md': 'Install', 'docs/backends.md': 'Backends', 'docs/operating-costs.md': 'Operating costs',
    'docs/upgrade.md': 'Upgrade',
  }],
  ['Control plane', {
    'docs/architecture.md': 'Architecture', 'docs/clusters.md': 'Clusters and operations', 'docs/backups.md': 'Backups and storage',
    'docs/namespaces.md': 'Namespaces and relays', 'docs/monitoring.md': 'Monitoring and events', 'docs/access-control.md': 'Access control',
    'docs/security.md': 'Security', 'docs/operations.md': 'Operations and troubleshooting', 'docs/limitations.md': 'Limitations',
  }],
  ['Fleet operations', {
    'docs/control-plane-backup.md': 'Control-plane backup and rebuild', 'docs/backup-drills.md': 'Backup drills', 'docs/notifications.md': 'Notifications',
  }],
  ['Backends', { 'docs/zerops.md': 'Zerops', 'docs/dokploy.md': 'Dokploy', 'docs/nomad.md': 'Nomad' }],
  ['Interfaces', { 'docs/web-ui.md': 'Web UI', 'docs/cli.md': 'CLI (karactl)', 'docs/api.md': 'REST API and SDK' }],
  ['AI agents', { 'docs/mcp-quickstart.md': 'MCP quick start', 'docs/mcp.md': 'MCP server', 'docs/data-mcp.md': 'Cluster data MCP' }],
  ['MongoDB', {
    'docs/mongodb/README.md': 'Overview', 'docs/mongodb/replica-sets.md': 'Replica sets', 'docs/mongodb/sharding.md': 'Sharding',
    'docs/mongodb/access-and-tls.md': 'Users, roles and TLS', 'docs/mongodb/backups.md': 'Backups and PITR', 'docs/mongodb/operations.md': 'Operations',
  }],
  ['PostgreSQL', {
    'docs/postgres/README.md': 'Overview', 'docs/postgres/profiles.md': 'Extension profiles', 'docs/postgres/bindings.md': 'Consumer bindings',
    'docs/postgres/distributed.md': 'Distributed (Citus)', 'docs/postgres/access-and-tls.md': 'Access and TLS',
    'docs/postgres/backups.md': 'Backups and PITR', 'docs/postgres/operations.md': 'Operations',
  }],
  ['Supabase', {
    'docs/supabase/README.md': 'Overview', 'docs/supabase/components.md': 'Components and availability', 'docs/supabase/operations.md': 'Operations',
  }],
  ['RabbitMQ', {
    'docs/rabbitmq/README.md': 'Overview', 'docs/rabbitmq/access-and-tls.md': 'Access and TLS',
    'docs/rabbitmq/backups.md': 'Definitions backups', 'docs/rabbitmq/operations.md': 'Operations',
  }],
  ['Elasticsearch', {
    'docs/elasticsearch/README.md': 'Overview', 'docs/elasticsearch/stack.md': 'Kibana, Logstash and APM',
    'docs/elasticsearch/access-and-security.md': 'Access and security', 'docs/elasticsearch/snapshots.md': 'Snapshots',
    'docs/elasticsearch/operations.md': 'Operations',
  }],
  ['MySQL and PXC', {
    'docs/mysql/README.md': 'Overview', 'docs/mysql/configuration.md': 'Configuration and topology', 'docs/mysql/access-and-tls.md': 'Access and TLS',
    'docs/mysql/backups.md': 'Backups and PITR', 'docs/mysql/operations.md': 'Operations and recovery', 'docs/mysql/verification.md': 'Verification',
  }],
  ['Neo4j', {
    'docs/neo4j/README.md': 'Overview', 'docs/neo4j/access-and-tls.md': 'Access and TLS',
    'docs/neo4j/backups.md': 'Offline backups', 'docs/neo4j/operations.md': 'Operations',
  }],
  ['Weaviate', {
    'docs/weaviate/README.md': 'Overview', 'docs/weaviate/access-and-tls.md': 'Access and TLS',
    'docs/weaviate/backups.md': 'Backups', 'docs/weaviate/operations.md': 'Operations',
  }],
  ['Keycloak', { 'docs/keycloak/README.md': 'Overview' }],
  ['OpenBao', {
    'docs/openbao/README.md': 'Overview', 'docs/openbao/access-and-tls.md': 'Access and TLS',
    'docs/openbao/backups.md': 'Raft backups and recovery', 'docs/openbao/operations.md': 'Operations and unseal',
  }],
  ['Temporal', {
    'docs/temporal/README.md': 'Overview', 'docs/temporal/access-and-tls.md': 'Access and TLS', 'docs/temporal/operations.md': 'Operations and recovery',
  }],
];
const engineDirectories = {
  mongodb: 'MongoDB', postgres: 'PostgreSQL', supabase: 'Supabase', rabbitmq: 'RabbitMQ', elasticsearch: 'Elasticsearch',
  mysql: 'MySQL and PXC', neo4j: 'Neo4j', weaviate: 'Weaviate', keycloak: 'Keycloak', openbao: 'OpenBao', temporal: 'Temporal',
};
const labels = {
  'README.md': 'Overview', 'CONTRIBUTING.md': 'Contributing', 'CODE_OF_CONDUCT.md': 'Code of Conduct',
  'docs/verification.md': 'Verification', 'docs/native-artifacts.md': 'Native artifacts', 'docs/adr/README.md': 'Index',
  ...Object.assign({}, ...sections.map(([, pages]) => pages)),
};

function makeSidebar(pages) {
  const remaining = new Map(pages.map((page) => [page.original, page]));
  let order = 0;
  const item = (page) => {
    remaining.delete(page.original);
    page.order = order++;
    return { slug: page.slug, label: page.label };
  };
  const take = (original) => remaining.has(original) ? [item(remaining.get(original))] : [];
  const group = (label, entries, collapsed = false) => entries.length ? [{ label, collapsed, items: entries }] : [];
  const unlisted = (filter) => [...remaining.values()].filter((page) => filter(page.original)).sort((a, b) => a.original.localeCompare(b.original));
  const directory = (original) => original.split('/').length > 2 ? original.split('/')[1] : undefined;
  const listedAll = new Set(['docs/verification.md', 'docs/native-artifacts.md', ...sections.flatMap(([, listed]) => Object.keys(listed))]);
  const sidebar = [...take('README.md')];
  for (const [label, listed] of sections) {
    const extra = label === 'Control plane'
      ? unlisted((original) => original.startsWith('docs/') && !directory(original) && !listedAll.has(original))
      : unlisted((original) => engineDirectories[directory(original)] === label && !listedAll.has(original));
    sidebar.push(...group(label, [...Object.keys(listed).flatMap(take), ...extra.map(item)]));
  }
  const adrs = unlisted((original) => original.startsWith('docs/adr/') && original !== 'docs/adr/README.md')
    .sort((a, b) => a.original.localeCompare(b.original, 'en', { numeric: true }));
  const reference = [
    ...group('Architecture decisions', [...take('docs/adr/README.md'), ...adrs.map(item)], true),
    ...take('docs/native-artifacts.md'),
    ...take('docs/verification.md'),
  ];
  for (const name of [...new Set(unlisted((original) => original.startsWith('docs/') && directory(original)).map((page) => directory(page.original)))]) {
    reference.push(...group(friendly(name), unlisted((original) => directory(original) === name).map(item)));
  }
  reference.push(...take('CONTRIBUTING.md'), ...take('CODE_OF_CONDUCT.md'));
  sidebar.push(...group('Reference', reference));
  if (remaining.size) throw new Error(`Unassigned sidebar pages: ${[...remaining.keys()].join(', ')}`);
  return sidebar;
}

// mdast finds the nodes and offsets; only the destination bytes are replaced.
// Titles, formatting, reference labels and the rest of each Markdown file stay intact.
function destinationRange(node, markdown) {
  const start = node.position.start.offset;
  const source = markdown.slice(start, node.position.end.offset);
  let cursor;
  if (node.type === 'definition') {
    cursor = 1;
    while (cursor < source.length) {
      if (source[cursor] === '\\') cursor += 2;
      else if (source[cursor] === ']' && source[cursor + 1] === ':') { cursor += 2; break; }
      else cursor++;
    }
  } else if (source.startsWith('<')) {
    return [start + 1, start + source.length - 1];
  } else {
    cursor = node.type === 'image' ? 2 : 1;
    let depth = 1;
    while (cursor < source.length && depth) {
      if (source[cursor] === '\\') { cursor += 2; continue; }
      if (source[cursor] === '[') depth++;
      if (source[cursor] === ']') depth--;
      cursor++;
    }
    if (source[cursor] !== '(') throw new Error(`Cannot locate link destination at line ${node.position.start.line}`);
    cursor++;
  }
  while (/\s/.test(source[cursor] || '') && cursor < source.length) cursor++;
  if (source[cursor] === '<') {
    const begin = ++cursor;
    while (cursor < source.length && source[cursor] !== '>') cursor += source[cursor] === '\\' ? 2 : 1;
    return [start + begin, start + cursor];
  }
  const begin = cursor;
  let depth = 0;
  while (cursor < source.length) {
    const character = source[cursor];
    if (character === '\\') { cursor += 2; continue; }
    if (/\s/.test(character) || (character === ')' && depth === 0)) break;
    if (character === '(') depth++;
    if (character === ')') depth--;
    cursor++;
  }
  return [start + begin, start + cursor];
}

async function main() {
  const source = await sourceDirectory();
  const commit = git(source, 'rev-parse', 'HEAD');
  const docFiles = await walk(path.join(source, 'docs'));
  const originals = ['README.md', ...docFiles.filter((file) => /\.md$/i.test(file)).map((file) => `docs/${file}`), 'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md'];
  const pages = [];
  const routes = new Map();
  for (const original of originals) {
    const markdown = await readFile(path.join(source, original), 'utf8');
    const tree = parser.parse(markdown);
    let heading;
    let paragraph;
    visit(tree, (node) => {
      if (!heading && node.type === 'heading' && node.depth === 1) heading = node;
      if (!paragraph && node.type === 'paragraph') paragraph = node;
    });
    const title = original === 'README.md' ? 'Overview' : heading ? text(heading) : friendly(path.posix.basename(original, '.md'));
    const slug = pageSlug(original);
    if ([...routes.values()].includes(slug)) throw new Error(`Duplicate documentation route ${slug}: ${original}`);
    routes.set(original, slug);
    const adr = title.match(/^(\d{4})\s*[—–-]\s*(.*)$/);
    const label = labels[original] || labels[path.posix.basename(original, '.md')] || (adr ? `${adr[1]} · ${adr[2]}` : title);
    pages.push({ original, markdown, tree, heading, title, slug, label, description: concise(paragraph ? text(paragraph) : title) });
  }
  const sidebar = makeSidebar(pages);
  const failures = [];
  let rewritten = 0;
  let external = 0;
  for (const page of pages) {
    const replacements = [];
    const nodes = [];
    let hasMermaid = false;
    const imageDefinitions = new Set();
    visit(page.tree, (node) => {
      if (['link', 'image', 'definition'].includes(node.type)) nodes.push(node);
      if (node.type === 'code' && node.lang === 'mermaid') {
        hasMermaid = true;
        // Preserve accessible source text even when JS is disabled or unavailable.
        replacements.push({
          start: node.position.start.offset,
          end: node.position.end.offset,
          value: `<figure class="karakoram-mermaid"><div data-mermaid-output hidden role="img" aria-label="Diagram"></div><details data-mermaid-source open><summary>Diagram source</summary><pre><code>${escapeHtml(node.value)}</code></pre></details></figure>`,
        });
      }
      if (node.type === 'imageReference') imageDefinitions.add(node.identifier);
    });
    for (const node of nodes) {
      const url = node.url;
      if (!url || url.startsWith('#') || url.startsWith('//') || /^[a-z][a-z\d+.-]*:/i.test(url)) continue;
      const match = url.match(/^([^?#]*)(.*)$/s);
      let target;
      try { target = decodeURIComponent(match[1]); } catch { failures.push(`${page.original}:${node.position.start.line}: invalid URL ${url}`); continue; }
      const original = path.posix.normalize(target.startsWith('/') ? target.slice(1) : path.posix.join(path.posix.dirname(page.original), target));
      const info = original.startsWith('../') ? undefined : await exists(path.join(source, original));
      if (!info) { failures.push(`${page.original}:${node.position.start.line}: missing relative target ${url} (resolved to ${original})`); continue; }
      let destination;
      const image = node.type === 'image' || (node.type === 'definition' && imageDefinitions.has(node.identifier));
      if (routes.has(original) && !image) {
        destination = `${base}${routes.get(original)}/${match[2]}`;
      } else if (image) {
        destination = `https://raw.githubusercontent.com/${repo}/${encodeURIComponent(ref)}/${encodePath(original)}${match[2]}`;
      } else {
        destination = `${github}/${info.isDirectory() ? 'tree' : 'blob'}/${encodeURIComponent(ref)}/${encodePath(original)}${match[2]}`;
        external++;
      }
      const [start, end] = destinationRange(node, page.markdown);
      if (!page.heading || start < page.heading.position.start.offset || start >= page.heading.position.end.offset) {
        replacements.push({ start, end, value: destination });
      }
      rewritten++;
    }
    // Remove only the leading license/copyright comments, and the first H1.
    const license = page.markdown.match(/^(?:\s*<!--\s*(?:SPDX-License-Identifier:|Copyright)[\s\S]*?-->\s*)+/i);
    if (license) replacements.push({ start: 0, end: license[0].length, value: '' });
    if (page.heading) {
      let end = page.heading.position.end.offset;
      if (page.markdown.slice(end, end + 2) === '\r\n') end += 2;
      else if (page.markdown[end] === '\n') end++;
      replacements.push({ start: page.heading.position.start.offset, end, value: '' });
    }
    replacements.sort((a, b) => b.start - a.start);
    let body = page.markdown;
    for (const replacement of replacements) body = body.slice(0, replacement.start) + replacement.value + body.slice(replacement.end);
    const head = hasMermaid
      ? `head:\n  - tag: script\n    attrs:\n      type: module\n      src: ${JSON.stringify(`${base}_astro/karakoram-mermaid.js`)}\n` : '';
    page.content = `---\ntitle: ${JSON.stringify(page.title)}\ndescription: ${JSON.stringify(page.description)}\neditUrl: ${JSON.stringify(`${github}/edit/${encodeURIComponent(ref)}/${encodePath(page.original)}`)}\nsidebar:\n  order: ${page.order}\n  label: ${JSON.stringify(page.label)}\n${head}---\n${body}`;
  }
  if (failures.length) throw new Error(`Documentation ingestion failed (${failures.length} invalid link${failures.length === 1 ? '' : 's'}):\n${failures.join('\n')}`);
  // Validate first, then replace the generated content in one run.
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  await mkdir(generated, { recursive: true });
  for (const page of pages) {
    const relative = page.slug === 'docs' ? 'index.md' : `${page.slug.slice('docs/'.length)}.md`;
    const destination = path.join(output, relative);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, page.content);
  }
  for (const file of docFiles.filter((file) => !/\.md$/i.test(file))) {
    const destination = path.join(output, file);
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(path.join(source, 'docs', file), destination);
  }
  await writeFile(path.join(generated, 'sidebar.json'), JSON.stringify(sidebar, null, 2) + '\n');
  await writeFile(path.join(generated, 'source.json'), JSON.stringify({ repo, ref, commit, commitUrl: `${github}/commit/${commit}`, generatedAt: new Date().toISOString() }, null, 2) + '\n');
  await cp(path.join(source, 'deploy/zerops/import.yaml'), path.join(generated, 'import.yaml'));
  console.log(`Docs: ${repo}@${ref} (${process.env.KARAKORAM_DOCS_DIR ? 'local checkout' : 'cached clone'}) · ${commit} · ${pages.length} pages · ${rewritten} links rewritten · ${external} external repo links`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
