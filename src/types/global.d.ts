import type {
  CreateConversationResult,
  DeleteConversationResult,
  PiCommandAction,
  PiCommandResult,
  PiConfigSnapshot,
  PiDiagnostics,
  Project,
  SidebarSettings,
  WorkspacePayload,
} from '@/features/workspace/types'
import type { PiRendererEvent, RpcCommand, RpcExtensionUiResponse, RpcResponse } from '@/features/workspace/rpc'

declare global {
  interface Window {
    dashboard: {
      platform: string
      pickProjectFolder: () => Promise<string | null>
      importProjectFromFolder: (
        folderPath: string,
      ) => Promise<{ ok: true; duplicate: boolean; project: Project } | { ok: false; reason: 'not_git_repo' | 'unknown' }>
      getInitialState: () => Promise<WorkspacePayload>
      updateSettings: (settings: SidebarSettings) => Promise<SidebarSettings>
      createConversationForProject: (projectId: string) => Promise<CreateConversationResult>
      deleteConversation: (conversationId: string) => Promise<DeleteConversationResult>
      getConversationMessageCache: (conversationId: string) => Promise<unknown[]>
      listPiModels: () => Promise<
        | { ok: true; models: Array<{ id: string; provider: string; scoped: boolean; key: string }> }
        | { ok: false; reason: 'pi_not_available' | 'unknown'; message?: string }
      >
      syncPiModels: () => Promise<
        | { ok: true; models: Array<{ id: string; provider: string; scoped: boolean; key: string }> }
        | { ok: false; reason: 'pi_not_available' | 'unknown'; message?: string }
      >
      setPiModelScoped: (
        provider: string,
        id: string,
        scoped: boolean,
      ) => Promise<
        | { ok: true; models: Array<{ id: string; provider: string; scoped: boolean; key: string }> }
        | { ok: false; reason: 'pi_not_available' | 'invalid_model' | 'unknown'; message?: string }
      >
      getPiConfigSnapshot: () => Promise<PiConfigSnapshot>
      updatePiSettingsJson: (next: Record<string, unknown>) => Promise<{ ok: true } | { ok: false; message: string }>
      updatePiModelsJson: (next: Record<string, unknown>) => Promise<{ ok: true } | { ok: false; message: string }>
      runPiCommand: (action: PiCommandAction, params?: { search?: string; source?: string; local?: boolean }) => Promise<PiCommandResult>
      getPiDiagnostics: () => Promise<PiDiagnostics>
      openPath: (target: 'settings' | 'models' | 'sessions') => Promise<{ ok: boolean; message?: string }>
      exportPiSessionHtml: (sessionFile: string, outputFile?: string) => Promise<PiCommandResult>
      piStartSession: (conversationId: string) => Promise<{ ok: true } | { ok: false; reason: string; message?: string }>
      piStopSession: (conversationId: string) => Promise<{ ok: true }>
      piSendCommand: (conversationId: string, command: RpcCommand) => Promise<RpcResponse>
      piGetSnapshot: (conversationId: string) => Promise<{ state: unknown; messages: unknown[]; status: string }>
      piRespondExtensionUi: (
        conversationId: string,
        response: RpcExtensionUiResponse,
      ) => Promise<{ ok: true } | { ok: false; reason: string }>
      onPiEvent: (listener: (event: PiRendererEvent) => void) => () => void
    }
  }
}

export {}
