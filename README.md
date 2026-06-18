# Project Veyra

AI-native MMORPG built on 0G infrastructure for the Zero Cup hackathon.

## Architecture

```
project-veyra/
├── packages/
│   ├── shared/     # TypeScript types, constants, utilities
│   ├── server/     # Express + Socket.io + Game Engine + Lyra AI + 0G
│   └── web/        # Next.js + PixiJS game client
└── docs/           # Game design docs, API spec
```

## Quick Start

```bash
npm install
npm run dev        # starts server + web concurrently
```

## Tech Stack

- **Frontend:** Next.js 14 + PixiJS 7 + Tailwind CSS
- **Backend:** Node.js + Express + Socket.io
- **Database:** PostgreSQL + Redis
- **AI:** MIMO v2.5-pro via OpenAI-compatible API
- **Blockchain:** 0G Chain (VEYA token) + 0G Storage (NPC memory, chronicle)

## 0G Integration

| Feature | 0G Component | Why Essential |
|---------|-------------|---------------|
| Lyra's Memory | 0G Storage | NPC remembers every player interaction permanently |
| World Chronicle | 0G Storage | Immutable history of all player actions |
| Marketplace | 0G Chain | VS→VEYA conversion, on-chain settlement |
| Soulbond NFT | 0G Chain | On-chain player-NPC relationship |

## License

MIT
