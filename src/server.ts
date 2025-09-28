import express from 'express';
import multer from 'multer';
import { Queue } from 'bullmq';
import { z } from 'zod';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const upload = multer({ dest: 'uploads/' });
const queue = new Queue('jobApplications');  // Add Redis connection if scaling: { connection: { host: 'localhost', port: 6379 } }

// Input Schema
const ApplySchema = z.object({
  url: z.string().url(),
  info: z.object({ name: z.string(), email: z.string() }),  // Expand as needed
});

// API Endpoint
app.post('/apply', upload.single('cv'), async (req, res) => {
  try {
    const { url, info } = ApplySchema.parse({ url: req.body.url, info: JSON.parse(req.body.info) });
    const cvPath = req.file?.path;

    if (!cvPath) throw new Error('CV required');

    // Enqueue job with absolute path for CV
    await queue.add('applyJob', { url, cvPath: path.resolve(cvPath), info });
    res.json({ status: 'Queued' });
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

app.listen(3000, () => console.log('Server on port 3000'));