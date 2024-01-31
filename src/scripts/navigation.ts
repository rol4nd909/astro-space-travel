// document.addEventListener('astro:page-load', () => {
const header = document.querySelector('header') as HTMLElement
const menu = header.querySelector('[data-menu]') as HTMLDivElement

// if (!menu) return

const toggle = menu.querySelector('[data-menu-toggle]') as HTMLButtonElement
const navList = menu.querySelector('[data-menu-list]') as HTMLElement

// if (!toggle || !navList) return

let isAnimating = false // Flag to track animation state

const openMenu = () => {
  if (isAnimating) return // Don't open if already animating
  isAnimating = true

  document.documentElement.classList.add('is-locked')
  toggle.setAttribute('aria-expanded', 'true')

  // Make every other element inert
  toggleInertOnOtherElements(header, true)

  navList.hidden = false

  // Listen for animation end and reset the flag
  navList.addEventListener(
    'animationend',
    () => {
      isAnimating = false
    },
    { once: true }
  )

  window.addEventListener('click', handleClosure)
  window.addEventListener('focusin', handleClosure)

  // Focus on the first focusable element inside the menu
  // const firstFocusableElement = navList.querySelector(
  //     'a, button, input, select, textarea'
  // ) as HTMLElement
  // if (firstFocusableElement) {
  //     firstFocusableElement.focus()
  // }
}

const closeMenu = () => {
  if (isAnimating) return // Don't close if already animating
  isAnimating = true

  document.documentElement.classList.remove('is-locked')
  toggle.setAttribute('aria-expanded', 'false')

  // Remove inert attribute from other elements
  toggleInertOnOtherElements(header, false)

  navList.setAttribute('closing', '')
  navList.addEventListener(
    'animationend',
    () => {
      navList.removeAttribute('closing')
      navList.hidden = true
      isAnimating = false
    },
    { once: true }
  )

  window.removeEventListener('click', handleClosure)
  window.removeEventListener('focusin', handleClosure)
}

const handleClosure = (event: Event) => {
  const open = JSON.parse(toggle.getAttribute('aria-expanded') as string)

  if (!open) return

  !menu.contains(event.target as Node) && closeMenu()
}

toggle.addEventListener('click', () => {
  const open = JSON.parse(toggle.getAttribute('aria-expanded') as string)
  open ? closeMenu() : openMenu()
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
    closeMenu()
    toggle.focus()
  }
})
// })

// Function to set or remove the inert attribute on every other element except for the specified element and its descendants
function toggleInertOnOtherElements(element: HTMLElement, setInert: boolean) {
  const otherElements = Array.from(document.body.children).filter(
    (item) => item !== element && !element.contains(item)
  ) as HTMLElement[]

  otherElements.forEach((item) => {
    if (setInert) {
      item.setAttribute('inert', '')
    } else {
      item.removeAttribute('inert')
    }
  })
}
