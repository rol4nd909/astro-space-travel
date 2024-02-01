export const TabbedContent = (domNode: HTMLElement): void => {
  // Find the container for the tabs
  const tabsList = domNode.querySelector<HTMLElement>('[role=tablist]')
  if (!tabsList) return // If no tablist is found, exit the function

  const withAnimatedIndicator = domNode.hasAttribute('tabs-animated-indicator')

  // Get all the tab elements
  const tabs = Array.from(tabsList.querySelectorAll<HTMLElement>('[role=tab]'))

  // Create a mapping between tab elements and panel elements
  const tabPanelMap = new Map<HTMLElement, HTMLElement>()

  tabs.forEach((tab) => {
    const panelId = tab.getAttribute('aria-controls')
    if (panelId) {
      const panel = document.querySelector<HTMLElement>(`#${CSS.escape(panelId)}`)
      if (panel) {
        tabPanelMap.set(tab, panel)
      }
    }
  })

  // Set the initial active tab to the one marked as selected, or the first tab
  let activeTab = tabsList.querySelector<HTMLElement>('[aria-selected=true]') || tabs[0]

  // Function to switch between tabs
  const switchTab = (newTab: HTMLElement): void => {
    const newPanel = tabPanelMap.get(newTab)
    if (!newPanel) return

    // Hide all panels and show the new one
    tabPanelMap.forEach((panel) => panel.setAttribute('hidden', 'true'))
    newPanel.removeAttribute('hidden')

    // Update the selected state of tabs
    activeTab.setAttribute('aria-selected', 'false')
    activeTab.setAttribute('tabindex', '-1')

    newTab.setAttribute('aria-selected', 'true')
    newTab.setAttribute('tabindex', '0')

    if (withAnimatedIndicator) {
      // Move the indicator under the active tab
      moveIndicator(activeTab, newTab)
    }

    // Update the active tab
    activeTab = newTab
  }

  // delta parameter specifies the direction to move the tab (-1 for left and 1 for right).
  const moveTab = (delta: number): void => {
    const currentTab = document.activeElement as HTMLElement
    const currentIndex = tabs.indexOf(currentTab)
    const newIndex = (currentIndex + delta + tabs.length) % tabs.length

    tabs[newIndex].focus()
  }

  // Move the indicator between tabs with animation
  const moveIndicator = (oldTab: HTMLElement, newTab: HTMLElement): void => {
    // Determine the position of the newTab relative to the oldTab in the document
    const newTabPosition = oldTab.compareDocumentPosition(newTab)

    // Calculate the width of the new tab as a fraction of the tabs list width
    const newTabWidth = `${newTab.offsetWidth / tabsList.offsetWidth}`

    let transitionWidth

    // Calculate the width of the transition based on the tab positions
    if (newTabPosition === 4) {
      // If the new tab comes after the old tab, calculate the width accordingly
      transitionWidth = newTab.offsetLeft + newTab.offsetWidth - oldTab.offsetLeft
    } else {
      // If the new tab comes before the old tab, calculate the width accordingly
      transitionWidth = oldTab.offsetLeft + oldTab.offsetWidth - newTab.offsetLeft
      // Update the left property of tabsList to match the new tab's position
      tabsList.style.setProperty('--_left', `${newTab.offsetLeft}px`)
    }

    // Set the CSS custom property to control the indicator's width during transition
    tabsList.style.setProperty('--_width', `${transitionWidth / tabsList.offsetWidth}`)

    // Define a function to handle the transition end event
    const transitionEndHandler = () => {
      // Update the left and width properties of tabsList to match the new tab
      tabsList.style.setProperty('--_left', `${newTab.offsetLeft}px`)
      tabsList.style.setProperty('--_width', newTabWidth)

      // Remove the transitionEndHandler as it's no longer needed
      tabsList.removeEventListener('transitionend', transitionEndHandler)
    }

    // Attach the transitionEndHandler to the transitionend event
    // Use { once: true } to automatically remove the event listener after it's triggered
    tabsList.addEventListener('transitionend', transitionEndHandler, {
      once: true,
    })
  }

  // Listen for click events on tab elements
  tabsList.addEventListener('click', (event) => {
    const clickedTab = event.target as HTMLElement

    if (tabs.includes(clickedTab)) {
      switchTab(clickedTab)
    }
  })

  // Listen for keydown events on tablist for keyboard navigation
  tabsList.addEventListener('keydown', (event) => {
    switch (event.key) {
      case 'ArrowLeft':
        moveTab(-1)
        break
      case 'ArrowRight':
        moveTab(1)
        break
      case 'Home':
        event.preventDefault()
        switchTab(tabs[0])
        break
      case 'End':
        event.preventDefault()
        switchTab(tabs[tabs.length - 1])
        break
    }
  })

  // Initialize the tabbed content with the active tab
  switchTab(activeTab)
}
