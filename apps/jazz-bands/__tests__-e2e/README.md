# End-to-End Tests

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode
npm run test:e2e:ui

# Run specific test file
npx playwright test __tests__-e2e/two-column-layout.spec.ts

# Run with specific viewport
npx playwright test --project=chromium
npx playwright test --project=chromium-mobile

# Generate screenshots baseline
npx playwright test --update-snapshots
```

## Test Coverage

### Two-Column Layout Tests (`two-column-layout.spec.ts`)

#### Desktop Layout (1920x1080)
- ✅ Two-column grid renders
- ✅ Sidebar visible on right side
- ✅ Sidebar width is 350px
- ✅ Player visible in sidebar (top)
- ✅ Slideshow preview visible below player
- ✅ Main content in left column
- ✅ Header and Footer visible
- ✅ Desktop layout screenshot

#### Mobile Layout (375x667)
- ✅ Single column layout renders
- ✅ Sidebar NOT visible
- ✅ Player fixed at bottom
- ✅ Full-width content area
- ✅ Header and Footer visible
- ✅ Mobile layout screenshot

#### Player Functionality (both viewports)
- ✅ Play/pause toggle works
- ✅ Progress bar seek works
- ✅ Volume controls visible
- ✅ Track information displayed

#### Slideshow Tests (desktop only)
- ✅ 3 images visible in preview container
- ✅ Horizontal scroll snap works
- ✅ Click opens modal
- ✅ Modal displays full-size image
- ✅ Modal prev/next navigation works
- ✅ Modal close button works
- ✅ Keyboard navigation (Escape, Arrow keys)
- ✅ Slideshow modal screenshot

#### Responsive Breakpoint Test
- ✅ Resize from 1023px to 1025px triggers layout change
- ✅ No content lost during transition

## Prerequisites

1. Start the dev servers:
   ```bash
   npm run dev:docker
   ```

2. Install Playwright browsers (if not already installed):
   ```bash
   npx playwright install chromium
   ```

## Test Architecture

- **Base URL**: Dynamic based on band (boheme runs on port 3001)
- **Viewports**: Desktop (1920x1080), Mobile (375x667 via iPhone 12 preset)
- **Selectors**: Uses semantic HTML and aria-labels for accessibility
- **Screenshots**: Visual regression testing with baseline images in `__tests__-e2e/screenshots/`

## Adding New Tests

Follow the existing structure:

```typescript
test.describe('Feature Name', () => {
  // Optional: set viewport
  test.use({ viewport: { width: 1920, height: 1080 } })
  
  test('test description', async ({ page }) => {
    const element = page.locator('[data-testid="unique-id"]')
    await expect(element).toBeVisible()
  })
})
```

## Troubleshooting

### Tests fail with "locator not found"
- Ensure dev server is running: `npm run dev:docker`
- Check the correct band is being tested (bohneme = port 3001)
- Verify CSS class names haven't changed

### Screenshots fail
- Update baselines: `npm run test:e2e -- --update-snapshots`
- Check for dynamic content that changes between runs

### Keyboard tests fail
- Keyboard events require focus - ensure modal is opened before keypress
- May need to add explicit `waitForTimeout` for animations
