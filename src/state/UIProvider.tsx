import React, { useState, ReactNode } from 'react'
import { UIContext, UIState } from './uiStore'

interface UIProviderProps {
  children: ReactNode
}

export const UIProvider: React.FC<UIProviderProps> = ({ children }) => {
  const [isHurtigtasterOpen, setIsHurtigtasterOpen] = useState(false)
  const [isTegnforklaringOpen, setIsTegnforklaringOpen] = useState(false)

  const openHurtigtaster = () => {
    setIsHurtigtasterOpen(true)
    // Close other modals
    setIsTegnforklaringOpen(false)
  }

  const closeHurtigtaster = () => {
    setIsHurtigtasterOpen(false)
  }

  const openTegnforklaring = () => {
    setIsTegnforklaringOpen(true)
    // Close other modals
    setIsHurtigtasterOpen(false)
  }

  const closeTegnforklaring = () => {
    setIsTegnforklaringOpen(false)
  }

  const value: UIState = {
    isHurtigtasterOpen,
    isTegnforklaringOpen,
    openHurtigtaster,
    closeHurtigtaster,
    openTegnforklaring,
    closeTegnforklaring
  }

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}