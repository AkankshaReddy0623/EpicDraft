# StoryWeave

A multi-author, gamified collaborative story-writing platform built with React, TypeScript, and Firebase. Create branching narratives, vote on story paths, and earn points as you craft epic tales together.

## Features

- ✍️ **Collaborative Writing** - Create branching story narratives with multiple authors
- 🎮 **Gamification** - Earn points, unlock badges, and compete on leaderboards
- 🗳️ **Voting System** - Vote on which story branches become canon
- 📊 **Story Graph Visualization** - Interactive React Flow visualization of story nodes
- 💬 **Real-time Chat** - Lightweight chat in story rooms
- 🏪 **Store** - Redeem boosts and cosmetics with earned points

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: TailwindCSS (light theme + gold accent)
- **State Management**: React Query + Context
- **Routing**: React Router
- **Backend**: Firebase Firestore (realtime)
- **Authentication**: Firebase Auth (Google Sign-In)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/     # Reusable components (Navbar, etc.)
├── pages/         # Page components (Landing, Dashboard, Room, etc.)
├── App.tsx        # Main app with routing
├── main.tsx       # Entry point
└── index.css      # Global styles with Tailwind
```

## Routes

- `/` - Landing page
- `/login` - Authentication
- `/home` - Dashboard (created + joined rooms)
- `/create` - Create new story
- `/room/:roomId` - Story room (edit mode)
- `/room/:roomId/read` - Reader mode
- `/profile` - User profile
- `/store` - Store (redeem boosts/cosmetics)
- `/leaderboard` - Leaderboard rankings
- `/404` - Not found page

## Theme

- **Background**: #FAFAFA
- **Text**: #1A1A1A
- **Accent**: #D4AF37 (gold)
- **Light Gold**: #E6C96B
- **Borders**: #EAEAEA

## Next Steps

- Set up Firebase configuration
- Implement authentication
- Add Firestore realtime sync
- Integrate React Flow for story graph
- Implement voting system
- Add gamification features

## License

MIT
