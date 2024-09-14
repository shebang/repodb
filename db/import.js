
import loki from 'lokijs';
import fs from 'fs/promises';  // Using promise-based fs methods
import path from 'path';
import os from 'os';

// Define the repository path and the LokiJS database path
const xdgDataHome = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
const repodbPath = path.join(xdgDataHome, 'repodb');
const dbPath = path.join(repodbPath, 'repositories.db');


// Fix the REPODB_REPOSITORIES_ROOT to handle the home directory correctly
const REPODB_REPOSITORIES_ROOT = path.resolve(
  process.env.REPODB_REPOSITORIES_ROOT || path.join(os.homedir(), 'dev/repos/github.com')
);

// Initialize the LokiJS database with persistence
const db = new loki(dbPath, {
  autosave: true,
  autosaveInterval: 5000,
  persistenceMethod: 'fs',
});

// Function to load the database
async function loadDatabase() {
  return new Promise((resolve, reject) => {
    db.loadDatabase({}, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(db);
      }
    });
  });
}

// Function to import repository metadata into the database
async function importRepositories() {
  try {
    console.log(`Reading repositories from: ${REPODB_REPOSITORIES_ROOT}`);

    // Load the database
    await loadDatabase();

    // Get or create the 'repositories' collection
    let repos = db.getCollection('repositories');
    if (!repos) {
      repos = db.addCollection('repositories');
    }

    // Traverse the <owner>/<repo> directory structure
    const owners = await fs.readdir(REPODB_REPOSITORIES_ROOT, { withFileTypes: true });

    for (const ownerDir of owners) {
      if (ownerDir.isDirectory()) {
        const ownerPath = path.join(REPODB_REPOSITORIES_ROOT, ownerDir.name);
        const repositories = await fs.readdir(ownerPath, { withFileTypes: true });

        for (const repoDir of repositories) {
          if (repoDir.isDirectory()) {
            const repoPath = path.join(ownerPath, repoDir.name);
            const repoUrl = `https://github.com/${ownerDir.name}/${repoDir.name}`;

            // Example metadata: You can customize this based on your use case
            const metadata = {
              owner: ownerDir.name,
              name: repoDir.name,
              url: repoUrl,
              tags: [], // Add any relevant tags here
              path: repoPath,
            };

            // Insert or update the repository metadata in the database
            const existingRepo = repos.findOne({ url: repoUrl });
            if (existingRepo) {
              repos.update({ ...existingRepo, ...metadata });
            } else {
              repos.insert(metadata);
            }

            console.log(`Imported: ${repoUrl}`);
          }
        }
      }
    }

    // Save the database
    db.saveDatabase();
    console.log('Repository metadata has been imported successfully.');

  } catch (error) {
    console.error(`Error importing repositories: ${error.message}`);
  }
}

// Run the import function
importRepositories();
