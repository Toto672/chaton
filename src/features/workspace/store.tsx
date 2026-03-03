import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react'

import { workspaceIpc } from '@/services/ipc/workspace'

import type {
  Conversation,
  DeleteConversationResult,
  PiCommandAction,
  PiCommandResult,
  PiConfigSnapshot,
  PiDiagnostics,
  PiModelsJson,
  PiSettingsJson,
  Project,
  SidebarSettings,
  WorkspaceState,
} from './types'
import type {
  JsonValue,
  PiConversationRuntime,
  PiRendererEvent,
  PiRuntimeStatus,
  RpcCommand,
  RpcExtensionUiResponse,
  RpcResponse,
  RpcSessionState,
} from './rpc'

type Action =
  | {
      type: 'hydrate'
      payload: Pick<WorkspaceState, 'projects' | 'conversations' | 'settings'>
    }
  | { type: 'selectProject'; payload: { projectId: string } }
  | { type: 'selectConversation'; payload: { conversationId: string } }
  | { type: 'startConversationDraft'; payload: { projectId: string } }
  | { type: 'toggleProjectCollapsed'; payload: { projectId: string } }
  | { type: 'setSearchQuery'; payload: { query: string } }
  | { type: 'updateSettings'; payload: SidebarSettings }
  | { type: 'addProject'; payload: { project: Project } }
  | { type: 'addConversation'; payload: { conversation: Conversation } }
  | { type: 'removeConversation'; payload: { conversationId: string } }
  | { type: 'setNotice'; payload: { notice: string | null } }
  | { type: 'setSidebarMode'; payload: { mode: 'default' | 'settings' } }
  | { type: 'setPiRuntime'; payload: { conversationId: string; runtime: Partial<PiConversationRuntime> } }
  | { type: 'setPiMessages'; payload: { conversationId: string; messages: JsonValue[] } }
  | { type: 'pushPiExtensionRequest'; payload: { conversationId: string; request: { id: string; method: string; payload: Record<string, JsonValue | undefined> } } }
  | { type: 'popPiExtensionRequest'; payload: { conversationId: string; id: string } }
  | { type: 'updateConversationModel'; payload: { conversationId: string; provider: string; modelId: string } }

const defaultSettings: SidebarSettings = {
  organizeBy: 'project',
  sortBy: 'updated',
  show: 'all',
  searchQuery: '',
  collapsedProjectIds: [],
}

const makePiRuntime = (): PiConversationRuntime => ({
  status: 'stopped',
  state: null,
  messages: [],
  pendingCommands: 0,
  lastError: null,
  extensionRequests: [],
  extensionStatus: {},
  extensionWidget: null,
  editorPrefill: null,
})

const initialState: WorkspaceState = {
  projects: [],
  conversations: [],
  selectedProjectId: null,
  selectedConversationId: null,
  sidebarMode: 'default',
  settings: defaultSettings,
  notice: null,
  piByConversation: {},
}

function ensureRuntimeMap(state: WorkspaceState, conversationId: string) {
  if (state.piByConversation[conversationId]) {
    return state.piByConversation
  }
  return {
    ...state.piByConversation,
    [conversationId]: makePiRuntime(),
  }
}

function reducer(state: WorkspaceState, action: Action): WorkspaceState {
  switch (action.type) {
    case 'hydrate': {
      const selectedProjectId = action.payload.projects[0]?.id ?? null
      const firstConversation = action.payload.conversations.find((c) => c.projectId === selectedProjectId)
      const piByConversation: Record<string, PiConversationRuntime> = {}
      for (const conversation of action.payload.conversations) {
        piByConversation[conversation.id] = makePiRuntime()
      }
      return {
        ...state,
        projects: action.payload.projects,
        conversations: action.payload.conversations,
        settings: action.payload.settings,
        selectedProjectId,
        selectedConversationId: firstConversation?.id ?? action.payload.conversations[0]?.id ?? null,
        piByConversation,
      }
    }
    case 'selectProject': {
      const firstConversation = state.conversations.find((conversation) => conversation.projectId === action.payload.projectId)
      return {
        ...state,
        selectedProjectId: action.payload.projectId,
        selectedConversationId: firstConversation?.id ?? state.selectedConversationId,
      }
    }
    case 'selectConversation': {
      const conversation = state.conversations.find((c) => c.id === action.payload.conversationId)
      return {
        ...state,
        selectedConversationId: action.payload.conversationId,
        selectedProjectId: conversation ? conversation.projectId : state.selectedProjectId,
      }
    }
    case 'startConversationDraft': {
      return {
        ...state,
        sidebarMode: 'default',
        selectedProjectId: action.payload.projectId,
        selectedConversationId: null,
      }
    }
    case 'setSidebarMode': {
      return {
        ...state,
        sidebarMode: action.payload.mode,
      }
    }
    case 'toggleProjectCollapsed': {
      const exists = state.settings.collapsedProjectIds.includes(action.payload.projectId)
      const collapsedProjectIds = exists
        ? state.settings.collapsedProjectIds.filter((id) => id !== action.payload.projectId)
        : [...state.settings.collapsedProjectIds, action.payload.projectId]

      return {
        ...state,
        settings: {
          ...state.settings,
          collapsedProjectIds,
        },
      }
    }
    case 'setSearchQuery': {
      return {
        ...state,
        settings: {
          ...state.settings,
          searchQuery: action.payload.query,
        },
      }
    }
    case 'updateSettings': {
      return {
        ...state,
        settings: action.payload,
      }
    }
    case 'addProject': {
      return {
        ...state,
        projects: [action.payload.project, ...state.projects],
        selectedProjectId: action.payload.project.id,
        settings: {
          ...state.settings,
          collapsedProjectIds: state.settings.collapsedProjectIds.filter((id) => id !== action.payload.project.id),
        },
      }
    }
    case 'addConversation': {
      return {
        ...state,
        conversations: [action.payload.conversation, ...state.conversations],
        selectedConversationId: action.payload.conversation.id,
        selectedProjectId: action.payload.conversation.projectId,
        piByConversation: {
          ...state.piByConversation,
          [action.payload.conversation.id]: makePiRuntime(),
        },
      }
    }
    case 'removeConversation': {
      const nextConversations = state.conversations.filter((conversation) => conversation.id !== action.payload.conversationId)
      const selectedConversationId = state.selectedConversationId === action.payload.conversationId ? null : state.selectedConversationId
      const selectedStillExists =
        selectedConversationId !== null && nextConversations.some((conversation) => conversation.id === selectedConversationId)
      const fallbackConversation = selectedStillExists
        ? nextConversations.find((conversation) => conversation.id === selectedConversationId) ?? null
        : nextConversations.find((conversation) => conversation.projectId === state.selectedProjectId) ?? nextConversations[0] ?? null

      const nextPiByConversation = { ...state.piByConversation }
      delete nextPiByConversation[action.payload.conversationId]

      return {
        ...state,
        conversations: nextConversations,
        selectedConversationId: fallbackConversation?.id ?? null,
        selectedProjectId: fallbackConversation?.projectId ?? state.selectedProjectId,
        piByConversation: nextPiByConversation,
      }
    }
    case 'setPiRuntime': {
      const piByConversation = ensureRuntimeMap(state, action.payload.conversationId)
      const current = piByConversation[action.payload.conversationId]
      return {
        ...state,
        piByConversation: {
          ...piByConversation,
          [action.payload.conversationId]: {
            ...current,
            ...action.payload.runtime,
          },
        },
      }
    }
    case 'setPiMessages': {
      const piByConversation = ensureRuntimeMap(state, action.payload.conversationId)
      const current = piByConversation[action.payload.conversationId]
      return {
        ...state,
        piByConversation: {
          ...piByConversation,
          [action.payload.conversationId]: {
            ...current,
            messages: action.payload.messages,
          },
        },
      }
    }
    case 'pushPiExtensionRequest': {
      const piByConversation = ensureRuntimeMap(state, action.payload.conversationId)
      const current = piByConversation[action.payload.conversationId]
      return {
        ...state,
        piByConversation: {
          ...piByConversation,
          [action.payload.conversationId]: {
            ...current,
            extensionRequests: [...current.extensionRequests, action.payload.request],
          },
        },
      }
    }
    case 'popPiExtensionRequest': {
      const piByConversation = ensureRuntimeMap(state, action.payload.conversationId)
      const current = piByConversation[action.payload.conversationId]
      return {
        ...state,
        piByConversation: {
          ...piByConversation,
          [action.payload.conversationId]: {
            ...current,
            extensionRequests: current.extensionRequests.filter((req) => req.id !== action.payload.id),
          },
        },
      }
    }
    case 'updateConversationModel': {
      return {
        ...state,
        conversations: state.conversations.map((conversation) =>
          conversation.id === action.payload.conversationId
            ? { ...conversation, modelProvider: action.payload.provider, modelId: action.payload.modelId }
            : conversation,
        ),
      }
    }
    case 'setNotice': {
      return {
        ...state,
        notice: action.payload.notice,
      }
    }
    default:
      return state
  }
}

type WorkspaceContextValue = {
  state: WorkspaceState
  isLoading: boolean
  openSettings: () => void
  closeSettings: () => void
  selectProject: (projectId: string) => void
  selectConversation: (conversationId: string) => void
  startConversationDraft: (projectId: string) => void
  toggleProjectCollapsed: (projectId: string) => void
  importProject: () => Promise<void>
  createConversationForProject: (projectId: string) => Promise<Conversation | null>
  deleteConversation: (conversationId: string) => Promise<DeleteConversationResult>
  updateSettings: (settings: SidebarSettings) => Promise<void>
  setSearchQuery: (query: string) => Promise<void>
  sendPiPrompt: (args: { conversationId: string; message: string; steer?: boolean }) => Promise<void>
  stopPi: (conversationId: string) => Promise<void>
  setPiModel: (conversationId: string, provider: string, modelId: string) => Promise<RpcResponse>
  setPiThinkingLevel: (conversationId: string, level: 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh') => Promise<RpcResponse>
  respondExtensionUi: (conversationId: string, response: RpcExtensionUiResponse) => Promise<void>
  getPiConfig: () => Promise<PiConfigSnapshot>
  savePiSettingsPatch: (next: PiSettingsJson) => Promise<{ ok: true } | { ok: false; message: string }>
  savePiModelsPatch: (next: PiModelsJson) => Promise<{ ok: true } | { ok: false; message: string }>
  runPiCommand: (action: PiCommandAction, params?: { search?: string; source?: string; local?: boolean }) => Promise<PiCommandResult>
  getPiDiagnostics: () => Promise<PiDiagnostics>
  openPiPath: (target: 'settings' | 'models' | 'sessions') => Promise<{ ok: boolean; message?: string }>
  exportPiSessionHtml: (sessionFile: string, outputFile?: string) => Promise<PiCommandResult>
  setNotice: (notice: string | null) => void
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

function mergeSnapshot(dispatch: React.Dispatch<Action>, conversationId: string, snapshot: { status: string; state: unknown; messages: unknown[] }) {
  dispatch({
    type: 'setPiRuntime',
    payload: {
      conversationId,
      runtime: {
        status: snapshot.status as PiConversationRuntime['status'],
        state: (snapshot.state as RpcSessionState | null) ?? null,
      },
    },
  })
  dispatch({ type: 'setPiMessages', payload: { conversationId, messages: (snapshot.messages as JsonValue[]) ?? [] } })
}

function applyPiEvent(dispatch: React.Dispatch<Action>, event: PiRendererEvent) {
  const conversationId = event.conversationId
  const payload = event.event

  if (payload.type === 'runtime_status') {
    const nextStatus = payload.status as PiRuntimeStatus
    const nextMessage = typeof payload.message === 'string' ? payload.message : 'Pi error'
    dispatch({
      type: 'setPiRuntime',
      payload: {
        conversationId,
        runtime: {
          status: nextStatus,
          lastError: nextStatus === 'error' ? nextMessage : null,
        },
      },
    })
    return
  }

  if (payload.type === 'runtime_error') {
    const runtimeError = typeof payload.message === 'string' ? payload.message : 'Pi runtime error'
    dispatch({
      type: 'setPiRuntime',
      payload: {
        conversationId,
        runtime: {
          status: 'error',
          lastError: runtimeError,
        },
      },
    })
    return
  }

  if (payload.type === 'response') {
    if (payload.command === 'get_state' && payload.success) {
      dispatch({
        type: 'setPiRuntime',
        payload: {
          conversationId,
          runtime: {
            state: payload.data as unknown as RpcSessionState,
          },
        },
      })
    }

    if (payload.command === 'get_messages' && payload.success) {
      const data = payload.data as { messages?: JsonValue[] }
      dispatch({
        type: 'setPiMessages',
        payload: {
          conversationId,
          messages: data?.messages ?? [],
        },
      })
    }

    if (!payload.success) {
      const errorMessage = typeof payload.error === 'string' ? payload.error : `Commande ${payload.command} échouée`
      dispatch({
        type: 'setPiRuntime',
        payload: {
          conversationId,
          runtime: {
            lastError: errorMessage,
          },
        },
      })
    }
    return
  }

  if (payload.type === 'message_update') {
    const message = payload.message as JsonValue
    if (message) {
      dispatch({
        type: 'setPiMessages',
        payload: {
          conversationId,
          messages: [
            ...(message ? [message] : []),
          ],
        },
      })
    }
  }

  if (payload.type === 'agent_end') {
    dispatch({
      type: 'setPiRuntime',
      payload: {
        conversationId,
        runtime: {
          status: 'ready',
          pendingCommands: 0,
        },
      },
    })
  }

  if (payload.type === 'extension_ui_request') {
    const method = typeof payload.method === 'string' ? payload.method : ''
    if (method === 'setStatus' || method === 'setWidget' || method === 'set_editor_text' || method === 'setTitle' || method === 'notify') {
      return
    }
    if (method !== 'select' && method !== 'confirm' && method !== 'input' && method !== 'editor') {
      return
    }

    dispatch({
      type: 'pushPiExtensionRequest',
      payload: {
        conversationId,
        request: {
          id: String(payload.id),
          method,
          payload,
        },
      },
    })
  }
}

export function WorkspaceProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    workspaceIpc
      .getInitialState()
      .then((payload) => {
        if (!mounted) {
          return
        }

        dispatch({ type: 'hydrate', payload })
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    const unsubscribe = workspaceIpc.onPiEvent((event) => {
      applyPiEvent(dispatch, event)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const persistSettings = useCallback(async (settings: SidebarSettings) => {
    const saved = await workspaceIpc.updateSettings(settings)
    dispatch({ type: 'updateSettings', payload: saved })
  }, [])

  const toggleProjectCollapsed = useCallback(
    async (projectId: string) => {
      const exists = state.settings.collapsedProjectIds.includes(projectId)
      const collapsedProjectIds = exists
        ? state.settings.collapsedProjectIds.filter((id) => id !== projectId)
        : [...state.settings.collapsedProjectIds, projectId]
      await persistSettings({ ...state.settings, collapsedProjectIds })
    },
    [persistSettings, state.settings],
  )

  const importProject = useCallback(async () => {
    const folderPath = await workspaceIpc.pickProjectFolder()
    if (!folderPath) {
      return
    }

    const result = await workspaceIpc.importProjectFromFolder(folderPath)
    if (!result.ok) {
      dispatch({
        type: 'setNotice',
        payload: { notice: 'Le dossier sélectionné n’est pas un repo Git.' },
      })
      return
    }

    dispatch({
      type: 'setNotice',
      payload: {
        notice: result.duplicate ? 'Projet déjà importé, sélection appliquée.' : 'Projet importé avec succès.',
      },
    })

    dispatch({ type: 'addProject', payload: { project: result.project } })
    dispatch({
      type: 'selectProject',
      payload: { projectId: result.project.id },
    })
  }, [])

  const hydrateConversationRuntime = useCallback(async (conversationId: string) => {
    const started = await workspaceIpc.piStartSession(conversationId)
    if (!started.ok) {
      dispatch({
        type: 'setPiRuntime',
        payload: {
          conversationId,
          runtime: {
            status: 'error',
            lastError: started.message ?? started.reason,
          },
        },
      })
      return
    }

    const snapshot = await workspaceIpc.piGetSnapshot(conversationId)
    mergeSnapshot(dispatch, conversationId, snapshot)
  }, [])

  const createConversationForProject = useCallback(
    async (projectId: string) => {
      const result = await workspaceIpc.createConversationForProject(projectId)
      if (!result.ok) {
        dispatch({
          type: 'setNotice',
          payload: { notice: 'Impossible de créer un fil pour ce projet.' },
        })
        return null
      }

      dispatch({
        type: 'addConversation',
        payload: { conversation: result.conversation },
      })
      await hydrateConversationRuntime(result.conversation.id)
      return result.conversation
    },
    [hydrateConversationRuntime],
  )

  const deleteConversation = useCallback(async (conversationId: string) => {
    await workspaceIpc.piStopSession(conversationId)
    const result = await workspaceIpc.deleteConversation(conversationId)
    if (!result.ok) {
      dispatch({
        type: 'setNotice',
        payload: { notice: 'Impossible de supprimer ce fil.' },
      })
      return result
    }

    dispatch({ type: 'removeConversation', payload: { conversationId } })
    dispatch({ type: 'setNotice', payload: { notice: null } })
    return result
  }, [])

  const sendPiCommand = useCallback(
    async (conversationId: string, command: RpcCommand) => {
      dispatch({
        type: 'setPiRuntime',
        payload: {
          conversationId,
          runtime: {
            pendingCommands: (state.piByConversation[conversationId]?.pendingCommands ?? 0) + 1,
          },
        },
      })

      const response = await workspaceIpc.piSendCommand(conversationId, command)

      dispatch({
        type: 'setPiRuntime',
        payload: {
          conversationId,
          runtime: {
            pendingCommands: Math.max((state.piByConversation[conversationId]?.pendingCommands ?? 1) - 1, 0),
          },
        },
      })

      if (!response.success) {
        dispatch({
          type: 'setPiRuntime',
          payload: {
            conversationId,
            runtime: {
              lastError: response.error ?? `Commande ${response.command} échouée`,
            },
          },
        })
      }

      return response
    },
    [state.piByConversation],
  )

  const sendPiPrompt = useCallback(
    async ({ conversationId, message, steer = false }: { conversationId: string; message: string; steer?: boolean }) => {
      const runtime = state.piByConversation[conversationId]
      if (!runtime) {
        await hydrateConversationRuntime(conversationId)
      }

      const effectiveRuntime = state.piByConversation[conversationId]
      const isStreaming = effectiveRuntime?.status === 'streaming' || effectiveRuntime?.state?.isStreaming

      if (steer && isStreaming) {
        await sendPiCommand(conversationId, { type: 'steer', message })
        return
      }

      if (isStreaming) {
        await sendPiCommand(conversationId, { type: 'follow_up', message })
        return
      }

      await sendPiCommand(conversationId, { type: 'prompt', message })
    },
    [hydrateConversationRuntime, sendPiCommand, state.piByConversation],
  )

  const stopPi = useCallback(async (conversationId: string) => {
    await sendPiCommand(conversationId, { type: 'abort' })
  }, [sendPiCommand])

  const setPiModel = useCallback(
    async (conversationId: string, provider: string, modelId: string) => {
      const response = await sendPiCommand(conversationId, { type: 'set_model', provider, modelId })
      if (response.success) {
        dispatch({ type: 'updateConversationModel', payload: { conversationId, provider, modelId } })
      }
      return response
    },
    [sendPiCommand],
  )

  const setPiThinkingLevel = useCallback(
    async (conversationId: string, level: 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh') => {
      return sendPiCommand(conversationId, { type: 'set_thinking_level', level })
    },
    [sendPiCommand],
  )

  const respondExtensionUi = useCallback(async (conversationId: string, response: RpcExtensionUiResponse) => {
    await workspaceIpc.piRespondExtensionUi(conversationId, response)
    dispatch({ type: 'popPiExtensionRequest', payload: { conversationId, id: response.id } })
  }, [])

  useEffect(() => {
    const conversationId = state.selectedConversationId
    if (!conversationId) {
      return
    }

    const runtime = state.piByConversation[conversationId]
    if (runtime?.status === 'ready' || runtime?.status === 'streaming') {
      return
    }

    void hydrateConversationRuntime(conversationId)
  }, [hydrateConversationRuntime, state.piByConversation, state.selectedConversationId])

  const value = useMemo(
    () => ({
      state,
      isLoading,
      openSettings: () => dispatch({ type: 'setSidebarMode', payload: { mode: 'settings' } }),
      closeSettings: () => dispatch({ type: 'setSidebarMode', payload: { mode: 'default' } }),
      selectProject: (projectId: string) => dispatch({ type: 'selectProject', payload: { projectId } }),
      selectConversation: async (conversationId: string) => {
        dispatch({ type: 'setSidebarMode', payload: { mode: 'default' } })
        dispatch({ type: 'selectConversation', payload: { conversationId } })
        const cached = await workspaceIpc.getConversationMessageCache(conversationId)
        if (cached.length > 0) {
          dispatch({ type: 'setPiMessages', payload: { conversationId, messages: cached as JsonValue[] } })
        }
        await hydrateConversationRuntime(conversationId)
      },
      startConversationDraft: (projectId: string) => dispatch({ type: 'startConversationDraft', payload: { projectId } }),
      toggleProjectCollapsed,
      importProject,
      createConversationForProject,
      deleteConversation,
      updateSettings: persistSettings,
      setSearchQuery: async (query: string) => {
        await persistSettings({ ...state.settings, searchQuery: query })
      },
      sendPiPrompt,
      stopPi,
      setPiModel,
      setPiThinkingLevel,
      respondExtensionUi,
      getPiConfig: () => workspaceIpc.getPiConfigSnapshot(),
      savePiSettingsPatch: (next: PiSettingsJson) => workspaceIpc.updatePiSettingsJson(next as Record<string, unknown>),
      savePiModelsPatch: (next: PiModelsJson) => workspaceIpc.updatePiModelsJson(next as Record<string, unknown>),
      runPiCommand: (action: PiCommandAction, params?: { search?: string; source?: string; local?: boolean }) =>
        workspaceIpc.runPiCommand(action, params),
      getPiDiagnostics: () => workspaceIpc.getPiDiagnostics(),
      openPiPath: (target: 'settings' | 'models' | 'sessions') => workspaceIpc.openPath(target),
      exportPiSessionHtml: (sessionFile: string, outputFile?: string) => workspaceIpc.exportPiSessionHtml(sessionFile, outputFile),
      setNotice: (notice: string | null) => dispatch({ type: 'setNotice', payload: { notice } }),
    }),
    [
      createConversationForProject,
      deleteConversation,
      hydrateConversationRuntime,
      importProject,
      isLoading,
      persistSettings,
      respondExtensionUi,
      sendPiPrompt,
      setPiModel,
      setPiThinkingLevel,
      state,
      stopPi,
      toggleProjectCollapsed,
    ],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider')
  }

  return context
}
