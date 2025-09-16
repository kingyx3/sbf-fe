# SBFHERO - Singapore HDB Sale of Balance Flats Platform

SBFHERO is a React.js web application providing real-time market data, analytics, and insights for Singapore's HDB Sale of Balance Flats market. The application uses Firebase for authentication and hosting, with comprehensive charting and data visualization capabilities.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Essential Setup and Build Commands
- Navigate to app directory: `cd /home/runner/work/sbf-fe/sbf-fe/app` - ALL commands must be run from this directory
- Install dependencies: `npm install` - takes 3-4 minutes. NEVER CANCEL. Set timeout to 300+ seconds.
- Build production: `npm run build` - takes 45-60 seconds. NEVER CANCEL. Set timeout to 180+ seconds.
- Lint code: `npm run lint` - takes 2-3 seconds
- Fix linting: `npm run lint:fix` - takes 2-3 seconds  
- Run tests: `npm test -- --watchAll=false --passWithNoTests` - takes <1 second (no tests exist, but passes with --passWithNoTests)
- Start development server: `npm start` - starts server on http://localhost:3000, takes 30-45 seconds to compile. NEVER CANCEL.

### Development Workflow
- ALWAYS run `npm install` first when working with a fresh clone
- ALWAYS run `npm run lint` before committing changes or CI will fail
- ALWAYS test build with `npm run build` before pushing changes
- Build artifacts are output to `build/` directory (~14MB)
- Development server automatically reloads on file changes

## Validation Scenarios

### Manual Testing Requirements
- ALWAYS test the complete authentication flow after making auth-related changes:
  1. Navigate to http://localhost:3000
  2. Click "Continue with Google" button - should show "Connecting..." state
  3. Click "🚀 Continue with Email" button - should show "Sending Magic Link..." state
  4. Verify UI responsiveness and interactive elements work correctly
- ALWAYS test dark/light mode toggle functionality via the theme button in navigation
- ALWAYS verify Firebase connectivity in development environment (uses sbfhero-dev project)
- ALWAYS take a screenshot after UI changes to verify visual correctness

### Critical File Dependencies
- `src/config/testData.js` - Required for build to succeed (even if empty)
- `src/config/envConfig.js` - Environment configuration for dev/prod Firebase projects
- `src/config/firebaseConfig.js` - Firebase authentication and database setup
- Missing any of these files will cause build failures

## Project Structure

### Key Directories
- `src/components/` - Reusable React components including dashboard charts and UI elements
- `src/components/dashboard/` - Data visualization components (charts, tables, maps) for SBF analytics
- `src/screens/` - Main application screens (Login, Home, Admin, Payment flows)
- `src/screens/HomeScreen/purchase/` - Purchase flow components and pricing displays
- `src/hooks/` - Custom React hooks for authentication, data fetching, and UI state
- `src/utils/` - Utility functions for admin operations, logging, and IndexedDB
- `src/config/` - Configuration files for environment, Firebase, and static data
- `public/` - Static assets including favicons, PWA manifest, and demo files

### Important Files for Common Changes
- Authentication logic: `src/hooks/useAuth.js`, `src/components/ProtectedRoute.js`
- Admin functionality: `src/utils/adminUtils.js`, `src/hooks/useAdminAuth.js`
- Data fetching: `src/hooks/useFetchCSV.js`, `src/hooks/useGetDemand.js`
- Main application: `src/App.js`, `src/screens/HomeScreen/index.js`
- Dashboard analytics: `src/components/dashboard/index.js`

## Firebase Integration

### Environment Configuration
- Development: Uses `sbfhero-dev` Firebase project
- Production: Uses `sbfhero-92c25` Firebase project
- Environment switching based on `REACT_APP_NODE_ENV` environment variable
- Firebase services: Authentication, Realtime Database, Hosting

### Deployment
- Automatic deployment via GitHub Actions on push to any branch
- Development builds deploy to Firebase dev environment
- Production builds deploy to Firebase production environment (main branch only)
- Build process includes environment-specific Firebase configuration

## Common Issues and Solutions

### Build Failures
- Missing `testData.js`: Create empty export `export default [];` in `src/config/testData.js`
- Firebase configuration errors: Check `src/config/envConfig.js` for correct project IDs
- Linting failures: Run `npm run lint:fix` to auto-fix most issues

### Development Server Issues
- Server won't start: Ensure port 3000 is available, check for conflicting processes
- Compilation errors: Check console for missing imports or syntax errors
- Network errors in browser: Expected for external API calls (IP lookup, Firebase in sandboxed environment)

## Timing Expectations and Timeouts

### Command Timeouts (NEVER CANCEL before these times)
- `npm install`: 5 minutes minimum (typically 3-4 minutes)
- `npm run build`: 3 minutes minimum (typically 45-60 seconds)
- `npm start`: 2 minutes for initial compilation
- `npm run lint`: 30 seconds
- `npm test`: 30 seconds

### CI/CD Considerations
- GitHub Actions workflow builds and deploys automatically
- Lint errors will fail CI builds
- Build process includes dependency caching for faster subsequent builds
- Firebase deployment requires valid service account tokens (configured via GitHub secrets)

## Technology Stack
- **Frontend**: React 19.x with Create React App
- **UI Libraries**: Material-UI, Ant Design, Tailwind CSS
- **Charts/Analytics**: Chart.js, Recharts, Ant Design Charts
- **Authentication**: Firebase Auth with Google OAuth
- **Database**: Firebase Realtime Database
- **Maps**: Leaflet with React-Leaflet
- **Data Management**: TanStack Query (React Query), IndexedDB
- **Build**: React Scripts (Webpack-based)
- **Deployment**: Firebase Hosting via GitHub Actions