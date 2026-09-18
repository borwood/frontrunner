import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { useSubscribeDev } from '@subscribe.dev/react'

/**
 * Centralized user context that wraps useSubscribeDev() once at the app level.
 * This prevents calling useSubscribeDev() multiple times and ensures stable user state
 * across page navigations.
 */

// Get the return type of useSubscribeDev hook
type SubscribeDevContextValue = ReturnType<typeof useSubscribeDev>

const UserContext = createContext<SubscribeDevContextValue | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const subscribeDev = useSubscribeDev()

  return <UserContext.Provider value={subscribeDev}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
