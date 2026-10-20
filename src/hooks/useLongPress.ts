import { useRef } from 'react'

/** Fires `onLongPress` after holding down for `ms` milliseconds (touch or mouse). */
export function useLongPress(onLongPress: () => void, ms = 800) {
  const timer = useRef<number | null>(null)
  const cancel = () => {
    if (timer.current != null) window.clearTimeout(timer.current)
    timer.current = null
  }
  return {
    onPointerDown: () => {
      cancel()
      timer.current = window.setTimeout(() => {
        timer.current = null
        onLongPress()
      }, ms)
    },
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
  }
}
