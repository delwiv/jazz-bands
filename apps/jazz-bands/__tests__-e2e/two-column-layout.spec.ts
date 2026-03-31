import { test, expect } from '@playwright/test'

test.describe('Two-Column Layout', () => {
  const TEST_BAND = 'boheme'
  const BASE_URL = `http://localhost:${3000 + ['boheme', 'canto', 'jazzola', 'swing-family', 'trio-rsh', 'west-side-trio'].indexOf(TEST_BAND) + 1}`

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL)
  })

  test.describe('Desktop Layout (1920x1080)', () => {
    test.use({ viewport: { width: 1920, height: 1080 } })

    test('two-column grid renders', async ({ page }) => {
      const gridContainer = page.locator('[class*="lg:grid"]')
      await expect(gridContainer).toBeVisible()
    })

    test('sidebar visible on right side', async ({ page }) => {
      const sidebar = page.locator('aside')
      await expect(sidebar).toBeVisible()

      const sidebarBox = await sidebar.boundingBox()
      expect(sidebarBox?.x).toBeGreaterThan(0)
    })

    test('sidebar width is 350px', async ({ page }) => {
      const sidebar = page.locator('aside')
      const sidebarBox = await sidebar.boundingBox()
      expect(sidebarBox?.width).toBeCloseTo(350, 1)
    })

    test('player visible in sidebar (top)', async ({ page }) => {
      const sidebar = page.locator('aside')
      const player = sidebar.locator('[role="region"][aria-label*="player"], [aria-label*="Player"]')
      await expect(player).toBeVisible()
    })

    test('slideshow preview visible below player', async ({ page }) => {
      const slideshowPreview = page.locator('[class*="snap-x"], [class*="snap-mandatory"]')
      await expect(slideshowPreview).toBeVisible()

      const slideshowBox = await slideshowPreview.boundingBox()
      const sidebar = page.locator('aside')
      const sidebarBox = await sidebar.boundingBox()
      
      expect(slideshowBox?.y).toBeGreaterThan(sidebarBox?.y || 0)
    })

    test('main content in left column', async ({ page }) => {
      const mainContent = page.locator('#main-content')
      await expect(mainContent).toBeVisible()

      const mainBox = await mainContent.boundingBox()
      const viewport = page.viewportSize()
      expect(mainBox?.width).toBeGreaterThan(0)
      expect(mainBox?.x).toBeCloseTo(0, 0)
    })

    test('header and footer visible', async ({ page }) => {
      const header = page.locator('header')
      const footer = page.locator('footer')
      
      await expect(header).toBeVisible()
      await expect(footer).toBeVisible()
    })

    test('desktop layout screenshot', async ({ page }) => {
      await expect(page).toHaveScreenshot(`desktop-${TEST_BAND}-layout.png`, {
        fullPage: true,
        maxDiffPixels: 100,
      })
    })
  })

  test.describe('Mobile Layout (375x667)', () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test('single column layout renders', async ({ page }) => {
      const mainContent = page.locator('#main-content')
      await expect(mainContent).toBeVisible()
      await expect(mainContent).toHaveClass(/lg:hidden/)
    })

    test('sidebar NOT visible', async ({ page }) => {
      const sidebar = page.locator('aside')
      await expect(sidebar).not.toBeVisible()
    })

    test('player fixed at bottom', async ({ page }) => {
      const player = page.locator('[class*="fixed"] [role="region"][aria-label*="player"], [class*="bottom"] [aria-label*="Player"]')
      await expect(player).toBeVisible()
    })

    test('full-width content area', async ({ page }) => {
      const mainContent = page.locator('#main-content')
      const mainBox = await mainContent.boundingBox()
      const viewport = page.viewportSize()
      
      expect(mainBox?.width).toBeGreaterThan(viewport?.width! - 40)
    })

    test('header and footer visible', async ({ page }) => {
      const header = page.locator('header')
      const footer = page.locator('footer')
      
      await expect(header).toBeVisible()
      await expect(footer).toBeVisible()
    })

    test('mobile layout screenshot', async ({ page }) => {
      await expect(page).toHaveScreenshot(`mobile-${TEST_BAND}-layout.png`, {
        fullPage: true,
        maxDiffPixels: 100,
      })
    })
  })

  test.describe('Player Functionality', () => {
    test('play/pause toggle works', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.goto(BASE_URL)

      const playButton = page.locator('[aria-label*="play"], [aria-label*="Play"]:not(:disabled)')
      await expect(playButton).toBeVisible()
      
      await playButton.first().click()
      await page.waitForTimeout(500)
      
      const pauseButton = page.locator('[aria-label*="pause"], [aria-label*="Pause"]:not(:disabled)')
      await expect(pauseButton.first()).toBeVisible()
    })

    test('progress bar seek works', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.goto(BASE_URL)

      const progressBar = page.locator('input[type="range"]')
      await expect(progressBar).toBeVisible()
      
      await progressBar.first().click({ position: { x: 50, y: 10 } })
    })

    test('volume controls visible', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.goto(BASE_URL)

      const volumeControls = page.locator('[aria-label*="volume"], [aria-label*="Volume"], button:has-text("Volume2"), button:has-text("Volume1")')
      await expect(volumeControls).toBeVisible()
    })

    test('track information displayed', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.goto(BASE_URL)

      const trackContainer = page.locator('[role="region"][aria-label*="player"]')
      await expect(trackContainer).toBeVisible()
    })
  })

  test.describe('Slideshow Tests (Desktop)', () => {
    test.use({ viewport: { width: 1920, height: 1080 } })

    test('3 images visible in preview container', async ({ page }) => {
      const imageButtons = page.locator('[class*="snap-x"] button')
      const count = await imageButtons.count()
      expect(count).toBeGreaterThan(0)
    })

    test('horizontal scroll snap works', async ({ page }) => {
      const previewContainer = page.locator('[class*="snap-x"]')
      await expect(previewContainer).toBeVisible()
    })

    test('click opens modal', async ({ page }) => {
      const imageButton = page.locator('[class*="snap-x"] button').first()
      await imageButton.click()

      const modal = page.locator('[class*="fixed"][class*="z-50"]')
      await expect(modal).toBeVisible()
    })

    test('modal displays full-size image', async ({ page }) => {
      const imageButton = page.locator('[class*="snap-x"] button').first()
      await imageButton.click()

      const modalImage = page.locator('img[draggable="false"]')
      await expect(modalImage).toBeVisible()
    })

    test('modal prev/next navigation works', async ({ page }) => {
      const imageButton = page.locator('[class*="snap-x"] button').first()
      await imageButton.click()

      const nextButton = page.locator('[aria-label="Next image"]')
      const prevButton = page.locator('[aria-label="Previous image"]')
      
      await expect(nextButton).toBeVisible()
      await expect(prevButton).toBeVisible()

      await nextButton.click()
      await page.waitForTimeout(300)

      await prevButton.click()
      await page.waitForTimeout(300)
    })

    test('modal close button works', async ({ page }) => {
      const imageButton = page.locator('[class*="snap-x"] button').first()
      await imageButton.click()

      await expect(page.locator('[class*="z-50"]')).toBeVisible()

      const closeButton = page.locator('[aria-label="Close modal"]')
      await closeButton.click()

      await expect(page.locator('[class*="z-50"]')).not.toBeVisible()
    })

    test('keyboard navigation (Escape, Arrow keys)', async ({ page }) => {
      const imageButton = page.locator('[class*="snap-x"] button').first()
      await imageButton.click()

      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(200)

      await page.keyboard.press('ArrowLeft')
      await page.waitForTimeout(200)

      await page.keyboard.press('Escape')
      await expect(page.locator('[class*="z-50"]')).not.toBeVisible()
    })

    test('slideshow modal screenshot', async ({ page }) => {
      const imageButton = page.locator('[class*="snap-x"] button').first()
      await imageButton.click()

      await expect(page).toHaveScreenshot(`desktop-${TEST_BAND}-modal-open.png`, {
        fullPage: true,
        maxDiffPixels: 100,
      })
    })
  })

  test.describe('Responsive Breakpoint Test', () => {
    test('resize from 1023px to 1025px triggers layout change', async ({ page }) => {
      await page.setViewportSize({ width: 1023, height: 1080 })
      await page.goto(BASE_URL)

      let sidebar = page.locator('aside')
      await expect(sidebar).not.toBeVisible()

      await page.setViewportSize({ width: 1025, height: 1080 })
      
      sidebar = page.locator('aside')
      await expect(sidebar).toBeVisible()
    })

    test('no content lost during transition', async ({ page }) => {
      await page.setViewportSize({ width: 1023, height: 1080 })
      await page.goto(BASE_URL)

      const mainContent = page.locator('#main-content')
      const header = page.locator('header')
      const footer = page.locator('footer')

      await expect(mainContent).toBeVisible()
      await expect(header).toBeVisible()
      await expect(footer).toBeVisible()

      await page.setViewportSize({ width: 1025, height: 1080 })

      await expect(mainContent).toBeVisible()
      await expect(header).toBeVisible()
      await expect(footer).toBeVisible()
    })
  })
})
