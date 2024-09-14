import loki from 'lokijs';
import path from 'path';
import os from 'os';

// Define the path to the LokiJS database
const xdgDataHome = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
const dbPath = path.join(xdgDataHome, 'repodb', 'repositories.db');

// Initialize LokiJS database (without autosave, since we're just reading data)
const db = new loki(dbPath, {
  persistenceMethod: 'fs', // Use the file system persistence to load data
});

// Load the database
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

// Function to list all repositories
function listAllRepositories() {
  const repos = db.getCollection('repositories');
  const allRepos = repos.find();
  console.log('All Repositories:');
  allRepos.forEach(repo => {
    console.log(repo.path);  // Output only the local path
    // console.log(`- ${repo.owner}/${repo.name} (${repo.url})`);
  });
}

// Function to query repositories by owner
function queryByOwner(owner) {
  const repos = db.getCollection('repositories');
  const ownerRepos = repos.find({ owner: owner });
  console.log(`Repositories by owner "${owner}":`);
  ownerRepos.forEach(repo => {
    console.log(repo.path);  // Output only the local path
    // console.log(`- ${repo.name} (${repo.url})`);
  });
}

// Function to query repositories by language
function queryByLanguage(language) {
  const repos = db.getCollection('repositories');
  const languageRepos = repos.find({ language: language });
  console.log(`Repositories using language "${language}":`);
  languageRepos.forEach(repo => {
    console.log(repo.path);  // Output only the local path
    // console.log(`- ${repo.owner}/${repo.name} (${repo.url})`);
  });
}

// Function to query repositories by repository topics/tags
function queryByRepositoryTopics(topic) {
  const repos = db.getCollection('repositories');
  const topicRepos = repos.find({ tags: { '$contains': topic } });
  console.log(`Repositories with topic "${topic}":`);
  topicRepos.forEach(repo => {
    console.log(repo.path);  // Output only the local path
    // console.log(`- ${repo.owner}/${repo.name} (${repo.url})`);
  });
}

// Main function to load the database and run example queries
async function runQueries() {
  try {
    await loadDatabase();

    // Example queries
    listAllRepositories();
    console.log('---');

    queryByOwner('neovim'); // Replace 'neovim' with an actual owner from your DB
    console.log('---');

    queryByLanguage('lua'); // Replace 'lua' with the language you're querying
    console.log('---');

    queryByRepositoryTopics('neovim'); // Replace 'neovim' with the topic/tag you're querying
    console.log('---');

  } catch (error) {
    console.error(`Error querying the database: ${error.message}`);
  }
}

// Run the queries
runQueries();
