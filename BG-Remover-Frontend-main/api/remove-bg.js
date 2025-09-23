import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Handle file upload manually (since multer may not work directly in Vercel)
  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', () => {
    const buffer = Buffer.concat(chunks);
    const boundary = req.headers['content-type'].split('boundary=')[1];
    const parts = buffer.toString().split(`--${boundary}`);

    let imageBuffer = null;
    let filename = 'uploaded';

    for (const part of parts) {
      if (part.includes('Content-Disposition: form-data; name="image"')) {
        const contentTypeMatch = part.match(/Content-Type: (.+)/);
        if (contentTypeMatch && contentTypeMatch[1].startsWith('image/')) {
          const lines = part.split('\r\n');
          filename = lines[1].match(/filename="(.+)"/)[1] || 'uploaded';
          imageBuffer = Buffer.from(part.split('\r\n\r\n')[1], 'binary');
        }
      }
    }

    if (!imageBuffer) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const inputPath = `/tmp/${Date.now()}-${filename}`;
    const outputPath = `/tmp/${Date.now()}-output.png`;

    fs.writeFileSync(inputPath, imageBuffer);

    // Call Python script
    exec(`python api/remove_bg.py ${inputPath} ${outputPath}`, (err, stdout, stderr) => {
      if (err) {
        console.error('Python error:', stderr);
        fs.unlinkSync(inputPath);
        return res.status(500).json({ error: 'Image processing failed' });
      }

      const outputBuffer = fs.readFileSync(outputPath);
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);

      res.setHeader('Content-Type', 'image/png');
      res.send(outputBuffer);
    });
  });
}