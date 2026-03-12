import { useEffect, useRef } from 'react'
import { useUIStore } from '@/store/uiStore'

export function useIdleHide(delayMs = 4000) {
  const setShowUI = useUIStore((s) => s.setShowUI)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    const reset = () => {
      setShowUI(true)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setShowUI(false), delayMs)
    }
    window.addEventListener('mousemove', reset)
    window.addEventListener('keydown', reset)
    reset()
    return () => {
      window.removeEventListener('mousemove', reset)
      window.removeEventListener('keydown', reset)
      clearTimeout(timerRef.current)
    }
  }, [setShowUI, delayMs])
}
