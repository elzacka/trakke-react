# Contributing to Tråkke

Thank you for your interest in contributing to Tråkke! This guide will help you get started with development, whether you're working remotely via GitHub Codespaces or locally on your machine.

## Table of Contents

- [Development Environment Setup](#development-environment-setup)
- [Remote Development Workflow](#remote-development-workflow)
- [Local Development Workflow](#local-development-workflow)
- [Code Quality Standards](#code-quality-standards)
- [Testing Requirements](#testing-requirements)
- [Security Best Practices](#security-best-practices)
- [Preview Deployments](#preview-deployments)
- [Pull Request Process](#pull-request-process)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Architecture Guidelines](#architecture-guidelines)

## Development Environment Setup

### Option 1: GitHub Codespaces (Recommended for Remote Work)

GitHub Codespaces provides a complete development environment in the cloud, allowing you to develop entirely from your browser without any local setup.

**Getting Started:**

1. Navigate to the repository on GitHub
2. Click the **Code** button
3. Select the **Codespaces** tab
4. Click **Create codespace on main** (or your feature branch)
5. Wait for the environment to build (automatic `npm install`)
6. Once ready, run `npm run dev` in the terminal
7. Access the development server via the forwarded port

**Benefits:**
- Zero local setup required
- Consistent development environment
- Develop from any device (even iPad)
- Automatic VS Code extensions installed
- Pre-configured linting and formatting

### Option 2: Local Development

**Prerequisites:**
- Node.js 20.x or later
- npm 9.x or later
- Git

**Setup:**

```bash
# Clone the repository
git clone https://github.com/elzacka/trakke-react.git
cd trakke-react

# Install dependencies
npm install

# Start development server
npm run dev
```

The development server will be available at `http://127.0.0.1:3000`

## Remote Development Workflow

This workflow allows you to develop, test, and deploy features entirely through GitHub without needing to work locally on your MacBook.

### 1. Create a Feature Branch

```bash
# From main branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description

# For Claude Code sessions
git checkout -b claude/feature-name
```

### 2. Make Changes

- Edit code in Codespaces or locally
- Automatic quality checks run on commit (via Husky)
- ESLint auto-fixes formatting issues
- Prettier formats code automatically

**Pre-commit hooks automatically run:**
- `lint-staged` - Runs ESLint and Prettier on changed files
- Prevents commits with linting errors

### 3. Commit Your Changes

Use conventional commit messages:

```bash
git add .
git commit -m "feat: add new POI category for mountain peaks"
```

**Commit message format:**
```
<type>: <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes
- `build`: Build system changes
- `security`: Security fixes

### 4. Push to GitHub

```bash
git push -u origin feature/your-feature-name
```

**Automatic actions triggered:**
- Quality checks run in CI
- Preview deployment builds
- Test suite executes

### 5. Test Your Feature

**Preview Deployment:**
- Automatically deployed to: `https://elzacka.github.io/trakke-react/previews/[branch-name]/`
- QR code generated for easy mobile testing
- Preview URL posted in PR comments

**Mobile Testing (iPhone):**
1. Wait for preview deployment to complete
2. Scan QR code from PR comment with iPhone camera
3. Test touch gestures, responsiveness
4. Verify GPS/location features

**Desktop Testing:**
1. Open preview URL in Chrome, Firefox, Safari
2. Test keyboard shortcuts
3. Test responsive breakpoints with DevTools

### 6. Create Pull Request

```bash
# Using GitHub CLI (if available)
gh pr create --title "Your PR title" --body "Description"

# Or use GitHub web interface
```

**PR Checklist (from template):**
- [ ] All tests pass
- [ ] Linting passes
- [ ] Type checking passes
- [ ] Tested on desktop
- [ ] Tested on mobile via preview
- [ ] Screenshots added (for UI changes)
- [ ] Norwegian terminology verified

### 7. Review and Merge

- Automated quality checks must pass
- Preview deployment available for testing
- Address review feedback
- Merge when approved

## Code Quality Standards

### ESLint

- **Zero errors** tolerance
- Maximum **150 warnings**
- Auto-fix enabled in pre-commit hook

**Run manually:**
```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
```

### TypeScript

- Strict mode enabled
- No `any` types allowed (`@typescript-eslint/no-explicit-any: error`)
- No unhandled promises (`@typescript-eslint/no-floating-promises: error`)

**Run manually:**
```bash
npm run typecheck
```

### Prettier

- Single quotes
- No semicolons
- 100 character line width
- Auto-formatting on save (if using VS Code)

**Run manually:**
```bash
npm run format        # Format all files
npm run format:check  # Check formatting
```

### Git Hooks (Husky)

**Pre-commit:**
- Runs `lint-staged` on changed files
- Runs ESLint with auto-fix
- Runs Prettier formatting
- Prevents commit if errors exist

**Commit-msg:**
- Validates commit message format
- Enforces conventional commits

## Testing Requirements

### Test Framework

- **Vitest** for unit and integration tests
- **React Testing Library** for component tests
- **jsdom** for DOM simulation

### Running Tests

```bash
# Watch mode (development)
npm test

# Run once (CI)
npm test -- --run

# With UI
npm run test:ui

# With coverage
npm run test:coverage
```

### Writing Tests

Place test files next to the components they test:

```
src/components/
  MyComponent.tsx
  MyComponent.test.tsx
```

**Example test:**

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### Coverage Requirements

- Aim for >80% coverage on new code
- Coverage reports available at `coverage/index.html`
- Critical paths must be tested

## Security Best Practices

**See [SECURITY.md](SECURITY.md) for comprehensive security guidelines.**

### Credential Protection

**Never commit secrets!** The project has multiple safeguards to prevent accidental commits:

1. **Automatic secret scanning** - Pre-commit hooks scan for API keys, tokens, passwords
2. **Enhanced .gitignore** - Excludes all common secret file patterns
3. **GitHub Actions scanning** - Weekly security audits
4. **File verification** - Checks for accidentally committed secrets

### Using Environment Variables

**Always use environment variables for sensitive data:**

```bash
# 1. Copy the template
cp .env.example .env.local

# 2. Add your secrets (never commit this file!)
echo "VITE_API_KEY=your_key_here" >> .env.local

# 3. Use in code
const apiKey = import.meta.env.VITE_API_KEY
```

### Security Checks

**Run before committing:**

```bash
# Check for potential secrets
npm run secrets:check

# Full security audit
./scripts/cleanup-temp-files.sh  # Check for temporary files
npm audit                         # Check dependencies
```

### Temporary File Management

Development creates personal/debug files that shouldn't be committed:

- Personal notes (`CLAUDE.md`, `TODO.md`, `*.local.md`)
- Screenshots (`*.png`, `*.jpg` outside of `public/`)
- Debug logs (`*.log`, `*.dump`, `*.trace`)
- Temporary directories (`notes/`, `debug/`, `scratch/`)

**These are automatically ignored by .gitignore**, but you can manage them:

```bash
# Scan and manage temporary files
./scripts/cleanup-temp-files.sh
```

**Options:**
1. Delete all temporary files
2. Archive to `.tar.gz`, then delete
3. List only (no action)

### Security Checklist

Before every commit:

- [ ] No hardcoded API keys or secrets
- [ ] All secrets in `.env.local` (not committed)
- [ ] No temporary/personal files included
- [ ] No debug or log files
- [ ] Secret scanning passed (automatic in pre-commit hook)
- [ ] No vulnerable dependencies

### What's Protected

The `.gitignore` automatically excludes:

```
# Secrets
.env, *.pem, *.key, *credential*, *secret*, *.token

# Personal files
CLAUDE.md, TODO.md, notes/, debug/, scratch/

# Screenshots (except in public/assets)
*.png, *.jpg, *.gif, *.mp4

# Debug files
*.log, *.dump, *.trace, *.har
```

### If You Accidentally Commit a Secret

1. **Immediately rotate the secret** (generate new key)
2. **Remove from git history** (see SECURITY.md for instructions)
3. **Never commit the new secret**

## Preview Deployments

### How It Works

1. Push to feature branch → triggers preview deployment
2. Build runs with quality checks
3. Deploys to `previews/[branch-name]/`
4. Preview URL posted in PR comments with QR code

### Preview URLs

**Format:**
```
https://elzacka.github.io/trakke-react/previews/[branch-name]/
```

**Branches that trigger previews:**
- `claude/**`
- `feature/**`
- `fix/**`
- Any pull request

### Mobile Testing with QR Codes

1. Open PR on GitHub
2. Find the preview deployment comment
3. Scan QR code with iPhone camera
4. Test the feature on your device

## Pull Request Process

### Creating a PR

1. Ensure your branch is up to date with main
2. All quality checks pass locally
3. Push your branch to GitHub
4. Create PR using the template
5. Fill out all sections of the PR template

### PR Template Sections

- **Description**: What does this PR do?
- **Type of Change**: Feature, fix, refactor, etc.
- **Testing**: How you tested the changes
- **Quality Checklist**: All automated checks
- **Preview Testing**: Link to preview deployment
- **Screenshots**: For UI changes

### Automated PR Checks

**Quality checks run automatically:**
- ESLint validation
- TypeScript compilation
- Test suite execution
- Build verification

**Results posted to PR:**
- ✅/❌ status for each check
- Preview deployment URL
- QR code for mobile testing

### Review Process

1. Automated checks must pass
2. Self-review your changes
3. Request review if needed
4. Address feedback
5. Merge when approved

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Examples

**Feature:**
```
feat(poi): add mountain peak category with elevation data
```

**Bug fix:**
```
fix(map): correct coordinate copy on mobile long-press
```

**Documentation:**
```
docs(readme): update development workflow instructions
```

**Refactoring:**
```
refactor(state): migrate from Context to Zustand for POI state
```

### Emoji Prefixes (Optional)

- ✨ `:sparkles:` - New feature (feat)
- 🐛 `:bug:` - Bug fix (fix)
- 📝 `:memo:` - Documentation (docs)
- 🎨 `:art:` - Code style (style)
- ♻️ `:recycle:` - Refactoring (refactor)
- ⚡️ `:zap:` - Performance (perf)
- ✅ `:white_check_mark:` - Tests (test)
- 🔧 `:wrench:` - Configuration (chore)
- 🔒 `:lock:` - Security (security)

## Architecture Guidelines

### State Management

- **Zustand** for global state (currently POI data)
- **React Context** for UI state (sidebar, modals)
- Local state with `useState` for component-specific state

### Component Structure

```
src/
├── components/       # React components
├── services/         # API services (Overpass, Geonorge, etc.)
├── stores/           # Zustand stores
├── data/             # Static data and types
├── test/             # Test utilities and setup
└── MapLibreTrakkeApp.tsx  # Main app component
```

### TypeScript Guidelines

- Use interfaces for object shapes
- Use types for unions and utility types
- Avoid `any` - use `unknown` if type is truly unknown
- Export types from component files

### React Best Practices

- Functional components only
- Custom hooks for reusable logic
- Memoization for expensive calculations
- Proper dependency arrays in `useEffect`

### POI Rendering

**IMPORTANT:** This app uses custom DOM-based POI rendering, NOT GeoJSON layers.

- POIs rendered as positioned DOM elements
- Custom overlays managed in `MapLibreMap.tsx`
- NO GeoJSON sources (enforced by ESLint rules)

### Adding New POI Categories

1. **Service Layer** (`src/services/overpassService.ts`):
   ```typescript
   export const fetchMountainPeaks = async (bounds: LngLatBounds) => {
     // Fetch POI data
   }
   ```

2. **Transform Data** (`src/MapLibreTrakkeApp.tsx`):
   ```typescript
   const transformedPeaks = rawData.map(peak => ({
     id: peak.id,
     type: 'mountain_peak',
     name: peak.tags.name,
     // ...
   }))
   ```

3. **Add to Category Filter** (`src/components/HierarchicalCategoryFilter.tsx`)

4. **Update POI Types** (`src/data/pois.ts`)

5. **Add Attribution** (in "Om kartet" modal)

### Language Requirements

- All user-facing text must be in **Norwegian (Bokmål)**
- Code comments and docs can be in English
- Variable names should be descriptive in English

## Claude Code Integration

### Available Commands

If you're using Claude Code, these custom commands are available:

- `/check` - Run all quality checks (lint, typecheck, test, build)
- `/test` - Run test suite with optional coverage
- `/fix` - Auto-fix linting and formatting issues
- `/review` - Comprehensive code review of recent changes
- `/deploy-preview` - Deploy current branch for preview

### Using Claude Code for Development

1. Open project in Claude Code
2. Make changes via natural language requests
3. Use `/check` before committing
4. Use `/fix` to auto-fix any issues
5. Review changes before pushing

## Questions or Issues?

- Open an issue on GitHub for bugs or feature requests
- Check existing issues before creating new ones
- Use discussions for questions and ideas

---

**Happy coding! 🇳🇴 🥾**
