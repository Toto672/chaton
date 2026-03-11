import { createContext, useContext } from 'react'

interface LinkSheetContextType {
  selectedLink: string | null
  setSelectedLink: (link: string | null) => void
}

export const LinkSheetContext = createContext<LinkSheetContextType | undefined>(undefined)

export const useLinkSheet = () => {
  const context = useContext(LinkSheetContext)
  if (!context) {
    throw new Error('useLinkSheet must be used within a LinkSheetProvider')
  }
  return context
}
