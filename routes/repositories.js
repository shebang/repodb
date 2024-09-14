import express from 'express';
import path from 'path';
import loki from 'lokijs';
import os from 'os';

// Define the repository path and the LokiJS database path
const xdgDataHome = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
const dbPath = path.join(xdgDataHome, 'repodb', 'repositories.db');

// Initialize the LokiJS database (without autosave, since we're just reading data)
const db = new loki(dbPath, {
  persistenceMethod: 'fs', // Use file system persistence to load data
});

const router = express.Router();

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

/**
 * @swagger
 * /repositories:
 *   get:
 *     summary: Retrieve a list of repositories
 *     description: Retrieve repositories filtered by programming language or topic.
 *     parameters:
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *         description: Programming language of the repositories.
 *       - in: query
 *         name: topic
 *         schema:
 *           type: string
 *         description: Topic associated with the repositories.
 *     responses:
 *       200:
 *         description: A list of repositories.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: List of repositories based on language or topic
 */
router.get('/', async (req, res) => {
  const { lang, topic } = req.query;

  try {
    // Step 1: Load the LokiJS database
    await loadDatabase();

    // Step 2: Get the 'repositories' collection
    const repos = db.getCollection('repositories');

    if (!repos) {
      return res.status(500).json({ error: 'Repositories collection not found in the database' });
    }

    // Step 3: Query the repositories from the database
    let filteredRepos = repos.find(); // Get all repositories initially

    // Apply filters for language or topic
    if (lang) {
      filteredRepos = filteredRepos.filter(repo => repo.language && repo.language.toLowerCase() === lang.toLowerCase());
    }

    if (topic) {
      filteredRepos = filteredRepos.filter(repo => repo.topics && repo.topics.includes(topic.toLowerCase()));
    }

    // Step 4: Return the filtered list of repositories
    res.json(filteredRepos);

  } catch (error) {
    console.error(`Error querying repositories: ${error.message}`);
    res.status(500).json({ error: 'Failed to query repositories' });
  }
});

export default router;

