import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { GameStore } from './store';
import { LyraAI } from './services/lyra-ai';
import { CombatEngine } from './services/combat';
import { MarketplaceService } from './services/marketplace';
import { registerRoutes } from './routes/game';
import { registerSocketHandlers } from './routes/socket';
import { OGStorageService } from './services/og-storage';

const PORT = parseInt(process.env.PORT || '3001');
const AI_BASE_URL = process.env.AI_BASE_URL || 'http://localhost:20128/v1';
const AI_MODEL = process.env.AI_MODEL || 'xmtp/mimo-v2.5-pro';
const AI_API_KEY = process.env.AI_API_KEY || 'not-needed';

async function main() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  app.use(cors());
  app.use(express.json());

  const store = new GameStore();
  const lyraAI = new LyraAI(AI_BASE_URL, AI_MODEL, AI_API_KEY);
  const combat = new CombatEngine(store);
  const marketplace = new MarketplaceService(store);
  const ogStorage = new OGStorageService(process.env.OG_REAL_STORAGE === 'true');

  registerRoutes(app, store, lyraAI, combat, marketplace, ogStorage);
  registerSocketHandlers(io, store, lyraAI, combat, marketplace);

  server.listen(PORT, () => {
    console.log(`[Project Veyra] Server running on port ${PORT}`);
    console.log(`[Project Veyra] AI: ${AI_BASE_URL} (${AI_MODEL})`);
  });
}

main().catch(console.error);
