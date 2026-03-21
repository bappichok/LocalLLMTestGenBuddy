# JobFilterAI: Local-First Job Tracker

JobFilterAI is a modern, fast, and fully local Kanban-style job tracking application. No backend or database server is required—all data is persisted locally in your browser using IndexedDB. 

With drag-and-drop functionality, dark mode support, and data portability (import/export), JobFilterAI is the perfect tool to keep your job search organized.

## Features

- **Kanban Board Interface**: Visualize your job search through various stages (Wishlist, Applied, Follow-up, Interview, Offer, Rejected).
- **Drag and Drop**: Seamlessly drag job cards between columns to update their status instantly (Powered by `@dnd-kit`).
- **Local Persistence**: All your job applications are saved automatically in your browser utilizing IndexedDB (`idb` library). No signup or server required.
- **Import / Export**: Own your data! Export your complete job list to a JSON file and import it anytime.
- **Search & Filter**: Quickly find specific jobs by company name or role.
- **Dark Mode**: Built-in support for light and dark themes with persistence.

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **State & Storage**: IndexedDB (via `idb`)
- **Drag & Drop**: `@dnd-kit`
- **Testing**: Vitest + React Testing Library

## Getting Started

### Prerequisites

You need [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd JobFilterAI
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit `http://localhost:5173/` to see the app!

## Running Tests

This project uses Vitest for testing components and database utilities.
To run the test suite:

```bash
npm run test
```

## Data Privacy & Security

Your data is 100% private. JobFilterAI operates entirely on the client side. No job application data is ever transmitted to an external server. By using the Export feature, you can maintain local backups on your personal machine.
