import { createElement } from 'react'
import { createRoot } from 'react-dom/client'

let pageActionsRoot = null
let pageActionsInitialized = false
let positionObserver = null
let resizeObserver = null
let animationFrameId = null

function getContentBounds() {
  // Find the main content container
  let contentElement = document.querySelector('.row .col:not(.col--3)') ||
                      document.querySelector('.row .col:first-child') ||
                      document.querySelector('article') ||
                      document.querySelector('[class*="docItemContainer"]') ||
                      document.querySelector('.markdown') ||
                      document.querySelector('main .col') ||
                      document.querySelector('[class*="docMainContainer"]') ||
                      document.querySelector('main .container') ||
                      document.querySelector('main')
  
  if (contentElement && contentElement.classList.contains('col')) {
    const innerContainer = contentElement.querySelector('[class*="docItemContainer"]') || 
                          contentElement.querySelector('article')
    if (innerContainer) {
      contentElement = innerContainer
    }
  }

  if (!contentElement) return null

  const rect = contentElement.getBoundingClientRect()
  return {
    top: rect.top + window.scrollY,
    right: window.innerWidth - rect.right,
    width: rect.width,
    element: contentElement
  }
}

function updatePosition() {
  const container = document.getElementById('page-actions-container')
  if (!container) return

  // On mobile, ensure visibility but skip content-relative positioning
  if (window.innerWidth <= 996) {
    container.style.display = 'block'
    container.style.visibility = 'visible'
    return
  }

  const bounds = getContentBounds()
  if (!bounds) return

  // Cancel any pending animation frame
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }

  // Use requestAnimationFrame for smooth updates
  animationFrameId = requestAnimationFrame(() => {
    container.style.setProperty('--content-top', `${bounds.top}px`)
    container.style.setProperty('--content-right', `${bounds.right}px`)
    container.style.setProperty('--content-width', `${bounds.width}px`)
  })
}

function setupPositionTracking() {
  // Track scroll
  window.addEventListener('scroll', updatePosition, { passive: true })
  
  // Track resize
  window.addEventListener('resize', updatePosition)

  // Track content mutations
  positionObserver = new MutationObserver(() => {
    updatePosition()
  })

  // Observe body for structural changes
  positionObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style']
  })

  // Also use ResizeObserver for more accurate tracking
  const bounds = getContentBounds()
  if (bounds && bounds.element) {
    resizeObserver = new ResizeObserver(() => {
      updatePosition()
    })
    resizeObserver.observe(bounds.element)
  }
}

function cleanupPositionTracking() {
  window.removeEventListener('scroll', updatePosition)
  window.removeEventListener('resize', updatePosition)
  
  if (positionObserver) {
    positionObserver.disconnect()
    positionObserver = null
  }
  
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

function initPageActions() {
  if (typeof window === 'undefined') return

  // Only initialize once
  if (pageActionsInitialized) {
    console.log('PageActions: Already initialized, updating position')
    updatePosition()
    return
  }

  // Import the PageActions component dynamically
  import('./PageActions').then((PageActionsModule) => {
    const PageActions = PageActionsModule.default

    // Remove existing container if it exists
    const existingContainer = document.getElementById('page-actions-container')
    if (existingContainer) {
      if (pageActionsRoot) {
        pageActionsRoot.unmount()
      }
      existingContainer.remove()
    }

    console.log('PageActions: Initializing component')
    console.log('PageActions: Window width:', window.innerWidth)

    // Create container attached to body (persists across navigation)
    const container = document.createElement('div')
    container.id = 'page-actions-container'
    container.className = 'page-actions-root'
    document.body.appendChild(container)
    
    console.log('PageActions: Container created and appended to body')

    // Create root and render
    pageActionsRoot = createRoot(container)
    pageActionsRoot.render(createElement(PageActions))
    pageActionsInitialized = true

    // Setup position tracking
    setupPositionTracking()
    
    // Initial position update
    updatePosition()
  }).catch((error) => {
    console.error('PageActions: Failed to load component', error)
  })
}

// Initialize on page load
if (typeof window !== 'undefined') {
  // Initial load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initPageActions, 100)
    })
  } else {
    setTimeout(initPageActions, 100)
  }

  // Update position on route changes (for SPA navigation)
  const originalPushState = history.pushState
  const originalReplaceState = history.replaceState

  history.pushState = function() {
    originalPushState.apply(history, arguments)
    setTimeout(updatePosition, 200)
  }

  history.replaceState = function() {
    originalReplaceState.apply(history, arguments)
    setTimeout(updatePosition, 200)
  }

  window.addEventListener('popstate', () => {
    setTimeout(updatePosition, 200)
  })

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    cleanupPositionTracking()
  })
}