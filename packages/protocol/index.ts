import type {
  CloudConnectionStatus,
  CloudConversationRecord,
  CloudProjectRecord,
  CloudInstanceRecord,
  OrganizationRecord,
} from '../domain/index.js'

export type EventEnvelope<TPayload> = {
  id: string
  type: string
  ts: string
  seq?: number
  organizationId?: string
  projectId?: string
  conversationId?: string
  payload: TPayload
}

export type CloudBootstrapResponse = {
  user: {
    id: string
    email: string
    displayName: string
  }
  organizations: OrganizationRecord[]
  cloudInstances: CloudInstanceRecord[]
  projects: CloudProjectRecord[]
  conversations: CloudConversationRecord[]
}

export type HealthResponse = {
  ok: true
  service: 'cloud-api' | 'cloud-realtime' | 'runtime-headless'
  version: string
  timestamp: string
}

export type ConnectInstanceRequest = {
  name: string
  baseUrl: string
}

export type CloudDesktopAuthExchangeRequest = {
  code: string
  state: string
  redirectUri: string
}

export type CloudDesktopAuthExchangeResponse = {
  user: {
    id: string
    email: string
    displayName: string
  }
  session: {
    accessToken: string
    refreshToken: string
    expiresAt: string
  }
}

export type RealtimeTokenResponse = {
  token: string
  expiresAt: string
  websocketUrl: string
}

export type RuntimeStatusPayload = {
  status: CloudConnectionStatus
  message?: string
}

export type CloudInstanceStatusPayload = {
  cloudInstanceId: string
  status: CloudConnectionStatus
  message?: string
}

export type ConversationChunkPayload = {
  chunk: string
}

export type RealtimeServerEvent =
  | EventEnvelope<{ project: CloudProjectRecord }>
  | EventEnvelope<{ conversation: CloudConversationRecord }>
  | EventEnvelope<RuntimeStatusPayload>
  | EventEnvelope<CloudInstanceStatusPayload>
  | EventEnvelope<ConversationChunkPayload>
