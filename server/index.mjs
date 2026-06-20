import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { readFile, stat } from 'fs/promises';
import { join, extname, normalize } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import https from 'https';

import { GameStore } from './db/store.mjs';
import { LyraAI } from './services/lyra-ai.mjs';
import { CombatEngine } from './services/combat.mjs';
import { MarketplaceService } from './services/marketplace.mjs';
import { OGStorageService } from './services/og-storage.mjs';
import { registerAuthRoutes } from './routes/auth.mjs';
import { registerGameRoutes } from './routes/game.mjs';
import { registerSocketHandlers } from './handlers/socket.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '8790');

const VIRTUALS_HOST = 'compute.virtuals.io';
const VIRTUALS_PATH = '/v1/chat/completions';
const VIRTUALS_KEY = process.env.VIRTUALS_KEY || '';
const VIRTUALS_MODEL = 'anthropic-claude-sonnet-4-5';

const ROUTER_HOST = 'localhost';
const ROUTER_PORT = 20128;
const ROUTER_PATH = '/v1/chat/completions';
const ROUTER_MODEL = 'virtuals/anthropic-claude-sonnet-4-5';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function callRouter(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ ...payload, model: ROUTER_MODEL, stream: false });
    const req = http.request({
      host: ROUTER_HOST, port: ROUTER_PORT, path: ROUTER_PATH,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout: 45000,
    }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(new Error('router timeout')); });
    req.write(body);
    req.end();
  });
}

function callVirtuals(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ ...payload, model: VIRTUALS_MODEL });
    const req = https.request({
      host: VIRTUALS_HOST, path: VIRTUALS_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + VIRTUALS_KEY,
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 45000,
    }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(new Error('virtuals timeout')); });
    req.write(body);
    req.end();
  });
}

function extractText(raw) {
  try {
    const j = JSON.parse(raw);
    return j?.choices?.[0]?.message?.content?.trim() || '';
  } catch { return ''; }
}

async function callAI(payload) {
  try {
    const out = await callRouter(payload);
    if (out.status === 200) {
      const t = extractText(out.data);
      if (t) return t;
    }
  } catch (e) { /* fall through */ }
  try {
    if (VIRTUALS_KEY) {
      const out = await callVirtuals(payload);
      if (out.status === 200) return extractText(out.data);
    }
  } catch (e) { /* fall through */ }
  return '';
}

async function handleAI(req, res) {
  let raw = '';
  req.on('data', (c) => (raw += c));
  req.on('end', async () => {
    try {
      const body = JSON.parse(raw || '{}');
      const messages = body.messages;
      if (!Array.isArray(messages) || messages.length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'messages required' }));
        return;
      }
      const payload = {
        messages,
        max_tokens: body.max_tokens || 700,
        temperature: body.temperature ?? 0.8,
      };
      const text = await callAI(payload);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: text }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: String(e && e.message || e), message: '' }));
    }
  });
}

async function main() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  app.use(cors());
  app.use(express.json());

  const store = new GameStore();
  const lyraAI = new LyraAI();
  const combat = new CombatEngine(store);
  const marketplace = new MarketplaceService(store);
  const ogStorage = new OGStorageService(process.env.OG_REAL_STORAGE === 'true');

  const { authService, requireAuth } = registerAuthRoutes(app, store);
  registerGameRoutes(app, store, lyraAI, combat, marketplace, ogStorage, requireAuth);
  registerSocketHandlers(io, store, lyraAI, combat, marketplace);

  app.post('/api/ai', handleAI);

  app.use(async (req, res) => {
    if (req.method !== 'GET') {
      res.writeHead(405); res.end('method not allowed'); return;
    }
    let rel = decodeURIComponent(req.url.split('?')[0]);
    if (rel === '/' || rel === '') rel = '/index.html';
    const safe = normalize(rel).replace(/^(\.\.[/\\])+/, '');
    const filePath = join(__dirname, '..', safe);
    if (!filePath.startsWith(join(__dirname, '..'))) {
      res.writeHead(403); res.end('forbidden'); return;
    }
    try {
      const s = await stat(filePath);
      if (s.isDirectory()) { res.writeHead(404); res.end('not found'); return; }
      const buf = await readFile(filePath);
      const mime = MIME[extname(filePath).toLowerCase()] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache' });
      res.end(buf);
    } catch {
      res.writeHead(404); res.end('not found');
    }
  });

  server.listen(PORT, () => {
    console.log(`[New Project Veyra] Server running on port ${PORT}`);
    console.log(`[New Project Veyra] AI: 9Router(${ROUTER_HOST}:${ROUTER_PORT})`);
    console.log(`[New Project Veyra] Game: http://localhost:${PORT}`);
  });

  process.on('SIGINT', () => {
    console.log('[Server] SIGINT received, saving state...');
    store.saveToDisk();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('[Server] SIGTERM received, saving state...');
    store.saveToDisk();
    process.exit(0);
  });
}

main().catch(console.error);
