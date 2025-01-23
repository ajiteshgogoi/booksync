#!/usr/bin/env node
import fs from 'fs';
import { spawn } from 'child_process';

// Read content from file
const content = fs.readFileSync(process.argv[2], 'utf8');

// Spawn node process with FILE_CONTENT environment variable
const proc = spawn('node', ['--experimental-vm-modules', 'processHighlights.js'], {
  env: { ...process.env, FILE_CONTENT: content },
  stdio: 'inherit'
});

proc.on('error', (err) => {
  console.error('Failed to start subprocess:', err);
  process.exit(1);
});

proc.on('close', (code) => {
  process.exit(code || 0);
});