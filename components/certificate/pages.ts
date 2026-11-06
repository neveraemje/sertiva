// Multi-page PDFs are stored as one tall image with the pages stacked top to bottom.
// `pages` holds each page's height, relative to the others; one page or none means a single page.

export type PageBounds = { top: number; bottom: number }

// Page edges as percentages of the whole design height.
export function pageBounds(pages?: number[]): PageBounds[] {
  if (!pages || pages.length < 2) return [{ top: 0, bottom: 100 }]
  const total = pages.reduce((sum, height) => sum + height, 0)
  let top = 0
  return pages.map((height) => {
    const bottom = top + height / total * 100
    const bounds = { top, bottom }
    top = bottom
    return bounds
  })
}

export function pageAt(bounds: PageBounds[], y: number) {
  return bounds.find((page) => y < page.bottom) ?? bounds[bounds.length - 1]
}

// Converts a percentage within one page to a percentage of the whole design.
export function yOnPage(page: PageBounds, percent: number) {
  return Math.round((page.top + (page.bottom - page.top) * percent / 100) * 100) / 100
}

export function isMultiPage(pages?: number[]) {
  return Boolean(pages && pages.length > 1)
}
