# Testing Guide

This directory contains test setup and example tests for the Tråkke application.

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm test -- --run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Writing Tests

### Component Tests

Place test files next to the components they test with `.test.tsx` extension:

```
src/components/
  MyComponent.tsx
  MyComponent.test.tsx
```

### Example Component Test

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

## Test Structure

- `setup.ts` - Test environment setup, mocks, and global configuration
- `*.test.ts` - Unit tests for utilities and helpers
- `*.test.tsx` - Component tests

## Coverage Reports

After running `npm run test:coverage`, open `coverage/index.html` in your browser to view detailed coverage reports.

## CI/CD Integration

Tests run automatically:
- On every commit (via pre-commit hook)
- On every pull request (via GitHub Actions)
- Before deployment to production
