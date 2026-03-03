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
import type {
  PiRendererEvent,
  RpcCommand,
  RpcExtensionUiResponse,
  RpcResponse,
} from '@/features/workspace/rpc'

type ImportProjectResult =
  | { ok: true; duplicate: boolean; project: Project }
  | { ok: false; reason: 'not_git_repo' | 'unknown' }

type PiModel = { id: string; provider: string; scoped: boolean; key: string }
type ListPiModelsResult =
  | { ok: true; models: PiModel[] }
  | { ok: false; reason: 'pi_not_available' | 'unknown'; message?: string }
type SetPiModelScopedResult =
  | { ok: true; models: PiModel[] }
  | { ok: false; reason: 'pi_not_available' | 'invalid_model' | 'unknown'; message?: string }
type PiCommandParams = { search?: string; source?: string; local?: boolean }

function getApi() {
  return window.dashboard
}

export const workspaceIpc = {
  getInitialState: () => getApi().getInitialState(),
  pickProjectFolder: () => getApi().pickProjectFolder(),
  importProjectFromFolder: (folderPath: string) => getApi().importProjectFromFolder(folderPath),
  updateSettings: (settings: SidebarSettings) => getApi().updateSettings(settings),
  createConversationForProject: (projectId: string): Promise<CreateConversationResult> =>
    getApi().createConversationForProject(projectId),
  deleteConversation: (conversationId: string): Promise<DeleteConversationResult> => getApi().deleteConversation(conversationId),
  getConversationMessageCache: (conversationId: string): Promise<unknown[]> => getApi().getConversationMessageCache(conversationId),
  listPiModels: (): Promise<ListPiModelsResult> => getApi().listPiModels(),
  syncPiModels: (): Promise<ListPiModelsResult> => getApi().syncPiModels(),
  setPiModelScoped: (provider: string, id: string, scoped: boolean): Promise<SetPiModelScopedResult> =>
    getApi().setPiModelScoped(provider, id, scoped),
  getPiConfigSnapshot: (): Promise<PiConfigSnapshot> => getApi().getPiConfigSnapshot(),
  updatePiSettingsJson: (next: Record<string, unknown>): Promise<{ ok: true } | { ok: false; message: string }> =>
    getApi().updatePiSettingsJson(next),
  updatePiModelsJson: (next: Record<string, unknown>): Promise<{ ok: true } | { ok: false; message: string }> =>
    getApi().updatePiModelsJson(next),
  runPiCommand: (action: PiCommandAction, params?: PiCommandParams): Promise<PiCommandResult> =>
    getApi().runPiCommand(action, params ?? {}),
  getPiDiagnostics: (): Promise<PiDiagnostics> => getApi().getPiDiagnostics(),
  openPath: (target: 'settings' | 'models' | 'sessions'): Promise<{ ok: boolean; message?: string }> => getApi().openPath(target),
  exportPiSessionHtml: (sessionFile: string, outputFile?: string): Promise<PiCommandResult> =>
    getApi().exportPiSessionHtml(sessionFile, outputFile),
  piStartSession: (conversationId: string): Promise<{ ok: true } | { ok: false; reason: string; message?: string }> =>
    getApi().piStartSession(conversationId),
  piStopSession: (conversationId: string): Promise<{ ok: true }> => getApi().piStopSession(conversationId),
  piSendCommand: (conversationId: string, command: RpcCommand): Promise<RpcResponse> =>
    getApi().piSendCommand(conversationId, command),
  piGetSnapshot: (conversationId: string) => getApi().piGetSnapshot(conversationId),
  piRespondExtensionUi: (
    conversationId: string,
    response: RpcExtensionUiResponse,
  ): Promise<{ ok: true } | { ok: false; reason: string }> => getApi().piRespondExtensionUi(conversationId, response),
  onPiEvent: (listener: (event: PiRendererEvent) => void): (() => void) => getApi().onPiEvent(listener),
}

export type { ImportProjectResult, WorkspacePayload }
