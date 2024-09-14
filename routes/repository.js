
const express = require('express');
const { Octokit } = require('@octokit/rest');
const router = express.Router();

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN, // Use an environment variable for the GitHub token
});

/**
 * @swagger
 * /repository/{owner}/{repo}:
 *   get:
 *     summary: Get metadata for a specific repository
 *     description: Retrieve metadata such as description, stars, forks, and topics for a specific GitHub repository.
 *     parameters:
 *       - in: path
 *         name: owner
 *         schema:
 *           type: string
 *         required: true
 *         description: GitHub owner or organization name
 *       - in: path
 *         name: repo
 *         schema:
 *           type: string
 *         required: true
 *         description: GitHub repository name
 *     responses:
 *       200:
 *         description: Repository metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 language:
 *                   type: string
 *                 stars:
 *                   type: integer
 *                 forks:
 *                   type: integer
 *                 open_issues:
 *                   type: integer
 *                 topics:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/:owner/:repo', async (req, res) => {
  const { owner, repo } = req.params;

  try {
    const { data } = await octokit.repos.get({
      owner,
      repo,
    });

    const metadata = {
      name: data.name,
      description: data.description,
      language: data.language,
      stars: data.stargazers_count,
      forks: data.forks_count,
      open_issues: data.open_issues_count,
      topics: data.topics,
    };

    res.json(metadata);
  } catch (error) {
    console.error(`Error fetching repo metadata: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch repository metadata' });
  }
});

module.exports = router;
