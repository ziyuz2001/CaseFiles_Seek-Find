# CODEBASE MAP — CaseFiles: Seek & Find (Phantom Detective)

> Written for a reader who has never seen this code. All function names, state variable names, and prop names are taken directly from the source.

---

## 1. File Tree

```
CaseFiles_Seek-Find/
├── index.html                          # Root HTML shell; mounts React into <div id="root">
├── package.json                        # Dependencies and build scripts (vite dev/build)
├── vite.config.ts                      # Vite bundler; sets path alias @ → ./src; includes SVG/CSV assets
├── postcss.config.mjs                  # PostCSS config for Tailwind compilation
├── tsconfig.json                       # TypeScript compiler options
├── tsconfig.app.json                   # App-specific TS config
├── tsconfig.node.json                  # Node-environment TS config (for vite.config)
│
├── src/
│   ├── main.tsx                        # Entry point; renders <App /> into #root
│   │
│   ├── app/
│   │   ├── App.tsx                     # Root component; simply renders <ThiefDetectiveGame />
│   │   │
│   │   ├── components/
│   │   │   ├── ThiefDetectiveGame.tsx  # CORE: all game state, logic, and UI screens (2,601 lines)
│   │   │   ├── GeoGuessrMap.tsx        # Interactive Leaflet map for country selection (477 lines)
│   │   │   ├── WorldMap.tsx            # Alternative react-simple-maps component (unused in live game)
│   │   │   ├── IntroSequence.tsx       # Animated case-folder opening cinematic (110 lines)
│   │   │   ├── soundUtils.ts           # Web Audio API synthesized sound effects (52 lines)
│   │   │   │
│   │   │   ├── figma/
│   │   │   │   └── ImageWithFallback.tsx  # <img> wrapper that shows SVG placeholder on load error
│   │   │   │
│   │   │   └── ui/                     # ~60 Radix UI / shadcn component wrappers (Button, Dialog, etc.)
│   │   │       ├── button.tsx          # Accessible button with variant styling
│   │   │       ├── dialog.tsx          # Modal dialog primitive
│   │   │       ├── tabs.tsx            # Tab panels (used for Clues/Map toggle)
│   │   │       ├── badge.tsx           # Small label/pill badge
│   │   │       ├── progress.tsx        # Progress bar primitive
│   │   │       ├── card.tsx            # Card container
│   │   │       ├── tooltip.tsx         # Hover tooltip
│   │   │       └── ... (50+ others)    # Full shadcn/ui component library
│   │   │
│   │   └── services/
│   │       └── pexelsService.ts        # Pexels photo API client (currently disabled; images hardcoded)
│   │
│   └── styles/
│       ├── index.css                   # Master CSS entry; imports fonts, tailwind, theme; defines keyframes
│       ├── fonts.css                   # CSS custom properties for font stacks (--font-ui, --font-telegram, etc.)
│       ├── tailwind.css                # Tailwind @layer directives
│       └── theme.css                  # Tailwind theme: 25+ CSS custom properties, dark mode, OKLch colors
```

---

## 2. Component / Module Map

---

### `ThiefDetectiveGame` — `src/app/components/ThiefDetectiveGame.tsx`

**Responsible for:** Everything. This single component owns the complete game loop: screen routing, level data, timers, scoring, localStorage persistence, and all in-game UI. It is the top-level stateful component.

**Props accepted:** None (it is the root game component).

**State it manages:**

| Variable | Type | Purpose |
|---|---|---|
| `gameState` | `"welcome" \| "howtoplay" \| "difficulty" \| "intro" \| "playing" \| "result"` | Which screen is currently rendered |
| `selectedDifficulty` | `Difficulty` (`"easy" \| "medium" \| "hard"`) | The difficulty the player chose |
| `shuffledLevels` | `Level[]` | 3 randomly-picked levels for the current game session |
| `currentLevel` | `number` | Index (0–2) into `shuffledLevels` |
| `score` | `number` | Running total points accumulated across levels |
| `revealedClues` | `number[]` | Indices of clues the player has unlocked on the current level |
| `selectedCountry` | `string \| null` | Country name the player tapped on the map |
| `answered` | `boolean` | Whether the player has submitted their guess |
| `isCorrect` | `boolean` | Whether the submitted guess was right |
| `earnedPoints` | `number` | Points awarded for the just-completed level |
| `results` | `LevelResult[]` | Accumulated per-level result records |
| `activeTab` | `"clues" \| "map"` | Which tab panel is visible on mobile |
| `showTransition` | `boolean` | Whether the intro cinematic overlay is showing |
| `transitionDiff` | `Difficulty` | Difficulty context passed into `<IntroSequence>` |
| `showCultureCard` | `boolean` | Whether the post-level educational modal is open |
| `showSuspectBriefing` | `boolean` | Whether the pre-level suspect profile modal is open |
| `showCrimeScene` | `boolean` | Whether the crime scene modal is open |
| `timeLeft` | `number` | Seconds remaining on countdown timer |
| `pexelsImages` | `Record<number, string>` | Cache of Pexels image URLs keyed by level ID (unused in production) |
| `imageZoomed` | `boolean` | Whether the evidence photo is expanded |
| `menuHighlight` | `Difficulty` | Which difficulty card is highlighted in the menu |

**Refs managed:**

| Ref | Purpose |
|---|---|
| `scoreRef` | Mirrors `score` state so timer callbacks always read the current value |
| `timerRef` | Holds the `setInterval` ID for the countdown; cleared on answer or unmount |
| `answeredRef` | Mirrors `answered` state; prevents double-triggering inside timer |

**Key functions:**

| Function | What it does |
|---|---|
| `beginGame(difficulty)` | Sets `selectedDifficulty`, filters and shuffles levels, sets `gameState = "intro"` |
| `startGame()` | Sets `gameState = "playing"`, resets `score`, `results`, `currentLevel` to 0 |
| `handleCountryClick(name)` | Sets `selectedCountry`; only runs if `!answered` |
| `handleSubmit()` | Validates guess, calls `calcPoints()`, updates `score`/`results`, opens `CultureCard` |
| `revealNextClue()` | Appends next index to `revealedClues`; plays `"clue"` sound effect |
| `handleTimeUp()` | Triggered when timer hits 0; marks `answered = true`, `isCorrect = false`, 0 pts |
| `nextLevel()` | Closes `CultureCard`, advances `currentLevel`; if `currentLevel === 2`, shows results |
| `calcPoints(cluesUsed)` | Returns 30/20/10/5 points based on how many clues were used |
| `getBestScore(difficulty)` | Reads `phantom_best_${difficulty}` from `localStorage` |
| `saveBestScore(difficulty, score)` | Writes to `localStorage` if new score exceeds saved best |
| `fireConfetti()` | Full-screen canvas confetti burst on correct answer |
| `getDifficulty(levelIndex)` | Maps level index to difficulty string |
| `openCultureCard()` | Sets `showCultureCard = true` after answer |

**Inline sub-components (defined inside the same file):**

| Sub-component | Purpose |
|---|---|
| `TypewriterText` | Renders text one character at a time using `useEffect` + `setInterval` |
| `DifficultyBadge` | Colored pill showing "EASY" / "MEDIUM" / "HARD" |
| `ProgressBar` | Three-segment bar showing level 1/2/3 completion |
| `CountdownTimer` | Circular SVG arc that depletes as `timeLeft` decreases |
| `CultureCard` | Full-screen modal showing flag, geography, history, culture, funFact |
| `SuspectBriefing` | Modal showing suspect alias, height, build, hair, method before each case |
| `NoirBg` | Reusable dark radial-gradient background fragment |

**Hardcoded data constants (declared at module scope):**

| Constant | Shape | Contents |
|---|---|---|
| `LEVELS` | `Level[]` (18 items) | Each level has `id`, `difficulty`, `country`, `mapCountry`, `imageUrl`, `clues[3]`, `thiefClue`, `cultureFact` |
| `SUSPECTS` | `Record<1–18, SuspectProfile>` | Each has `alias`, `height`, `build`, `hair`, `method`, `lastSeen` |
| `DIFFICULTY_CONFIG` | `Record<Difficulty, {...}>` | Timer duration, max clues, color scheme per difficulty |

**Imports / Dependencies:**
- `GeoGuessrMap` — renders the clickable world map inside the "playing" screen
- `IntroSequence` — rendered when `gameState === "intro"`
- `getDisplayName` — imported from `WorldMap.tsx` for readable country labels
- `playSoundEffect` — imported from `soundUtils.ts`
- `ImageWithFallback` — used for the evidence photo
- `canvas-confetti` — called directly for confetti effects
- `motion` (Framer Motion) — wraps animated elements

---

### `GeoGuessrMap` — `src/app/components/GeoGuessrMap.tsx`

**Responsible for:** Rendering the interactive Leaflet world map, coloring clicked countries, showing distance lines between wrong and correct answers, and surfacing hover tooltips with flag emojis.

**Props accepted:**

| Prop | Type | Purpose |
|---|---|---|
| `selectedCountry` | `string \| null` | Country currently highlighted in amber (player's selection) |
| `correctCountry` | `string \| null` | Country highlighted in green after reveal |
| `wrongCountry` | `string \| null` | Country highlighted in red after wrong answer |
| `onCountryClick` | `(name: string) => void` | Callback fired when player clicks a country polygon |
| `disabled` | `boolean` | Prevents clicks after answer is submitted |

**State it manages:**

| Variable | Type | Purpose |
|---|---|---|
| `geoData` | `GeoJSON.FeatureCollection \| null` | World boundary data fetched from CDN on mount |
| `hoveredCountry` | `string \| null` | Country name under mouse cursor (for tooltip) |
| `mousePos` | `{x, y} \| null` | Screen coordinates for floating flag badge |
| `pinPosition` | `[lat, lng] \| null` | Map marker for selected country |
| `correctPinPos` | `[lat, lng] \| null` | Map marker for correct country |
| `wrongPinPos` | `[lat, lng] \| null` | Map marker for wrong guess |

**Key refs:**

| Ref | Purpose |
|---|---|
| `layersRef` | Array of `{name, layer}` for every Leaflet country polygon |
| `centroidsRef` | `Record<name, [lat, lng]>` centroid coordinates for each country |
| `disabledRef` | Stable ref mirroring `disabled` prop — prevents stale closures in Leaflet event handlers |
| `onClickRef` | Stable ref for `onCountryClick` callback |

**Key functions:**

| Function | What it does |
|---|---|
| `countryStyle(name, selected, correct, wrong, hovered, disabled)` | Returns Leaflet `PathOptions`; determines fill color (amber/green/red/gray), opacity, stroke weight |
| Centroid calculation (inside `useEffect`) | For each GeoJSON feature: computes bounding-box center (Polygon) or largest-ring center (MultiPolygon); stores in `centroidsRef` |

**Inline sub-components:**

| Sub-component | Purpose |
|---|---|
| `MapInit` | Calls `map.invalidateSize()` on mount to fix Leaflet sizing in flex layouts |
| `ZoomButtons` | Custom `+` / `−` / reset overlay buttons (avoids default Leaflet controls) |
| `MapFitBounds` | Adjusts map viewport to show both `wrongPinPos` and `correctPinPos` when revealed |
| `DistanceLine` | Draws a dashed yellow `Polyline` between the wrong and correct answer pins |

**External data fetched:**
- GeoJSON: `https://cdn.jsdelivr.net/gh/holtzy/D3-graph-gallery@master/DATA/world.geojson`
- Tile layer: Esri World Street Map (`server.arcgisonline.com`)

**Imports / Dependencies:**
- `react-leaflet`: `MapContainer`, `TileLayer`, `GeoJSON`, `Marker`, `Polyline`, `useMap`
- `leaflet`: `L.divIcon`, `L.PathOptions`
- No parent state is imported — all interaction is via props and `onCountryClick` callback

---

### `IntroSequence` — `src/app/components/IntroSequence.tsx`

**Responsible for:** Playing a 3.2-second animated case-folder cinematic before each game. Auto-completes via `setTimeout`; also has a skip button.

**Props accepted:**

| Prop | Type | Purpose |
|---|---|---|
| `onComplete` | `() => void` | Called when animation finishes or player skips |
| `difficulty` | `Difficulty` | Determines folder label, color, and classification stamp |

**State it manages:** None (pure animation driven by `motion` spring physics).

**Key constant:**
```typescript
DIFF_META: Record<Difficulty, { label, caseRef, tabColor, stamp }>
// label:   "ROOKIE CHASE" | "SENIOR AGENT" | "ELITE OPERATION"
// stamp:   "OPEN"         | "RESTRICTED"   | "CLASSIFIED"
```

**Imports / Dependencies:**
- `motion` (Framer Motion) — `motion.div` for spring-based folder fly-in animation
- Calls `onComplete` after 3200 ms via `setTimeout`

---

### `pexelsService` — `src/app/services/pexelsService.ts`

**Responsible for:** Fetching a photo URL from the Pexels API for a given `caseId`. Currently disabled — the `CASE_QUERIES` map is empty and all images are hardcoded directly in the `LEVELS` array.

**Exported function:**
```typescript
fetchPexelsImage(caseId: number): Promise<string | null>
```

**How it works (when active):**
1. Checks an in-memory `Map<number, string>` cache first.
2. Reads `VITE_PEXELS_API_KEY` from `import.meta.env`.
3. `GET https://api.pexels.com/v1/search?query=${query}&per_page=1&orientation=landscape`
4. Returns `data.photos[0].src.large`.

**Dependencies:** Browser `fetch` API, Vite env variables.

---

### `soundUtils` — `src/app/components/soundUtils.ts`

**Responsible for:** Generating all in-game sound effects using the Web Audio API — no audio files are loaded.

**Exported function:**
```typescript
playSoundEffect(type: "correct" | "wrong" | "clue" | "click" | "complete" | "start"): void
```

**Sound mapping:**

| Type | Sound description | Oscillator type |
|---|---|---|
| `"correct"` | Ascending C–E–G–C major arpeggio | sine |
| `"wrong"` | Descending buzz | sawtooth |
| `"clue"` | A4–C#5 two-tone chime | sine |
| `"click"` | Single A4 click | sine |
| `"complete"` | C–D–E–G–C fanfare | sine |
| `"start"` | F–A–C ascending scale | sine |

**Dependencies:** Browser `AudioContext` (with `webkitAudioContext` fallback). No external libraries.

---

### `WorldMap` — `src/app/components/WorldMap.tsx`

**Responsible for:** An alternative SVG-based world map using `react-simple-maps`. Not used in the live game (superseded by `GeoGuessrMap`), but exports `getDisplayName()` which **is** used by `ThiefDetectiveGame`.

**Key export used by the rest of the app:**
```typescript
getDisplayName(en: string): string
// Maps raw GeoJSON country names to display labels:
// "United States of America" → "USA", "United Kingdom" → "UK", etc.
```

**Props accepted (if rendered):** Same shape as `GeoGuessrMap` — `selectedCountry`, `correctCountry`, `wrongCountry`, `onCountryClick`, `disabled`.

---

### `ImageWithFallback` — `src/app/components/figma/ImageWithFallback.tsx`

**Responsible for:** A drop-in replacement for `<img>` that swaps to an inline SVG broken-image placeholder if the image URL fails to load.

**Props accepted:** All standard `React.ImgHTMLAttributes<HTMLImageElement>` (i.e., `src`, `alt`, `className`, etc.).

---

## 3. Data Flow

### Game State Lives In: `ThiefDetectiveGame`

All game logic and state lives in a single component. There is no global store (no Redux, no Context API, no Zustand). Data flows downward through props and back upward through callback props.

---

### Screen Routing

`gameState` is the single variable that controls which screen is rendered:

```
"welcome"    → Evidence board landing page
"howtoplay"  → Rules modal
"difficulty" → Three case-folder difficulty picker
"intro"      → IntroSequence cinematic
"playing"    → Active gameplay (clues + map + timer)
"result"     → Final scorecard with achievements
```

Transitions are triggered by user actions:
- **Start button** → `gameState = "howtoplay"`
- **Difficulty folder click** → `beginGame(difficulty)` → `gameState = "intro"`
- **IntroSequence `onComplete`** → `startGame()` → `gameState = "playing"`
- **Last level completed** → `nextLevel()` → `gameState = "result"`

---

### Levels Are Selected at Game Start

`beginGame(difficulty)` filters `LEVELS` by difficulty, shuffles them, picks 3, and stores them in `shuffledLevels`. All subsequent level references use `shuffledLevels[currentLevel]`.

---

### User Interaction → State Change (Playing Screen)

```
Player taps country on map
  → GeoGuessrMap fires onCountryClick(name)
  → ThiefDetectiveGame.handleCountryClick(name)
  → selectedCountry = name

Player clicks Submit
  → handleSubmit()
  → isCorrect = (selectedCountry === level.mapCountry)
  → earnedPoints = calcPoints(revealedClues.length) if correct, else 0
  → score += earnedPoints
  → results.push({ levelId, correct, points, cluesUsed, country })
  → playSoundEffect("correct" | "wrong")
  → answered = true
  → timerRef cleared
  → openCultureCard() → showCultureCard = true

Player clicks "Reveal Clue"
  → revealNextClue()
  → revealedClues = [...revealedClues, nextIndex]
  → playSoundEffect("clue")

Timer expires
  → timerRef fires handleTimeUp()
  → answered = true, isCorrect = false, 0 pts
  → openCultureCard()
```

---

### Props Flow to `GeoGuessrMap`

```
ThiefDetectiveGame (state owner)
  │
  ├── selectedCountry ──────────→  GeoGuessrMap (amber highlight)
  ├── correctCountry (null until answered, then level.mapCountry) → GeoGuessrMap (green)
  ├── wrongCountry (null until wrong answer, then selectedCountry) → GeoGuessrMap (red)
  ├── onCountryClick={handleCountryClick} ← callback from child
  └── disabled={answered} ─────→  GeoGuessrMap (locks clicks)
```

`GeoGuessrMap` internally re-styles all country polygons whenever these props change via `useEffect`.

---

### Pexels API (Currently Disabled)

`pexelsService.ts` exports `fetchPexelsImage(caseId)`, and `ThiefDetectiveGame` has a `pexelsImages` state variable and a `useEffect` that would call it. However:
1. `CASE_QUERIES` in `pexelsService.ts` is an empty object `{}`.
2. All 18 levels in `LEVELS` already have hardcoded `imageUrl` strings (direct Pexels URLs).
3. The `pexelsImages` state cache is never populated in production.

The flow **as designed** was:
```
useEffect (on level change)
  → fetchPexelsImage(level.id)
  → setPexelsImages(prev => ({ ...prev, [level.id]: url }))
  → rendered as <ImageWithFallback src={pexelsImages[level.id] ?? level.imageUrl} />
```
In practice, `level.imageUrl` is always used as the fallback.

---

### Scoring and Persistence

```
handleSubmit()
  → earnedPoints = calcPoints(revealedClues.length)
  → score (state) += earnedPoints
  → scoreRef.current = score (kept in sync for timer closure)

gameState = "result"
  → saveBestScore(difficulty, score)
  → localStorage["phantom_best_easy | medium | hard"] = score
  → Achievements unlocked if score >= 60 or specific conditions met
```

Best scores are read back in `gameState = "difficulty"` to display under each folder.

---

## 4. Key Files to Understand

### #1 — `src/app/components/ThiefDetectiveGame.tsx`

This is the entire application. It defines the 18-level `LEVELS` array (with countries, clues, and cultural facts), manages all state variables (`gameState`, `score`, `currentLevel`, `shuffledLevels`, `answered`, `timeLeft`, etc.), and renders every screen conditionally. Understanding how `gameState` transitions work and how `beginGame()` → `startGame()` → `nextLevel()` chain together is the key to understanding the whole app. Start here.

### #2 — `src/app/components/GeoGuessrMap.tsx`

This is the most technically complex component. It bootstraps a Leaflet map, fetches GeoJSON country boundaries from a CDN, computes country centroids, registers hover/click event listeners on each polygon layer, and applies color-coded styles based on `selectedCountry`, `correctCountry`, and `wrongCountry` props. Understanding the `countryStyle()` function and the `layersRef` pattern (storing Leaflet layer references for imperative style updates) is essential to understanding how the map reacts to game state.

### #3 — `src/app/components/IntroSequence.tsx`

A compact but illustrative file showing how the `motion` (Framer Motion) library is used across the project. The `DIFF_META` constant maps difficulty → visual identity (label, color, stamp), and the component auto-fires `onComplete` after 3.2 seconds using `setTimeout`. It's a good reference for the animation patterns used throughout `ThiefDetectiveGame`.

### #4 — `src/app/components/soundUtils.ts`

Shows how all six sound effects are generated purely from the Web Audio API using oscillators and gain nodes — no audio files are involved. The pattern of `oscillator.frequency.value = 523.25` (C5) + `gainNode.gain.exponentialRampToValueAtTime(...)` for fade-out is reused for every sound. This file is small and completely self-contained.

### #5 — `src/app/services/pexelsService.ts`

Explains the gap between what the app was designed to do (dynamically fetch images from Pexels based on case queries) and what it actually does (use hardcoded `imageUrl` strings). Reading this alongside the `pexelsImages` state in `ThiefDetectiveGame` clarifies why there is a `VITE_PEXELS_API_KEY` environment variable referenced but never required for the game to run.
