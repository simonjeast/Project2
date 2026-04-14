# BOW Tracker

BOW Tracker is a small front-end gym routine planner built around the idea in `PROPOSAL.md`: show the workouts for today, keep a weekly split visible when needed, and let you check off sets as you go.

The app is intentionally lightweight. It runs as a static site, stores your routine in `localStorage`, and gives you just enough structure to stay consistent without turning into a full fitness platform.

## Features

- Daily view focused on the current day's routine
- Weekly view grouped by weekday for a full split overview
- Per-workout completion tracking that resets naturally with the current week
- Pre-made starter routines you can import into the planner
- Add, edit, delete, and reorder workouts
- Shuffle today's workouts when you want variety
- Progress cards and momentum bar for quick status checks
- Persistent storage in the browser so your routine survives refreshes

## Tech

- HTML for structure
- CSS for layout, styling, and responsive behavior
- Vanilla JavaScript for rendering, state management, drag-and-drop, and `localStorage`

## Running It

No build step is required.

1. Clone or download the project.
2. Open `index.html` directly in a browser.

If you prefer serving it locally instead of opening the file directly, any static server will work. For example:

```powershell
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## How It Works

- Workouts are assigned to a weekday and shown either in `Today` or `This Week`.
- The preset library lets you load a ready-made split and then adjust it to fit your routine.
- Checking a workout off marks it complete for that scheduled day in the current week.
- The next week starts clean automatically, so recurring routines keep making sense.
- Drag-and-drop reordering works within the same day, which keeps your weekly split organized.

## Project Files

- `index.html` contains the app structure and UI template
- `styles.css` defines the visual system and responsive layout
- `script.js` handles state, rendering, persistence, editing, and drag-and-drop
- `PROPOSAL.md` captures the original project direction

## Possible Next Steps

- Add exercise categories or muscle groups
- Track reps, weight, or notes per workout
- Add export/import for routines
- Add separate templates for push, pull, legs, or custom programs
