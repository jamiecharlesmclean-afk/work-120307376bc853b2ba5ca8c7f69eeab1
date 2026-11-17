# HoopStats

A basketball coaching companion for a single team. HoopStats brings the next game, practice schedule, player scoring leaders, individual stats, and team averages into one phone-friendly app.

## Preview

In an omg.dev Cloud Computer, ask the agent to start the Expo preview. It exposes Metro through the sandbox proxy and gives you an `exps://` link. Open that link with Expo Go. The same Metro server serves the web preview.

The preview link is temporary.

## Structure

- `src/app/index.tsx`: team dashboard
- `src/app/player.tsx`: player stat detail
- `src/app/players.tsx`: roster and add-player flow
- `src/app/stats.tsx`: team record and season averages
- `src/app/playbook.tsx`: team offensive and situational plays
- `src/app/drills.tsx`: practice drills with setup and coaching cues
- `src/app/game.tsx`: live scoreboard and player-attributed game box score
- `src/app/whiteboard.tsx`: interactive half-court play diagram editor
- `src/app/planner.tsx`: weekly practice planner with selectable drills
- `src/components/hoopstats-ui.tsx`: shared brand header, screen shell, and navigation
- `src/components/training-library.tsx`: expandable play and drill cards
- PDF import: select text PDFs, review extracted draft entries, then save selected items to the on-device playbook or drill book
- PDF imports are processed on-device with `pdfjs-dist`; image-only scanned PDFs require OCR and are reported clearly
- `src/lib/game.ts` and `src/lib/whiteboard.ts`: on-device saved coaching data
- `src/lib/planner.ts`: on-device weekly practice plan storage
- `schema.ts`: hosted collections; empty until the app has sign-in
- `app.json`: Expo configuration
- `eas.json`: development, preview, and production build profiles

Apple Sign In is not enabled by default. It needs an Apple Developer account, an app bundle ID, and a development build.
