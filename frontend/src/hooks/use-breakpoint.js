import * as React from "react"

export function useBreakpoint(breakpoint) {
  const [matches, setMatches] = React.useState(undefined)

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return
    }

    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const onChange = () => {
      setMatches(window.innerWidth < breakpoint)
    }

    mql.addEventListener("change", onChange)
    setMatches(window.innerWidth < breakpoint)

    return () => mql.removeEventListener("change", onChange);
  }, [breakpoint])

  return !!matches
}
