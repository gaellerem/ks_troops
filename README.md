# Troop Organizer for Kingshot

A companion web application for the game Kingshot. Manage your troop inventory and plan troop distributions across marches.

## Features

- Add troops by type and tier (T1 to T10).
- Create and rename multiple inventories.
- View available quantities grouped by troop type and tier.
- Set up a formation with one to twenty marches.
- Allocate troops by percentage or by unit count, with a breakdown of the tiers used.
- Choose the troop-type priority used when allocating units.
- Fill a march with the remaining troops or adjust it to the available troops.
- Save, reopen, and delete formations.
- Review the troops remaining after allocation.

## Technologies

- React
- Vite
- JavaScript and CSS

## Prerequisites

- Node.js and npm

## Installation and development

From the project root, install the dependencies and start the development server:

```bash
npm install
npm run dev
```

Vite will print the local URL to open in your browser.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the development server with hot reloading. |
| `npm run build` | Builds the production app into the `dist` directory. |
| `npm run preview` | Serves the production build locally after `npm run build`. |
| `npm run lint` | Lints the code with Oxlint. |

## Data storage

Inventories and formations are stored in the browser's `localStorage`. They remain available in the same browser, but are not synchronized across devices or sent to a server.

## Project structure

```text
src/
├── components/       # Inventory and distribution components
├── assets/           # Images and static assets
├── App.jsx           # Main application state and logic
├── App.css           # Application styles
├── index.css         # Global styles
└── main.jsx          # React entry point
```
