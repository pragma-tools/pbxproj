#!/usr/bin/env node
import fs from 'fs';
import { parse, serialize } from './index.js';

const [inputFile] = process.argv.slice(2);

if (!inputFile) {
  console.error('Usage: pbxproj path/to/project.pbxproj');
  process.exit(1);
}

const raw = fs.readFileSync(inputFile, 'utf8');
const ast = parse(raw);
const result = serialize(ast, { commentStrategy: 'generate' });

console.log(result); 