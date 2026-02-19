# Cricket Scorer Frontend

A modern React application for cricket scoring with Tailwind CSS styling.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **TanStack React Query** - Server state management
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first CSS framework

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Features

- Dashboard with match overview
- Create new matches
- Access code validation for secure match access
- Live scoring interface
- Ball-by-ball recording
- Undo functionality
- Responsive design

## Project Structure

```
src/
├── api/          # API configuration and axios setup
├── pages/        # Page components
├── App.tsx       # Main app component with routing
├── main.tsx      # Application entry point
└── index.css     # Global styles with Tailwind directives
```

## Environment Variables

Create a `.env` file in the root directory:

```
VITE_API_URL=http://localhost:5000/api
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
