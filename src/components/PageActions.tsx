import React, { useState, useEffect, useRef } from 'react'
import styles from './PageActions.module.css'

interface PageActionsProps { }

const PageActions: React.FC<PageActionsProps> = () => {
  // Initialize dropdown state from sessionStorage
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('pageActionsDropdownOpen') === 'true'
    }
    return false
  })
  const [pageContent, setPageContent] = useState('')
  const [pageTitle, setPageTitle] = useState('')
  const [currentPath, setCurrentPath] = useState(typeof window !== 'undefined' ? window.location.pathname : '')
  const [isCopied, setIsCopied] = useState(false)
  const [isDocPage, setIsDocPage] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const updatePageData = () => {
    // Get current path from window location
    if (typeof window !== 'undefined') {
      const path = window.location.pathname
      setCurrentPath(path)
      console.log('PageActions: Current path is:', path)
    }

    // Check if we're on a documentation page
    const docPageCheck = document.querySelector('main') &&
      (document.querySelector('article') ||
        document.querySelector('.markdown') ||
        document.querySelector('[class*="docMainContainer"]'))
    setIsDocPage(!!docPageCheck)

    // Get the page title
    const title = document.title.replace(' | SIWE Docs', '')
    setPageTitle(title)

    // Get the main content
    const mainContent = document.querySelector('main')
    if (mainContent) {
      // Remove navigation and other non-content elements
      const contentArea = mainContent.querySelector('[class*="docMainContainer"]') ||
        mainContent.querySelector('article') ||
        mainContent.querySelector('.markdown')
      if (contentArea) {
        setPageContent(contentArea.textContent || '')
      }
    }
  }

  useEffect(() => {
    updatePageData()
  }, [])

  // Persist dropdown state to sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pageActionsDropdownOpen', isOpen.toString())
    }
  }, [isOpen])

  // Separate effect for route changes that doesn't reset dropdown state
  useEffect(() => {
    const handleRouteChange = () => {
      // Only update page data, don't close dropdown
      setTimeout(() => {
        // Update path and content without affecting dropdown
        if (typeof window !== 'undefined') {
          const path = window.location.pathname
          setCurrentPath(path)
        }

        // Update title
        const title = document.title.replace(' | SIWE Docs', '')
        setPageTitle(title)

        // Check if we're on a documentation page
        const docPageCheck = document.querySelector('main') &&
          (document.querySelector('article') ||
            document.querySelector('.markdown') ||
            document.querySelector('[class*="docMainContainer"]'))
        setIsDocPage(!!docPageCheck)

        // Update content
        const mainContent = document.querySelector('main')
        if (mainContent) {
          const contentArea = mainContent.querySelector('[class*="docMainContainer"]') ||
            mainContent.querySelector('article') ||
            mainContent.querySelector('.markdown')
          if (contentArea) {
            setPageContent(contentArea.textContent || '')
          }
        }
      }, 100)
    }

    // Listen for pushstate/replacestate
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = function () {
      originalPushState.apply(history, arguments)
      handleRouteChange()
    }

    history.replaceState = function () {
      originalReplaceState.apply(history, arguments)
      handleRouteChange()
    }

    window.addEventListener('popstate', handleRouteChange)

    return () => {
      history.pushState = originalPushState
      history.replaceState = originalReplaceState
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleCopyPage = async () => {
    try {
      const textToCopy = `# ${pageTitle}\n\n${pageContent}`
      await navigator.clipboard.writeText(textToCopy)
      setIsCopied(true)
      setIsOpen(false)

      // Reset the copied state after 2.5 seconds
      setTimeout(() => {
        setIsCopied(false)
      }, 2500)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const handleViewMarkdown = () => {
    // Get the raw markdown URL (assuming GitHub structure)
    let pathToUse = currentPath

    // Remove /docs prefix if present
    pathToUse = pathToUse.replace(/^\/docs/, '')

    // Handle different path patterns
    let markdownPath = ''
    if (pathToUse === '/' || pathToUse === '') {
      markdownPath = '/docs/index.md'
    } else if (pathToUse.endsWith('/')) {
      markdownPath = `/docs${pathToUse}index.md`
    } else {
      markdownPath = `/docs${pathToUse}.md`
    }

    // Check which files use .mdx extension based on the actual file structure
    const mdxPaths = [
      // Library files
      '/languages/typescript',
      '/languages/rust',
      '/languages/python',
      '/languages/ruby',
      '/languages/go',
      '/languages/elixir',
      // Integration files
      '/integrations/discourse',
      '/integrations/nextauth.js',
      '/integrations/auth0'
    ]

    // Check if current path matches any mdx paths
    const shouldUseMdx = mdxPaths.some(mdxPath => pathToUse === mdxPath || pathToUse === mdxPath + '/')

    if (shouldUseMdx) {
      markdownPath = markdownPath.replace('.md', '.mdx')
    }

    const githubUrl = `https://raw.githubusercontent.com/signinwithethereum/docs/main${markdownPath}`
    console.log('PageActions: Opening markdown URL:', githubUrl)
    window.open(githubUrl, '_blank')
    setIsOpen(false)
  }

  const handleOpenChatGPT = () => {
    // Create the current page URL for the AI to read
    const currentUrl = `https://docs.siwe.xyz${currentPath}`
    const prompt = `Read ${currentUrl} and answer questions about the content.`
    const encodedPrompt = encodeURIComponent(prompt)

    const chatgptUrl = `https://chatgpt.com/?prompt=${encodedPrompt}`
    window.open(chatgptUrl, '_blank')
    setIsOpen(false)
  }

  const handleOpenClaude = () => {
    // Create the current page URL for the AI to read
    const currentUrl = `https://docs.siwe.xyz${currentPath}`
    const prompt = `Read ${currentUrl} and answer questions about the content.`
    const encodedPrompt = encodeURIComponent(prompt)

    const claudeUrl = `https://claude.ai/?q=${encodedPrompt}`
    window.open(claudeUrl, '_blank')
    setIsOpen(false)
  }

  // Don't render if we're not on a documentation page
  if (!isDocPage) {
    return null
  }

  return (
    <div className={styles.pageActions} ref={dropdownRef}>
      <div className={styles.copyButton}>
        <button
          className={styles.mainButton}
          onClick={handleCopyPage}
          title="Copy page content"
        >
          {isCopied ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" />
              </svg>
              Copy
            </>
          )}
        </button>

        <button
          className={styles.dropdownButton}
          onClick={() => setIsOpen(!isOpen)}
          title="More actions"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 10L12 15L17 10H7Z" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownContent}>
            <button className={styles.dropdownItem} onClick={handleCopyPage}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" />
              </svg>
              <div className={styles.itemContent}>
                <div className={styles.itemTitle}>Copy page</div>
                <div className={styles.itemDescription}>Copy page as Markdown for LLMs</div>
              </div>
            </button>

            <button className={styles.dropdownItem} onClick={handleViewMarkdown}>
              <div className={styles.markdownIcon}>M↓</div>
              <div className={styles.itemContent}>
                <div className={styles.itemTitle}>View as Markdown</div>
                <div className={styles.itemDescription}>View this page as plain text</div>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 3V5H17.59L7.76 14.83L9.17 16.24L19 6.41V10H21V3H14Z" />
              </svg>
            </button>

            <div className={styles.separator} />

            <button className={styles.dropdownItem} onClick={handleOpenChatGPT}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142-.0852 4.783-2.7582a.7712.7712 0 0 0 .7806 0l5.8428 3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142.0852-4.7735 2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
              </svg>
              <div className={styles.itemContent}>
                <div className={styles.itemTitle}>Open in ChatGPT</div>
                <div className={styles.itemDescription}>Ask ChatGPT about this page</div>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 3V5H17.59L7.76 14.83L9.17 16.24L19 6.41V10H21V3H14Z" />
              </svg>
            </button>

            <button className={styles.dropdownItem} onClick={handleOpenClaude}>
              <svg width="16" height="16" viewBox="0 0 256 257" fill="currentColor">
                <path d="M50.2278481,170.321013 L100.585316,142.063797 L101.427848,139.601013 L100.585316,138.24 L98.1225316,138.24 L89.6972152,137.721519 L60.921519,136.943797 L35.9696203,135.906835 L11.795443,134.610633 L5.70329114,133.31443 L0,125.796456 L0.583291139,122.037468 L5.70329114,118.602532 L13.0268354,119.250633 L29.2293671,120.352405 L53.5331646,122.037468 L71.161519,123.07443 L97.28,125.796456 L101.427848,125.796456 L102.011139,124.111392 L100.585316,123.07443 L99.4835443,122.037468 L74.3372152,104.992405 L47.116962,86.9751899 L32.8587342,76.6055696 L25.1463291,71.3559494 L21.2577215,66.4303797 L19.5726582,55.6718987 L26.5721519,47.9594937 L35.9696203,48.6075949 L38.3675949,49.2556962 L47.8946835,56.5792405 L68.2450633,72.3281013 L94.8172152,91.9007595 L98.7058228,95.1412658 L100.261266,94.0394937 L100.455696,93.2617722 L98.7058228,90.3453165 L84.2531646,64.2268354 L68.8283544,37.6546835 L61.958481,26.636962 L60.1437975,20.0263291 C59.4956962,17.3043038 59.0420253,15.0359494 59.0420253,12.2491139 L67.0136709,1.42582278 L71.4207595,-1.42108547e-14 L82.0496203,1.42582278 L86.521519,5.31443038 L93.1321519,20.4151899 L103.825823,44.2005063 L120.417215,76.5407595 L125.277975,86.1326582 L127.87038,95.0116456 L128.842532,97.7336709 L130.527595,97.7336709 L130.527595,96.1782278 L131.888608,77.9665823 L134.416203,55.6070886 L136.878987,26.8313924 L137.721519,18.7301266 L141.739747,9.00860759 L149.711392,3.75898734 L155.933165,6.74025316 L161.053165,14.0637975 L160.340253,18.7949367 L157.294177,38.5620253 L151.331646,69.5412658 L147.443038,90.2805063 L149.711392,90.2805063 L152.303797,87.6881013 L162.803038,73.7539241 L180.431392,51.718481 L188.208608,42.9691139 L197.282025,33.3124051 L203.114937,28.7108861 L214.132658,28.7108861 L222.233924,40.7655696 L218.604557,53.2091139 L207.262785,67.596962 L197.865316,79.7812658 L184.38481,97.9281013 L175.959494,112.44557 L176.737215,113.612152 L178.746329,113.417722 L209.207089,106.936709 L225.668861,103.955443 L245.306329,100.585316 L254.185316,104.733165 L255.157468,108.945823 L251.657722,117.56557 L230.659241,122.75038 L206.031392,127.675949 L169.348861,136.360506 L168.89519,136.684557 L169.413671,137.332658 L185.940253,138.888101 L193.004557,139.276962 L210.308861,139.276962 L242.519494,141.674937 L250.94481,147.248608 L256,154.053671 L255.157468,159.238481 L242.195443,165.849114 L224.696709,161.701266 L183.866329,151.979747 L169.867342,148.48 L167.923038,148.48 L167.923038,149.646582 L179.588861,161.053165 L200.976203,180.366582 L227.742785,205.253671 L229.103797,211.410633 L225.668861,216.271392 L222.039494,215.752911 L198.513418,198.059747 L189.44,190.088101 L168.89519,172.783797 L167.534177,172.783797 L167.534177,174.598481 L172.265316,181.533165 L197.282025,219.123038 L198.578228,230.659241 L196.763544,234.418228 L190.282532,236.686582 L183.153418,235.39038 L168.506329,214.84557 L153.40557,191.708354 L141.221266,170.969114 L139.730633,171.811646 L132.536709,249.259747 L129.166582,253.213165 L121.389367,256.19443 L114.908354,251.268861 L111.473418,243.297215 L114.908354,227.548354 L119.056203,207.003544 L122.426329,190.671392 L125.472405,170.385823 L127.287089,163.64557 L127.157468,163.191899 L125.666835,163.386329 L110.371646,184.38481 L87.1048101,215.817722 L68.6987342,235.52 L64.2916456,237.269873 L56.6440506,233.316456 L57.356962,226.252152 L61.6344304,219.96557 L87.1048101,187.560506 L102.46481,167.469367 L112.380759,155.868354 L112.315949,154.183291 L111.732658,154.183291 L44.0708861,198.124557 L32.0162025,199.68 L26.8313924,194.819241 L27.4794937,186.847595 L29.9422785,184.25519 L50.2926582,170.256203 L50.2278481,170.321013 Z" />
              </svg>
              <div className={styles.itemContent}>
                <div className={styles.itemTitle}>Open in Claude</div>
                <div className={styles.itemDescription}>Ask Claude about this page</div>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 3V5H17.59L7.76 14.83L9.17 16.24L19 6.41V10H21V3H14Z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PageActions