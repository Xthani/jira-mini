import { useCallback, useEffect, useState } from 'react'
import { parseAppPath } from '../lib/appRoutes.js'

export function useAppRoute() {
  const [route, setRoute] = useState(() => parseAppPath())

  const syncRoute = useCallback(() => {
    setRoute(parseAppPath())
  }, [])

  useEffect(() => {
    window.addEventListener('popstate', syncRoute)
    return () => window.removeEventListener('popstate', syncRoute)
  }, [syncRoute])

  return { route, syncRoute }
}
