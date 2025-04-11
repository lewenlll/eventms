import express from 'express';
import cors from 'cors';
import { list, put, del } from '@vercel/blob';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Debug logging for environment variables
console.log('Environment variables loaded:');
console.log('BLOB_READ_WRITE_TOKEN:', process.env.BLOB_READ_WRITE_TOKEN ? 'Set' : 'Not set');
console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors({
  origin: '*', // In production, replace with your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

if (!BLOB_READ_WRITE_TOKEN) {
  console.error('BLOB_READ_WRITE_TOKEN is not set in environment variables');
  process.exit(1);
}

// Proxy endpoint for listing blobs
app.get('/api/list', async (req, res) => {
  try {
    const { prefix } = req.query;
    console.log('Listing blobs with prefix:', prefix);
    console.log('Using token:', BLOB_READ_WRITE_TOKEN ? 'Token is set' : 'Token is not set');

    const { blobs } = await list({ 
      token: BLOB_READ_WRITE_TOKEN,
      prefix: prefix
    });
    
    console.log('Found blobs:', blobs);
    res.json({ blobs });
  } catch (error) {
    console.error('Error listing blobs:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.stack
    });
  }
});

// POST endpoint for getting a blob in development mode
app.post('/api/blob', async (req, res) => {
  try {
    const { key, prefix } = req.body;
    if (!key) {
      return res.status(400).json({ error: 'Key is required' });
    }

    console.log('Getting blob with key:', key);
    console.log('Getting blob with prefix:', prefix);
    console.log('Using token:', BLOB_READ_WRITE_TOKEN ? 'Token is set' : 'Token is not set');

    const { blobs } = await list({ 
      token: BLOB_READ_WRITE_TOKEN,
      prefix: prefix
    });
    
    console.log('Found blobs:', JSON.stringify(blobs, null, 2));
    
    if (blobs.length === 0) {
      console.log('No blobs found for key:', key);
      return res.status(404).json({ error: 'Blob not found' });
    }

    // Find the exact blob that matches the key
    const blob = blobs.find(b => b.pathname === key);
    console.log('Looking for exact match with pathname:', key);
    console.log('Available pathnames:', blobs.map(b => b.pathname));
    
    if (!blob) {
      console.log('No exact match found for key:', key);
      return res.status(404).json({ error: 'Blob not found' });
    }

    const response = await fetch(blob.url);
    if (!response.ok) {
      console.error('Failed to fetch blob data:', response.status, response.statusText);
      throw new Error('Failed to fetch blob data');
    }
    
    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.log('No JSON data found, returning empty object');
      data = {};
    }
    
    console.log('Successfully fetched blob data');
    res.json(data);
  } catch (error) {
    console.error('Error getting blob:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.stack
    });
  }
});

// Proxy endpoint for getting a blob
app.get('/api/blob/:key', async (req, res) => {
  try {
    const { key } = req.params;
    console.log('Getting blob with key:', key);
    console.log('Full request path:', req.path);
    console.log('Using token:', BLOB_READ_WRITE_TOKEN ? 'Token is set' : 'Token is not set');

    const { blobs } = await list({ 
      token: BLOB_READ_WRITE_TOKEN,
      prefix: key
    });
    
    console.log('Found blobs:', JSON.stringify(blobs, null, 2));
    
    if (blobs.length === 0) {
      console.log('No blobs found for key:', key);
      return res.status(404).json({ error: 'Blob not found' });
    }

    // Find the exact blob that matches the key
    const blob = blobs.find(b => b.pathname === key);
    console.log('Looking for exact match with pathname:', key);
    console.log('Available pathnames:', blobs.map(b => b.pathname));
    
    if (!blob) {
      console.log('No exact match found for key:', key);
      return res.status(404).json({ error: 'Blob not found' });
    }

    const response = await fetch(blob.url);
    if (!response.ok) {
      console.error('Failed to fetch blob data:', response.status, response.statusText);
      throw new Error('Failed to fetch blob data');
    }
    const data = await response.json();
    console.log('Successfully fetched blob data');
    res.json(data);
  } catch (error) {
    console.error('Error getting blob:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.stack
    });
  }
});

// POST endpoint for saving a blob
app.post('/api/blob/update', async (req, res) => {
  try {
    const { key, data } = req.body;
    const prefix = key.substring(0, key.indexOf("/") + 1);
    console.log('Saving blob with key:', key);
    console.log('Data:', data);
    console.log('Using token:', BLOB_READ_WRITE_TOKEN ? 'Token is set' : 'Token is not set');

    const { blobs } = await list({ 
      token: BLOB_READ_WRITE_TOKEN,
      prefix: prefix
    });
    
    // If blob exists, update it
    if (blobs.length > 0) {
      console.log('Found blobs:', JSON.stringify(blobs, null, 2));
      const blob = blobs.find(b => b.pathname === key);
      if (blob) {
        console.log('Updating existing blob');
        
        await put(key, JSON.stringify(data), {
          access: 'public',
          token: BLOB_READ_WRITE_TOKEN,
          
        });

        await del(blob.url, { token: BLOB_READ_WRITE_TOKEN });
        console.log('Existing blob deleted:', blob.url);
        return res.json(data);
      }
    }

    // Create new blob
    console.log('Creating new blob');
    await put(key, JSON.stringify(data), {
      access: 'public',
      token: BLOB_READ_WRITE_TOKEN,
    });
    
    res.json(data);
  } catch (error) {
    console.error('Error saving blob:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.stack
    });
  }
});

// Users endpoints
app.get('/api/users', async (req, res) => {
  try {
    const { blobs } = await list({ 
      token: process.env.BLOB_READ_WRITE_TOKEN,
      prefix: 'users/'
    });
    
    if (blobs.length === 0) {
      return res.json([]);
    }

    // Skip directory blobs
    const fileBlobs = blobs.filter(b => !b.pathname.endsWith('/'));
    if (fileBlobs.length === 0) {
      return res.json([]);
    }

    const response = await fetch(fileBlobs[0].url);
    const users = await response.json();
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const { blobs } = await list({ 
      token: process.env.BLOB_READ_WRITE_TOKEN,
      prefix: 'users/'
    });
    
    if (blobs.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Skip directory blobs
    const fileBlobs = blobs.filter(b => !b.pathname.endsWith('/'));
    if (fileBlobs.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const response = await fetch(fileBlobs[0].url);
    const users = await response.json();
    const user = users.find(u => u.id === req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { blobs } = await list({ 
      token: process.env.BLOB_READ_WRITE_TOKEN,
      prefix: 'users/'
    });
    
    const newUser = req.body;
    let users = [];
    
    // Skip directory blobs
    const fileBlobs = blobs.filter(b => !b.pathname.endsWith('/'));
    if (fileBlobs.length > 0) {
      const response = await fetch(fileBlobs[0].url);
      users = await response.json();
    }
    
    users.push(newUser);
    await put('users.json', JSON.stringify(users), { 
      token: process.env.BLOB_READ_WRITE_TOKEN,
      access: 'public'
    });
    
    res.json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { blobs } = await list({ 
      token: process.env.BLOB_READ_WRITE_TOKEN,
      prefix: 'users/'
    });
    
    if (blobs.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Skip directory blobs
    const fileBlobs = blobs.filter(b => !b.pathname.endsWith('/'));
    if (fileBlobs.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const response = await fetch(fileBlobs[0].url);
    const users = await response.json();
    const index = users.findIndex(u => u.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    users[index] = { ...users[index], ...req.body };
    await put('users.json', JSON.stringify(users), { 
      token: process.env.BLOB_READ_WRITE_TOKEN,
      access: 'public'
    });
    
    res.json(users[index]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { blobs } = await list({ 
      token: process.env.BLOB_READ_WRITE_TOKEN,
      prefix: 'users/'
    });
    
    if (blobs.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Skip directory blobs
    const fileBlobs = blobs.filter(b => !b.pathname.endsWith('/'));
    if (fileBlobs.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const response = await fetch(fileBlobs[0].url);
    const users = await response.json();
    const filteredUsers = users.filter(u => u.id !== req.params.id);
    
    await put('users.json', JSON.stringify(filteredUsers), { 
      token: process.env.BLOB_READ_WRITE_TOKEN,
      access: 'public'
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Serve static files from the dist directory in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('BLOB_READ_WRITE_TOKEN is set:', BLOB_READ_WRITE_TOKEN ? 'Yes' : 'No');
}); 