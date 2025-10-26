import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HurtigtasterButton } from './HurtigtasterButton'

// Mock zustand store
vi.mock('../state/uiStore', () => ({
  useUIStore: () => ({
    openHurtigtaster: vi.fn()
  })
}))

describe('HurtigtasterButton', () => {
  it('renders the button', () => {
    render(<HurtigtasterButton />)

    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('can be clicked', () => {
    render(<HurtigtasterButton />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    // Button should be clickable
    expect(button).toBeInTheDocument()
  })
})
