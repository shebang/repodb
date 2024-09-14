import express from 'express';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Octokit } from '@octokit/rest'; // Named import from Octokit
import repositoriesRoutes from './routes/repositories.js'; // Adjust the path as needed
import repositoryRoutes from './routes/repository.js'; // Adjust the path as needed

const app = express();

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN, // Use an environment variable for the GitHub token
});

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

app.use('/repositories', repositoriesRoutes);
app.use('/repository', repositoryRoutes);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
