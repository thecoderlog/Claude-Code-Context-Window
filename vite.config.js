import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import users from './api/users.json' with { type: 'json' };

// A tiny API served by Vite itself:  GET /api/users (everyone) and GET /api/users/:id (one person)
const DELAY_MS = 400;

function usersApi(req, res, next) {
  const match = req.url.match(/^\/api\/users(?:\/([\w-]+))?$/);
  if (!match) return next();
  const id = match[1];
  setTimeout(() => {
    const data = id ? users[id] : Object.values(users);
    if (!data) {
      res.statusCode = 404;
      return res.end('Not found');
    }
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  }, DELAY_MS);
}

const usersPlugin = {
  name: 'users-api',
  configureServer(server) {
    server.middlewares.use(usersApi);
  },
  configurePreviewServer(server) {
    server.middlewares.use(usersApi);
  },
};

export default defineConfig(({ mode }) => ({
  server: { port: Number(loadEnv(mode, process.cwd(), '').PORT) || 5173 },
  plugins: [react(), usersPlugin],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.js',
    include: ['src/**/*.test.jsx'],
  },
}));
