import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const port = 3001;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

const BLOB_READ_WRITE_TOKEN = process.env.VITE_BLOB_TOKEN;

// Proxy endpoint for listing blobs
app.get('/api/list', async (req, res) => {
  try {
    const { prefix } = req.query;
    const response = await fetch(`https://blob.vercel-storage.com/?prefix=${encodeURIComponent(prefix)}`, {
      headers: {
        'Authorization': `Bearer ${BLOB_READ_WRITE_TOKEN}`,
      },
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Proxy endpoint for getting a blob
app.get('/api/blob/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const response = await fetch(`https://blob.vercel-storage.com/${key}`, {
      headers: {
        'Authorization': `Bearer ${BLOB_READ_WRITE_TOKEN}`,
      },
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Proxy server running at http://localhost:${port}`);
}); 