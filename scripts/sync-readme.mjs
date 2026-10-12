// Rewrites the Things I made list in README.md from the website's profile.json, leaving out pinned repos: GitHub shows those below the README.
import { readFile, writeFile } from 'node:fs/promises';

const SOURCE = 'https://xxseryixx.github.io/profile.json';
const START = '<!-- projects:start -->';
const END = '<!-- projects:end -->';
const readmeUrl = new URL('../README.md', import.meta.url);

// Names and descriptions are free text: keep them from turning into Markdown or HTML.
const escape = (text) => text.replace(/[\\`*_[\]<>|~]/g, '\\$&');

function httpUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value.includes('://') ? value : `https://${value}`);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

const response = await fetch(SOURCE);
if (!response.ok) throw new Error(`${SOURCE} answered HTTP ${response.status}`);
const { github } = await response.json();

const items = github.projects
  .filter((project) => !project.pinned && httpUrl(project.url))
  .map((project) => {
    const description = project.description?.trim();
    const homepage = httpUrl(project.homepage);
    return [
      `- **[${escape(project.name)}](<${httpUrl(project.url)}>)**`,
      description ? `: ${escape(description.replace(/[^.!?]$/, '$&.'))}` : '',
      homepage ? ` [Open it](<${homepage}>)` : '',
    ].join('');
  });

const readme = await readFile(readmeUrl, 'utf8');
const start = readme.indexOf(START);
const end = readme.indexOf(END);
if (start === -1 || end < start) throw new Error(`README.md needs the ${START} and ${END} markers.`);
const eol = readme.includes('\r\n') ? '\r\n' : '\n';
const updated = [readme.slice(0, start + START.length), ...items, readme.slice(end)].join(eol);

if (updated === readme) {
  console.log('README.md already matches the website.');
} else {
  await writeFile(readmeUrl, updated);
  console.log(`README.md updated: ${items.length} projects.`);
}
