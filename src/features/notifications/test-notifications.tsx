import { useNotifications } from './NotificationContext'
import { Button } from '@/components/ui/button'

export function TestNotifications() {
  const { addNotification, clearNotifications } = useNotifications()

  const testSuccess = () => {
    addNotification('This is a success notification!', 'success')
  }

  const testError = () => {
    addNotification('This is an error notification!', 'error')
  }

  const testWarning = () => {
    addNotification('This is a warning notification!', 'warning')
  }

  const testInfo = () => {
    addNotification('This is an info notification!', 'info')
  }

  const testClear = () => {
    clearNotifications()
  }

  return (
    <div style={{ padding: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      <Button onClick={testSuccess} variant="outline">
        Test Success Notification
      </Button>
      <Button onClick={testError} variant="outline">
        Test Error Notification
      </Button>
      <Button onClick={testWarning} variant="outline">
        Test Warning Notification
      </Button>
      <Button onClick={testInfo} variant="outline">
        Test Info Notification
      </Button>
      <Button onClick={testClear} variant="outline">
        Clear All Notifications
      </Button>
    </div>
  )
}