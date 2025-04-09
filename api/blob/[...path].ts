import { VercelRequest, VercelResponse } from '@vercel/node';
import { put, del, list } from '@vercel/blob';

const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN is not configured' });
  }

  const { path } = req.query;
  const pathname = Array.isArray(path) ? path.join('/') : path;

  try {
    switch (req.method) {
      case 'GET':
        if (pathname === 'list') {
          const { prefix } = req.query;
          const { blobs } = await list({ token: BLOB_READ_WRITE_TOKEN, prefix: prefix as string });
          return res.json({ blobs });
        } else {
          const response = await fetch(`https://blob.vercel-storage.com/${pathname}`, {
            headers: {
              'Authorization': `Bearer ${BLOB_READ_WRITE_TOKEN}`,
            },
          });
          const data = await response.json();
          return res.json(data);
        }
      case 'PUT':
        const blob = await put(pathname, req.body, {
          access: 'public',
          token: BLOB_READ_WRITE_TOKEN,
        });
        return res.json(blob);
      case 'DELETE':
        await del(pathname, { token: BLOB_READ_WRITE_TOKEN });
        return res.json({ success: true });
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error occurred' });
  }
} 