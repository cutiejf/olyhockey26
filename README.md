# 🏒 Olympic Hockey 2026 Flipbook

A beautiful, interactive 3D CSS flipbook guide for the Milano Cortina 2026 Men's Ice Hockey Tournament.

![Cover](cover.png)

## Features

- **3D Page Flip Animation** — Smooth CSS-only page turning with realistic depth
- **Live Score Tracking** — Group standings, preliminary rounds, and knockout brackets
- **Player Stats** — Top scorers and goalies updated through Olympics
- **Tournament History** — 100+ years of Olympic hockey medal counts
- **Responsive Design** — Desktop spreadsheet view, mobile horizontal swipe
- **PWA Ready** — Works offline with service worker caching

## Files

### Core App
- `index.html` — Main flipbook markup with embedded tournament data
- `script.js` — Dynamic content rendering (buzz, standings, stats)
- `flipbook.css` — 3D page flip engine
- `style.css` — Panel layout and animations
- `mobile.css` — Portrait/landscape responsive styles

### Data
- `data.json` — Single source of truth: scores, stats, team info, game schedule

### Config
- `manifest.json` — PWA manifest
- `sw.js` — Service worker for offline caching

### Assets
- `cover.png` — Front cover image
- `back.png` — Back cover
- `ono.png` — Official Olympic emblem
- `PageFlip3.wav` — Page turn sound effect

## How to Use

### Local Development
Keep all in one file folder and open index.html 
```

### Update Scores
Edit `data.json` directly:
- `storedScores` — game results `"k9-h"` (home), `"k9-a"` (away)
- `storedESPNStats` — player stats (scorers and goalies)
- `knockouts` — bracket teams and dates

Common game IDs:
- `p1-p18` — Preliminary rounds
- `k1-k8` — Qualification & Quarterfinals
- `k9-k10` — Semifinals
- `k11` — Bronze medal game
- `k12` — Gold medal game

### Deploy to GitHub Pages
```bash
git add .
git commit -m "Update scores"
git push origin main
```

Live at: https://github.com/cutiejf/olyhockey26

## Customization

### Change Tournament
Edit `index.html`:
- `storedESPNStats` — update player stats
- `prelims` and `knockouts` — update game schedule
- `historyData` — update medal history

### Adjust Book Size
Edit `flipbook.css`:
- `--panel-width: 5in; --panel-height: 6in;`

### Modify Colors
Edit `flipbook.css`:
- `--accent-red`, `--accent-blue`, `--accent-green`, `--header-bg`

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (CSS 3D Transforms), 
- **Mobile**: iOS Safari 12+, Android Chrome - Verticle Portrait Mode
        is single page paneled, Landscape is classic two page view.
- **Offline**: PWA support via service worker

## Data Format

```json
{
  "storedScores": {
    "k9-h": "3",
    "k9-a": "2"
  },
  "storedESPNStats": {
    "scorers": [
      {
        "rank": "1.",
        "name": "Connor McDavid",
        "team": "CAN",
        "gp": "4",
        "goals": "2",
        "assists": "9",
        "points": "11"
      }
    ]
  }
}
```

---

Last Updated: February 20, 2026  
Tournament: Milano Cortina 2026 Winter Olympics
