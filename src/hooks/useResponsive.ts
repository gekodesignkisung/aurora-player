import { useState, useEffect } from 'react'

export function useResponsive() {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [windowWidth, setWindowWidth] = useState(0)

  useEffect(() => {
    // Set initial width
    setWindowWidth(window.innerWidth)

    const handleResize = () => {
      const width = window.innerWidth
      setWindowWidth(width)
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return { isMobile, isTablet, windowWidth }
}
