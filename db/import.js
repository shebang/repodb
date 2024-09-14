import loki from 'lokijs';
import fs from 'fs/promises';  // Using promise-based fs methods
import path from 'path';
import os from 'os';
import { Octokit } from '@octokit/rest';

// Define the repository path and the LokiJS database path
const xdgDataHome = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
const repodbPath = path.join(xdgDataHome, 'repodb');
const dbPath = path.join(repodbPath, 'repositories.db');

// Fix the REPODB_REPOSITORIES_ROOT to handle the home directory correctly
const REPODB_REPOSITORIES_ROOT = path.resolve(
  process.env.REPODB_REPOSITORIES_ROOT || path.join(os.homedir(), 'dev/repos/github.com')
);

// Initialize the GitHub API client (Octokit)
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN || 'your-github-token', // Ensure you have a GitHub token
});

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

// Function to fetch metadata from GitHub
async function fetchRepoMetadata(owner, repo) {
  try {
    const { data } = await octokit.repos.get({
      owner: owner,
      repo: repo,
    });

    console.log(data)
    return {
      name: data.name,
      owner: data.owner.login,
      url: data.html_url,
      description: data.description,
      language: data.language,
      stars: data.stargazers_count,
      forks: data.forks_count,
      open_issues: data.open_issues_count,
      topics: data.topics || [], // GitHub topics/tags
    };
  } catch (error) {
    console.error(`Error fetching metadata for ${owner}/${repo}: ${error.message}`);
    return null;
  }
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

            // Fetch metadata from GitHub
            const githubMetadata = await fetchRepoMetadata(ownerDir.name, repoDir.name);
            if (!githubMetadata) {
              continue;  // Skip if metadata fetch failed
            }

            // Store metadata, including GitHub information and local path
            const metadata = {
              ...githubMetadata,
              path: repoPath, // Local path to the repository
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

