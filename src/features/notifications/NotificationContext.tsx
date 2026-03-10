import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

export type Notification = {
  id: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  createdAt: number
  timeout?: number
}

export type NotificationContextType = {
  notifications: Notification[]
  addNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error', timeout?: number) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', timeout: number = 5000) => {
    const id = Date.now().toString()
    const newNotification = { id, message, type, createdAt: Date.now(), timeout }
    
    setNotifications((prev) => [...prev, newNotification])
    
    // Auto-remove after timeout
    if (timeout > 0) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
      }, timeout)
    }
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}