import { createContext, useContext } from 'react'

export type UIState = {
  isHurtigtasterOpen: boolean
  isTegnforklaringOpen: boolean
  openHurtigtaster: () => void
  closeHurtigtaster: () => void
  openTegnforklaring: () => void
  closeTegnforklaring: () => void
}

export const UIContext = createContext<UIState | undefined>(undefined)

export const useUIStore = () => {
  const context = useContext(UIContext)
  if (context === undefined) {
    throw new Error('useUIStore must be used within a UIProvider')
  }
  return context
}