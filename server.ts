import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { attachCollabServer } from './server/collab-server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

app.use(express.json());

// Attach WebSockets and API routes
attachCollabServer(server, app);

// Serve static frontend in production
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`CollabScholar server running on port ${PORT}`);
});
