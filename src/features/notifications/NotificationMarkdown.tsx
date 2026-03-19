import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ReactNode } from 'react'

export type NotificationMarkdownProps = {
  children: string
  className?: string
}

export function NotificationMarkdown({ children, className = '' }: NotificationMarkdownProps): ReactNode {
  return (
    <div className={`notification-markdown ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
