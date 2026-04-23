# LinkedIn Signal Filter (Chrome Extension)

A Chrome extension that runs inside LinkedIn and scores feed posts for signal quality.

It is tuned to prioritize:
- real product demos
- technical explanations
- implementation-heavy articles

And reduce visibility for:
- fake "journey" storytelling
- engagement bait
- low-information motivational fluff

## What It Does

- Analyzes each LinkedIn post in-feed with a rule-based classifier.
- Labels posts as `high-signal`, `mixed`, or `low-signal`.
- Lets you choose one of three behaviors:
  - hide low-signal
  - dim low-signal
  - mark-only
- Optional controls:
  - strictness slider
  - highlight high-signal posts
  - treat mixed posts as low-signal
  - show/hide reason badges

## Install Locally

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder.
5. Open LinkedIn feed and use the extension popup to tune filtering.

## Project Structure

- `manifest.json`: Chrome MV3 manifest
- `src/settings.js`: shared settings storage helpers
- `src/classifier.js`: heuristic post classifier
- `src/contentScript.js`: LinkedIn feed scanner + filtering logic
- `popup.html`, `popup.js`: quick controls
- `options.html`, `options.js`: advanced controls
- `styles/content.css`: LinkedIn in-feed badges/highlight styles

## Notes

- This is heuristics-based, not a perfect detector.
- You can evolve `src/classifier.js` patterns as you collect false positives/negatives.
- LinkedIn DOM selectors can change over time; if filtering stops, update selectors in `src/contentScript.js`.
