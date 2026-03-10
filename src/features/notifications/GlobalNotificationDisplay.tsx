import { useNotifications } from './NotificationContext'
import { X, Check, AlertTriangle, Info, AlertCircle } from 'lucide-react'

export function GlobalNotificationDisplay() {
  const { notifications, removeNotification } = useNotifications()

  if (notifications.length === 0) {
    return null
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <Check className="h-4 w-4" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      case 'error':
        return <AlertCircle className="h-4 w-4" />
      case 'info':
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getNotificationClass = (type: string) => {
    switch (type) {
      case 'success':
        return 'notification-success'
      case 'warning':
        return 'notification-warning'
      case 'error':
        return 'notification-error'
      case 'info':
      default:
        return 'notification-info'
    }
  }

  return (
    <div className="global-notification-container">
      {notifications.map((notification) => (
        <div key={notification.id} className={`global-notification ${getNotificationClass(notification.type)}`}>
          <div className="notification-icon">
            {getIcon(notification.type)}
          </div>
          <div className="notification-content">
            {notification.message}
          </div>
          <button
            className="notification-close"
            onClick={() => removeNotification(notification.id)}
            aria-label="Close notification"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  )
}