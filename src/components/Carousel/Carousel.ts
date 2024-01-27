import { scrollend } from 'https://cdn.jsdelivr.net/gh/argyleink/scrollyfills@latest/dist/scrollyfills.modern.js'

interface IntersectionInfo {
  isIntersecting: boolean
  target: Element
}

class Carousel {
  private elements: {
    root: Element
    scroller: Element
    snaps: NodeListOf<Element>
    pagination: HTMLElement | null
  }
  private current: Element | undefined
  private hasIntersected: Set<IntersectionInfo>

  private carousel_observer!: IntersectionObserver
  private mutation_observer!: MutationObserver

  constructor(element: Element) {
    this.elements = {
      root: element,
      scroller: element.querySelector('.carousel--scroller')!,
      snaps: element.querySelectorAll('.carousel--snap'),
      pagination: null, // generated in #createPagination
    }

    this.current = undefined // set in #initializeState
    this.hasIntersected = new Set() // holds intersection results used on scrollend

    this.elements.root.setAttribute('tabindex', '-1')
    this.elements.root.setAttribute('aria-roledescription', 'carousel')

    this.elements.scroller.setAttribute('role', 'group')
    this.elements.scroller.setAttribute('aria-label', 'Items Scroller')
    this.elements.scroller.setAttribute('aria-live', 'Polite')

    this.createObservers()
    this.createPagination()
    this.initializeState()
    this.listen()
    this.synchronize()
  }

  private synchronize() {
    for (const observation of this.hasIntersected) {
      // toggle inert when it's not intersecting
      observation.target.toggleAttribute('inert', !observation.isIntersecting)

      // toggle aria-selected on pagination dots
      const dot = this.elements.pagination!.children[this.getElementIndex(observation.target)]

      dot.setAttribute('aria-selected', observation.isIntersecting.toString())
      dot.setAttribute('tabindex', observation.isIntersecting ? '0' : '-1')

      // stash the intersecting snap element
      if (observation.isIntersecting) {
        this.current = observation.target
        this.goToElement({
          scrollport: this.elements.pagination!,
          element: dot,
        })
      }
    }

    this.hasIntersected.clear()
  }

  public goNext() {
    const next = this.current!.nextElementSibling

    if (this.current === next) return

    if (next) {
      this.goToElement({
        scrollport: this.elements.scroller,
        element: next,
      })
      this.current = next
    } else {
      console.log('at the end')
    }
  }

  public goPrevious() {
    const previous = this.current!.previousElementSibling

    if (this.current === previous) return

    if (previous) {
      this.goToElement({
        scrollport: this.elements.scroller,
        element: previous,
      })
      this.current = previous
    } else {
      console.log('at the beginning')
    }
  }

  public goToElement({ scrollport, element }: { scrollport: Element; element: Element }) {
    const dir = this.documentDirection()

    const delta = Math.abs(
      (scrollport as HTMLElement).offsetLeft - (element as HTMLElement).offsetLeft
    )
    const scrollerPadding = parseInt(getComputedStyle(scrollport as HTMLElement)['padding-left'])

    const pos =
      (scrollport as HTMLElement).clientWidth / 2 > delta
        ? delta - scrollerPadding
        : delta + scrollerPadding

    ;(scrollport as HTMLElement).scrollTo(dir === 'ltr' ? pos : pos * -1, 0)
  }

  private listen() {
    // observe children intersection
    for (const item of this.elements.snaps) this.carousel_observer.observe(item)

    // watch document for removal of this carousel node
    this.mutation_observer.observe(document, {
      childList: true,
      subtree: true,
    })

    // scrollend listener for sync
    this.elements.scroller.addEventListener('scrollend', this.synchronize.bind(this))
    this.elements.pagination!.addEventListener('click', this.handlePaginate.bind(this))
    this.elements.root.addEventListener('keydown', this.handleKeydown.bind(this))
  }

  private unlisten() {
    for (const item of this.elements.snaps) this.carousel_observer.unobserve(item)

    this.mutation_observer.disconnect()

    this.elements.scroller.removeEventListener('scrollend', this.synchronize)
    this.elements.pagination!.removeEventListener('click', this.handlePaginate)
    this.elements.root.removeEventListener('keydown', this.handleKeydown)
  }

  private createObservers() {
    this.carousel_observer = new IntersectionObserver(
      (observations) => {
        for (const observation of observations) {
          this.hasIntersected.add(observation)

          observation.target.classList.toggle('--in-view', observation.isIntersecting)
        }
      },
      {
        root: this.elements.scroller,
        threshold: 0.6,
      }
    )

    this.mutation_observer = new MutationObserver((mutationList) => {
      mutationList
        .filter((x) => x.removedNodes.length > 0)
        .forEach((mutation) => {
          ;[...mutation.removedNodes]
            .filter((x) => (x as HTMLElement).querySelector('.carousel') === this.elements.root)
            .forEach(() => {
              this.unlisten()
            })
        })
    })
  }

  private initializeState() {
    const startIndex = this.elements.root.hasAttribute('carousel-start')
      ? parseInt(this.elements.root.getAttribute('carousel-start')!) - 1
      : 0

    this.current = this.elements.snaps[startIndex]
    this.handleScrollStart()

    // each snap target needs a marker for pagination
    // each snap needs some a11y love
    this.elements.snaps.forEach((snapChild, index) => {
      this.hasIntersected.add({
        isIntersecting: index === 0,
        target: snapChild,
      })

      this.elements.pagination!.appendChild(this.createMarker(snapChild, index))

      snapChild.setAttribute('aria-label', `${index + 1} of ${this.elements.snaps.length}`)
      snapChild.setAttribute('aria-roledescription', 'item')
    })
  }

  private handleScrollStart() {
    if (this.elements.root.hasAttribute('carousel-start')) {
      const itemIndex = parseInt(this.elements.root.getAttribute('carousel-start')!)
      const startElement = this.elements.snaps[itemIndex - 1] as HTMLElement

      this.elements.snaps.forEach((snap) => ((snap as HTMLElement).style.scrollSnapAlign = 'unset'))

      startElement.style.scrollSnapAlign = 'initial'
      startElement.style.animation = 'carousel-scrollstart 1ms'

      startElement.addEventListener(
        'animationend',
        (e) => {
          startElement.style.animation = 'initial'
          this.elements.snaps.forEach(
            (snap) => ((snap as HTMLElement).style.scrollSnapAlign = 'initial')
          )
        },
        { once: true }
      )
    }
  }

  private handlePaginate(e: Event) {
    if ((e.target as HTMLElement).classList.contains('carousel--pagination')) return
    ;(e.target as HTMLElement).setAttribute('aria-selected', 'true')
    const item = this.elements.snaps[this.getElementIndex(e.target as Element)]

    this.goToElement({
      scrollport: this.elements.scroller,
      element: item,
    })
  }

  private handleKeydown(e: KeyboardEvent) {
    const dir = this.documentDirection()
    const idx = this.getElementIndex(e.target as Element)

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()

        const next_offset = dir === 'ltr' ? 1 : -1

        if ((e.target as HTMLElement).closest('.carousel--pagination'))
          this.elements.pagination!.children[idx + next_offset]?.focus()

        dir === 'ltr' ? this.goNext() : this.goPrevious()
        break
      case 'ArrowLeft':
        e.preventDefault()

        const previous_offset = dir === 'ltr' ? -1 : 1

        if ((e.target as HTMLElement).closest('.carousel--pagination'))
          this.elements.pagination!.children[idx + previous_offset]?.focus()

        dir === 'ltr' ? this.goPrevious() : this.goNext()
        break
    }
  }

  private getElementIndex(element: Element) {
    let index = 0

    while ((element = element.previousElementSibling!)) index++

    return index
  }

  private createPagination() {
    const nav = document.createElement('nav')

    nav.className = 'carousel--pagination flex'
    nav.setAttribute('role', 'tablist')

    this.elements.root.appendChild(nav)
    this.elements.pagination = nav
  }

  private createMarker(item: Element, index: number) {
    const markerType = this.elements.root.getAttribute('carousel-pagination')
    index++ // user facing index shouldnt start at 0

    return this.createMarkerDot({ index, type: markerType, item })
  }

  private createMarkerDot({ index, item }: { index: number; item: Element }) {
    const marker = document.createElement('button')
    const img = item.querySelector('img')
    const caption = item.querySelector('figcaption')

    marker.type = 'button'
    marker.role = 'tab'
    marker.title = `Item ${index}: ${img?.alt || caption?.innerText}`
    marker.setAttribute('aria-label', img?.alt || caption?.innerText)
    marker.setAttribute('aria-setsize', this.elements.snaps.length.toString())
    marker.setAttribute('aria-posinset', index.toString())

    return marker
  }

  private documentDirection() {
    return document.firstElementChild!.getAttribute('dir') || 'ltr'
  }
}

document.addEventListener('astro:page-load', () => {
  document.querySelectorAll('.carousel').forEach((element) => {
    new Carousel(element)
  })
})
