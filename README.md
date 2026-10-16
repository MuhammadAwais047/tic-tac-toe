# ❌ Tic·Tac·Toe — vs Unbeatable AI

Classic tic tac toe with three AI difficulty levels, pass-and-play multiplayer, animated stroke-drawn marks and persistent score tracking. Pure HTML, CSS and vanilla JavaScript — no frameworks, no build step.

**Live demo:** https://muhammadawais047.github.io/tic-tac-toe/

## Features

- **Three AI difficulties:**
  - **Easy** — picks a random empty cell
  - **Tricky** — wins when it can, blocks when it must, then prefers center and corners
  - **Minimax 😈** — full minimax search (depth-biased) with perfect play. *You cannot win. Ever. Draw if you're flawless.*
- **2-player mode** — pass-and-play on the same device
- **Animated marks** — X and O draw themselves with SVG stroke animations; winning cells pulse
- **Ghost preview** — hover an empty cell to preview your mark
- **Persistent scoreboard** — wins/draws saved to `localStorage` (survives refresh)
- **Loser starts next round** — fair alternating first-move
- **Keyboard shortcut** — `N` for a new round
- **Accessible** — `role="grid"`/`gridcell`, `aria-live` status, descriptive cell labels, focus-visible styles
- **`prefers-reduced-motion` support** and responsive down to small phones

## Tech

| Layer  | Choice                                            |
| ------ | ------------------------------------------------- |
| Markup | Semantic HTML5                                    |
| Style  | Modern CSS (grid, custom properties, SVG stroke animations) |
| Logic  | Vanilla ES2020 — minimax with depth-biased scoring |

## Run locally

```bash
python -m http.server 8080
# then open http://localhost:8080
```

Or simply open `index.html` in a browser.

## Project structure

```
tic-tac-toe/
├── index.html   # page shell & controls
├── styles.css   # theme, board, mark animations
└── app.js       # game state, AI (random / heuristic / minimax), scores
```

---

© 2026 [Muhammad Awais](https://github.com/MuhammadAwais047). Licensed under the [MIT License](LICENSE).
