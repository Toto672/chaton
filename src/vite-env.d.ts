/// <reference types="vite/client" />

declare global {
  interface Window {
    desktop?: {
      platform: string
      isWindowFocused: () => Promise<boolean>
      showNotification: (title: string, body: string, conversationId?: string) => Promise<boolean>
      onNotificationClick: (listener: (payload: { conversationId?: string }) => void) => () => void
    }
  }
}

export {}
