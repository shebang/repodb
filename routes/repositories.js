import express from 'express';
import { Octokit } from '@octokit/rest'; // Named import from Octokit
import { promises as fs } from 'fs';
import path from 'path';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN, // Use an environment variable for the GitHub token
});

const router = express.Router();

// Fix the REPO_PATH to handle the home directory correctly
const REPODB_REPOSITORIES_ROOT = path.resolve(
  process.env.REPODB_REPOSITORIES_ROOT || path.join(os.homedir(), 'dev/repos/github.com')
);

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
    // Step 1: Get the list of owners (directories under REPO_PATH)
    const owners = await fs.readdir(REPODB_REPOSITORIES_ROOT, { withFileTypes: true });

    const filteredRepos = [];

    // Step 2: Loop through owners and their repositories
    for (const ownerDir of owners) {
      if (ownerDir.isDirectory()) {
        const ownerPath = path.join(REPODB_REPOSITORIES_ROOT, ownerDir.name);
        const repos = await fs.readdir(ownerPath, { withFileTypes: true });

        for (const repoDir of repos) {
          if (repoDir.isDirectory()) {
            const repo = repoDir.name;
            const owner = ownerDir.name;

            try {
              // Fetch repository metadata from GitHub API
              const { data } = await octokit.repos.get({
                owner: owner,
                repo: repo,
              });

              console.log(data)
              // Filter by language or topic
              if (
                (lang && data.language === lang) ||
                (topic && data.topics.includes(topic))
              ) {
                filteredRepos.push({
                  owner,
                  repo: data.name,
                  description: data.description,
                  language: data.language,
                  stars: data.stargazers_count,
                  forks: data.forks_count,
                  open_issues: data.open_issues_count,
                  topics: data.topics,
                });
              }

            } catch (error) {
              console.warn(`Failed to fetch metadata for ${owner}/${repo}: ${error.message}`);
            }
          }
        }
      }
    }

    // Step 3: Return the filtered list of repositories
    res.json(filteredRepos);

  } catch (error) {
    console.error(`Error reading repositories: ${error.message}`);
    res.status(500).json({ error: 'Failed to list repositories' });
  }
}); export default router;


