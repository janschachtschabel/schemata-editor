/**
 * Setup Script: Kopiert den schemata-Ordner von metadata-agent-canvas-oeh
 */

import { cpSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const sourcePath = join(rootDir, '..', 'metadata-agent-api', 'src', 'schemata');
const targetPath = join(rootDir, 'public', 'schemata');

console.log('📦 Schemata Setup');
console.log('================');
console.log(`Source: ${sourcePath}`);
console.log(`Target: ${targetPath}`);

if (!existsSync(sourcePath)) {
  console.error('❌ Source folder not found!');
  console.log('   Make sure metadata-agent-api exists as sibling directory.');
  process.exit(1);
}

// Create public directory if needed
if (!existsSync(join(rootDir, 'public'))) {
  mkdirSync(join(rootDir, 'public'));
}

// Copy schemata folder
try {
  cpSync(sourcePath, targetPath, { recursive: true });
  console.log('✅ Schemata copied successfully!');
} catch (error) {
  console.error('❌ Copy failed:', error);
  process.exit(1);
}
