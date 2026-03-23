# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Setup

### Environment Configuration

Before running the project, set up your environment variables:

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your backend API URL:
```env
VITE_API_URL=http://localhost:3001
```

See [ENVIRONMENT-SETUP.md](ENVIRONMENT-SETUP.md) for detailed environment configuration.

## Features

- React 19 with TypeScript
- Vite for fast development
- daisyUI for styling
- Axios for HTTP requests
- Custom hooks for data fetching
- Error handling components
- Backend API integration

## Project Structure

```
src/
├── components/        # React components
├── hooks/             # Custom React hooks
├── services/          # API service layer
├── lib/api/           # API client and configuration
├── types/             # TypeScript type definitions
├── pages/             # Page components
└── assets/            # Static assets
```

## Available Scripts

### Development

```bash
npm run dev
```

Runs the app in development mode.

### Build

```bash
npm run build
```

Builds the app for production.

### Testing

The project includes test pages for different modules:

- **Services**: `http://localhost:5173/?test=true`
- **Hooks**: `http://localhost:5173/?hooks=true`
- **Error Handling**: `http://localhost:5173/?errors=true`

## Backend Integration

The frontend is configured to connect to a NestJS backend at `http://localhost:3001`.

See `docs/STEP-7-COMPLETE.md` for error handling details.

## Features

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
