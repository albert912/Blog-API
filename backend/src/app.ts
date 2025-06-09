// src/app.ts
import express from 'express';
import apiRoutes from './routes';

const app = express();

app.use(express.json()); // Enable JSON body parsing

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Welcome to the Blog API!');
});

// Mount API routes
app.use('/api', apiRoutes);

export default app;