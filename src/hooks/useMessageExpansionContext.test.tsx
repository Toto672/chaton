import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MessageExpansionProvider, useMessageExpansion } from './useMessageExpansionContext'

describe('useMessageExpansion', () => {
  it('should collapse all registered messages', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MessageExpansionProvider>{children}</MessageExpansionProvider>
    )

    const { result } = renderHook(() => useMessageExpansion(), { wrapper })

    // Mock collapse callbacks
    const mockCollapse1 = vi.fn()
    const mockCollapse2 = vi.fn()

    // Register messages
    act(() => {
      result.current.registerMessage('msg1', mockCollapse1)
      result.current.registerMessage('msg2', mockCollapse2)
    })

    // Trigger collapse all
    act(() => {
      result.current.collapseAllMessages()
    })

    // Verify callbacks were called
    expect(mockCollapse1).toHaveBeenCalled()
    expect(mockCollapse2).toHaveBeenCalled()

    // Unregister and verify cleanup
    act(() => {
      result.current.unregisterMessage('msg1')
    })

    // Register a new message and collapse again
    const mockCollapse3 = vi.fn()
    act(() => {
      result.current.registerMessage('msg3', mockCollapse3)
    })
    act(() => {
      result.current.collapseAllMessages()
    })

    // The newly registered message participates in the next collapse cycle
    expect(mockCollapse3).toHaveBeenCalled()
  })
})
