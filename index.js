import express from 'express';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Octokit } from '@octokit/rest'; // Named import from Octokit
const app = express();

// Swagger definition
const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: "Repodb API",
      version: "1.0.0",
      description: "API to query local repository indices",
    },
  },

  apis: ['./routes/*.js'], // Point to route files
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.get('/repositories', (req, res) => {
  const { lang, topic } = req.query;
  // Fetch repositories based on lang or topic
  res.send('Your repositories here...');
});

// Route to get repository metadata
app.get('/repository/:owner/:repo', async (req, res) => {
  const { owner, repo } = req.params;

  try {
    // Fetch repository metadata using Octokit
    const { data } = await Octokit.repos.get({
      owner: owner,
      repo: repo,
    });

    // Extract relevant metadata
    const metadata = {
      name: data.name,
      description: data.description,
      language: data.language,
      topics: data.topics,
      stars: data.stargazers_count,
      forks: data.forks_count,
      open_issues: data.open_issues_count,
    };

    // Send the metadata as JSON
    res.json(metadata);
  } catch (error) {
    console.error(`Error fetching repo metadata: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch repository metadata' });
  }
});
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
