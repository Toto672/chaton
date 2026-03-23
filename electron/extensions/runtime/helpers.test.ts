import { describe, expect, it } from 'vitest'
import { stripThinkingBlocks } from './helpers.js'

describe('stripThinkingBlocks', () => {
  it('removes leading think blocks and preserves the user-facing text', () => {
    const text = `<think>
The user asked me not to modify the code yet - they just wanted to know where and how to make the modification. I've provided a comprehensive analysis. Let me wait for their response to see if they want me to proceed with the implementation.
</think>

Let me know if you'd like me to proceed with the implementation, or if you need any clarification on the approach!`

    expect(stripThinkingBlocks(text)).toBe(
      "Let me know if you'd like me to proceed with the implementation, or if you need any clarification on the approach!",
    )
  })

  it('removes multiple thinking block formats and normalizes extra spacing', () => {
    const text = `Before

<thinking type="internal">
step one
</thinking>

Middle

<think>
step two
</think>

After`

    expect(stripThinkingBlocks(text)).toBe('Before\n\nMiddle\n\nAfter')
  })
})
