# Case Files: Seek and Find

A detective-themed geography guessing game where you track down a global phantom thief by identifying countries from photo clues. Race against the clock, read the evidence, and pin the suspect's location on the world map.

---

## Gameplay

### Objective

Each round presents a crime scene photo and a set of written clues describing a country. Your mission: identify the correct country on the interactive world map before time runs out.

### How to Play

1. **Study the crime scene** — A photo and a thief's clue establish the scene
2. **Read the evidence** — Up to 3 clues are available; reveal them one by one
3. **Click the map** — Select the country you think the suspect fled to
4. **Submit your answer** — The map highlights the correct (green) and wrong (red) countries, and shows how far off your guess was
5. **Learn something new** — Every round ends with a cultural fact card covering geography, history, culture, and a wild field note

### Scoring

| Clues Used | Points Awarded |
|:---:|:---:|
| 0 | 30 pts |
| 1 | 20 pts |
| 2 | 10 pts |
| 3 | 5 pts |

Guessing wrong or timing out earns **0 points**. The fewer clues you need, the sharper the detective.

### Difficulty Tiers

Each tier contains **6 cases** with progressively harder countries and shorter timers:

| Tier | Countries | Time Limit |
|:---|:---|:---:|
| 🟢 Rookie Chase | Well-known countries (France, Japan, Italy…) | 60 sec |
| 🟡 Senior Agent | Less obvious destinations | 45 sec |
| 🔴 Elite Operation | Obscure and challenging locations | 30 sec |

Complete a tier to unlock the next one.

### Achievements

| Badge | Achievement | Condition |
|:---:|:---|:---|
| 🏆 | Perfect Capture | Catch all 3 suspects in a run |
| ⚡ | Speed Demon | Answer every case with 0 clues used |
| ⏱ | No Timeouts | Complete a full run without running out of time |
| 🎖 | Rookie Graduate | Score 60+ pts on Rookie Chase |
| 🥈 | Senior Agent | Score 60+ pts on Senior Agent |
| 🥇 | Elite Detective | Score 60+ pts on Elite Operation |
| 👑 | Grand Master | Conquer all three difficulty tiers |

---

## Running Locally

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later

### Setup

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Then open **http://localhost:5173** in your browser.

Alternatively, double-click **startgame.bat`** (Windows) to start the server and open the browser automatically.

### Environment Variables

Create a `.env.local` file in the project root:

```
VITE_PEXELS_API_KEY=your_pexels_api_key_here
```

A Pexels API key is used to fetch crime scene photos. You can get a free key at [pexels.com/api](https://www.pexels.com/api/).

### Build for Production

```bash
npm run build
```

Output is generated in the `dist/` folder.

---

## Tech Stack

- **React 18** + **TypeScript** — UI and game logic
- **Vite** — Development server and build tool
- **Leaflet** + **react-leaflet** — Interactive world map
- **Framer Motion** — Animations
- **Tailwind CSS** — Styling
- **Pexels API** — Crime scene photography

---

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── ThiefDetectiveGame.tsx   # Main game logic and all level data
│   │   ├── GeoGuessrMap.tsx         # Interactive Leaflet world map
│   │   ├── IntroSequence.tsx        # Animated intro screen
│   │   └── soundUtils.ts            # Sound effects
│   └── services/
│       └── pexelsService.ts         # Pexels API integration
└── main.tsx
```

---

## Original Design

The original Figma design is available at [figma.com](https://www.figma.com/design/0wHzLvZekTDPaMGfZ81Z2Q/).
