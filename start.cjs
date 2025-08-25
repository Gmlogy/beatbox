// start.cjs
const { spawn } = require('child_process');
const path = require('path');

console.log('[Launcher] Starting Electron process...');

// Find the correct path to the Electron executable
const electronPath = path.join(__dirname, 'node_modules', '.bin', 'electron');

// Spawn the Electron process. 
// The '.' tells Electron to look in package.json for the 'main' file.
const child = spawn(electronPath, ['.'], {
  stdio: 'inherit',
  shell: true
});

child.on('close', (code) => {
  console.log(`[Launcher] Electron process exited with code ${code}`);
});