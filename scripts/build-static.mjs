import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const outputDir = path.join(projectRoot, 'public');

function ensureCleanDirectory(targetPath) {
    fs.rmSync(targetPath, { recursive: true, force: true });
    fs.mkdirSync(targetPath, { recursive: true });
}

function copyEntry(relativePath) {
    const sourcePath = path.join(projectRoot, relativePath);
    const destinationPath = path.join(outputDir, relativePath);

    fs.cpSync(sourcePath, destinationPath, { recursive: true });
}

ensureCleanDirectory(outputDir);

[
    'index.html',
    'favicon.svg',
    'favicon.png',
    'apple-touch-icon.png',
    'src'
].forEach(copyEntry);

console.log(`Built static site into ${path.relative(projectRoot, outputDir)}`);
