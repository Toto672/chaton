import { useCallback, useEffect, useRef } from 'react'

/**
 * Attaches scroll shadow indicators to all matching elements inside a container.
 * Adds `scroll-shadow-top`, `scroll-shadow-bottom`, or both depending on scroll position.
 * Only activates when the element is actually scrollable (scrollHeight > clientHeight).
 */
export function useScrollShadow(containerRef: React.RefObject<HTMLElement | null>) {
  // Keep track of cleanup functions per element so we can remove listeners on unmount
  const cleanupRef = useRef<(() => void)[]>([])

  const updateShadow = useCallback((el: HTMLElement) => {
    const canScroll = el.scrollHeight > el.clientHeight
    if (!canScroll) {
      el.classList.remove('scroll-shadow-top', 'scroll-shadow-bottom')
      return
    }

    const atTop = el.scrollTop <= 1
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 1

    el.classList.toggle('scroll-shadow-top', !atTop)
    el.classList.toggle('scroll-shadow-bottom', !atBottom)
  }, [])

  const attachToElements = useCallback(() => {
    // Clean up any previous listeners
    for (const cleanup of cleanupRef.current) cleanup()
    cleanupRef.current = []

    if (!containerRef.current) return

    const elements = containerRef.current.querySelectorAll<HTMLElement>(
      '.chat-message-text, .chat-markdown',
    )

    for (const el of elements) {
      updateShadow(el)

      const onScroll = () => updateShadow(el)
      el.addEventListener('scroll', onScroll, { passive: true })

      // Re-evaluate when content changes size (e.g. during streaming)
      const resizeObserver = new ResizeObserver(() => updateShadow(el))
      resizeObserver.observe(el)

      cleanupRef.current.push(() => {
        el.removeEventListener('scroll', onScroll)
        resizeObserver.disconnect()
        el.classList.remove('scroll-shadow-top', 'scroll-shadow-bottom')
      })
    }
  }, [containerRef, updateShadow])

  useEffect(() => {
    attachToElements()
    return () => {
      for (const cleanup of cleanupRef.current) cleanup()
      cleanupRef.current = []
    }
  }, [attachToElements])

  // Re-attach whenever the DOM inside the container changes (new elements rendered)
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new MutationObserver(() => attachToElements())
    observer.observe(containerRef.current, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [containerRef, attachToElements])
}
