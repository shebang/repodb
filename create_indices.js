import loki from 'lokijs';
import fs from 'fs/promises';  // Use promise-based file operations
import path from 'path';
import os from 'os';
import { repodb } from './config.js'; // Import the repodb config

// Define the paths for the LokiJS database and the index files
const xdgDataHome = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
const repodbPath = path.join(xdgDataHome, 'repodb');
const dbPath = path.join(repodbPath, 'repositories.db');

// Define the index directory for file search tools
const includesPath = path.join(repodbPath, 'includes');

// Initialize the LokiJS database (without autosave, since we're just reading data)
const db = new loki(dbPath, {
  persistenceMethod: 'fs', // Use file system persistence to load data
});

// Function to load the database
function loadDatabase() {
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

// Function to ensure directories exist
async function ensureDirExists(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    console.error(`Error creating directory ${dirPath}: ${err.message}`);
  }
}

// Function to write index files for each property (topics, languages, stars, owners)
async function writeIndexFile(dir, filename, paths) {
  const filePath = path.join(dir, filename);
  try {
    // Write the list of repository paths to the file
    await fs.writeFile(filePath, Array.from(new Set(paths)).join('\n') + '\n');  // Use Set to remove duplicates
    console.log(`Index file created: ${filePath}`);
  } catch (err) {
    console.error(`Error writing index file ${filePath}: ${err.message}`);
  }
}

// Function to get clustered topic
function getClusteredTopic(topic) {
  for (const [cluster, variations] of Object.entries(repodb.topicClusters)) {
    if (variations.includes(topic)) {
      return cluster; // Return the clustered topic
    }
  }
  return topic; // Return original topic if no cluster found
}

// Function to create index files based on repository metadata
async function createIndices() {
  try {
    // Load the database
    await loadDatabase();

    // Get the 'repositories' collection
    const repos = db.getCollection('repositories');
    if (!repos) {
      console.error('Repositories collection not found in the database');
      return;
    }

    // Ensure index directories exist
    const dirs = {
      languages: path.join(includesPath, 'languages'),
      topics: path.join(includesPath, 'topics'),
      stars: path.join(includesPath, 'stars'),
      owners: path.join(includesPath, 'owners'),
    };

    await Promise.all(Object.values(dirs).map(ensureDirExists));

    // Initialize index maps
    const indices = {
      languages: new Map(),
      topics: new Map(),
      stars: new Map(),
      owners: new Map(),
    };

    // Step through each repository and categorize by property
    const allRepos = repos.find();
    allRepos.forEach(repo => {
      // Categorize by language
      if (repo.language) {
        const lang = repo.language.toLowerCase();
        if (!indices.languages.has(lang)) {
          indices.languages.set(lang, new Set());
        }
        indices.languages.get(lang).add(repo.path);  // Use Set to prevent duplicates
      }

      // Categorize by topics/tags with clustering
      if (repo.topics) {
        repo.topics.forEach(topic => {
          const normalizedTopic = topic.toLowerCase();
          const clusteredTopic = getClusteredTopic(normalizedTopic); // Apply clustering
          if (!indices.topics.has(clusteredTopic)) {
            indices.topics.set(clusteredTopic, new Set());
          }
          indices.topics.get(clusteredTopic).add(repo.path);  // Use Set to prevent duplicates
        });
      }

      // Categorize by stars (group by ranges, e.g., 0-99, 100-999, etc.)
      const starRange = Math.floor(repo.stars / 100) * 100;
      const starLabel = `${starRange}-${starRange + 99}`;
      if (!indices.stars.has(starLabel)) {
        indices.stars.set(starLabel, new Set());
      }
      indices.stars.get(starLabel).add(repo.path);  // Use Set to prevent duplicates

      // Categorize by owner
      const owner = repo.owner.toLowerCase();
      if (!indices.owners.has(owner)) {
        indices.owners.set(owner, new Set());
      }
      indices.owners.get(owner).add(repo.path);  // Use Set to prevent duplicates
    });

    // Write index files for each property
    await Promise.all([
      // Write language index files
      ...Array.from(indices.languages.entries()).map(([lang, paths]) =>
        writeIndexFile(dirs.languages, lang, Array.from(paths))
      ),
      // Write topic index files
      ...Array.from(indices.topics.entries()).map(([topic, paths]) =>
        writeIndexFile(dirs.topics, topic, Array.from(paths))
      ),
      // Write star range index files
      ...Array.from(indices.stars.entries()).map(([starRange, paths]) =>
        writeIndexFile(dirs.stars, starRange, Array.from(paths))
      ),
      // Write owner index files
      ...Array.from(indices.owners.entries()).map(([owner, paths]) =>
        writeIndexFile(dirs.owners, owner, Array.from(paths))
      ),
    ]);

    console.log('Index files created successfully.');
  } catch (error) {
    console.error(`Error creating indices: ${error.message}`);
  }
}

// Run the function to create indices
createIndices();

