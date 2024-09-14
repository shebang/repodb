import loki from 'lokijs';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Get XDG_DATA_HOME or use the default path
const xdgDataHome = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');

// Define the path for the repodb database inside XDG_DATA_HOME
const repodbPath = path.join(xdgDataHome, 'repodb');

// Ensure the directory exists
if (!fs.existsSync(repodbPath)) {
  fs.mkdirSync(repodbPath, { recursive: true });
}

// Define the full path for the database file
const dbPath = path.join(repodbPath, 'repositories.db');

// Initialize the LokiJS database with persistence
const db = new loki(dbPath, {
  autosave: true,            // Enable autosave
  autosaveInterval: 5000,    // Autosave every 5 seconds (adjust as needed)
  persistenceMethod: 'fs',   // Use file system persistence
});

// Load the database from disk (or create it if it doesn't exist)
db.loadDatabase({}, () => {
  console.log(`Database loaded or initialized at: ${dbPath}`);

  // Create a collection if it doesn't exist
  let repos = db.getCollection('repositories');
  if (!repos) {
    repos = db.addCollection('repositories');
  }

  // Insert some data (if needed)
  repos.insert({ url: 'https://github.com/neovim/neovim', tags: ['neovim', 'lua'] });
  repos.insert({ url: 'https://github.com/luvit/luvit', tags: ['luvit', 'lua'] });

  // Query data
  const result = repos.find({ tags: { '$contains': 'lua' } });
  console.log(result);

  // Force an immediate save (you don't usually need to do this manually)
  db.saveDatabase();
});

