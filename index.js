/**
 * Root entrypoint for Render and cloud hosting deployments
 * Delegates execution directly to backend/index.js
 */
const path = require('node:path');

// Change working directory to backend so relative paths work identically
process.chdir(path.join(__dirname, 'backend'));

require('./backend/index.js');
