import http from 'node:http'
import crypto from 'node:crypto'
import type {
  CloudAccountResponse,
  CloudConversationMessageRecord,
  CloudAdminListUsersResponse,
  CloudAdminUpdatePlanRequest,
  CloudAdminUpdateUserRequest,
  CloudBootstrapResponse,
  CloudDesktopAuthExchangeRequest,
  CloudDesktopAuthExchangeResponse,
  CreateCloudConversationRequest,
  CreateCloudConversationResponse,
  CreateCloudProjectRequest,
  CreateCloudProjectResponse,
  GetCloudConversationMessagesResponse,
  HealthResponse,
} from '../../packages/protocol/index.js'
import type {
  CloudRuntimeAccessGrant,
  CloudSubscriptionPlan,
  CloudSubscriptionRecord,
  CloudUsageRecord,
  CloudUserRecord,
} from '../../packages/domain/index.js'
import { createCloudStore, type CloudUserState } from './store.js'

const port = Number.parseInt(process.env.PORT ?? '4000', 10)
const version = process.env.CHATONS_CLOUD_VERSION ?? '0.1.0'
const publicBaseUrl = process.env.CHATONS_CLOUD_PUBLIC_URL ?? `http://127.0.0.1:${port}`
const desktopAuthRequestTtlSeconds = Number.parseInt(
  process.env.CHATONS_DESKTOP_AUTH_REQUEST_TTL_SECONDS ?? '300',
  10,
)
const maxJsonBodyBytes = Number.parseInt(
  process.env.CHATONS_CLOUD_MAX_JSON_BODY_BYTES ?? '1048576',
  10,
)
const internalServiceToken = process.env.CHATONS_INTERNAL_SERVICE_TOKEN?.trim() ?? ''

const store = createCloudStore({
  publicBaseUrl,
})

function getBearerToken(request: http.IncomingMessage): string | null {
  const header = request.headers.authorization
  if (!header) {
    return null
  }
  const [scheme, token] = header.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null
  }
  return token.trim()
}

function json(
  response: http.ServerResponse,
  statusCode: number,
  payload: unknown,
): void {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify(payload))
}

function html(response: http.ServerResponse, statusCode: number, markup: string): void {
  response.writeHead(statusCode, {
    'content-type': 'text/html; charset=utf-8',
  })
  response.end(markup)
}

async function readJsonBody<T>(request: http.IncomingMessage): Promise<T> {
  const chunks: Buffer[] = []
  let totalSize = 0
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    totalSize += buffer.length
    if (totalSize > maxJsonBodyBytes) {
      const error = new Error(`Request body exceeds ${maxJsonBodyBytes} bytes`)
      ;(error as Error & { statusCode?: number }).statusCode = 413
      throw error
    }
    chunks.push(buffer)
  }
  const text = Buffer.concat(chunks).toString('utf8')
  return JSON.parse(text) as T
}

function toCloudUserRecord(
  user: CloudUserState,
  plans: CloudSubscriptionRecord[],
): CloudUserRecord {
  const subscription =
    plans.find((plan) => plan.id === user.subscriptionPlan) ??
    plans.find((plan) => plan.isDefault) ?? {
      id: 'plus',
      label: 'Plus',
      parallelSessionsLimit: 3,
      isDefault: true,
    }

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt,
    subscription,
  }
}

async function buildUsage(user: CloudUserState): Promise<CloudUsageRecord> {
  const plans = await store.listPlans()
  const subscription =
    plans.find((plan) => plan.id === user.subscriptionPlan) ??
    plans.find((plan) => plan.isDefault) ??
    { id: 'plus', label: 'Plus', parallelSessionsLimit: 3 }
  const activeParallelSessions = await store.getActiveParallelSessions(user.id)
  return {
    activeParallelSessions,
    parallelSessionsLimit: subscription.parallelSessionsLimit,
    remainingParallelSessions: Math.max(
      0,
      subscription.parallelSessionsLimit - activeParallelSessions,
    ),
  }
}

async function buildBootstrapPayload(user: CloudUserState): Promise<CloudBootstrapResponse> {
  const workspace = await store.getWorkspaceState(user)
  const plans = await store.listPlans()
  const projects = Array.from(workspace.projectsById.values()).sort((left, right) =>
    left.name.localeCompare(right.name),
  )
  const conversations = Array.from(workspace.conversationsById.values()).sort((left, right) =>
    left.title.localeCompare(right.title),
  )

  return {
    user: toCloudUserRecord(user, plans),
    organizations: [workspace.organization],
    cloudInstances: [workspace.cloudInstance],
    projects,
    conversations,
    usage: await buildUsage(user),
  }
}

async function requireAuthedUser(
  request: http.IncomingMessage,
  response: http.ServerResponse,
): Promise<{ user: CloudUserState; accessToken: string } | null> {
  const accessToken = getBearerToken(request)
  if (!accessToken) {
    json(response, 401, {
      error: 'unauthorized',
      message: 'Missing bearer token',
    })
    return null
  }
  const user = await store.getUserByAccessToken(accessToken)
  if (!user) {
    json(response, 401, {
      error: 'unauthorized',
      message: 'Unknown bearer token',
    })
    return null
  }
  return { user, accessToken }
}

function requireInternalService(
  request: http.IncomingMessage,
  response: http.ServerResponse,
): boolean {
  if (!internalServiceToken) {
    json(response, 500, {
      error: 'misconfigured',
      message: 'Missing internal service token',
    })
    return false
  }
  if (getBearerToken(request) !== internalServiceToken) {
    json(response, 401, {
      error: 'unauthorized',
      message: 'Internal service token required',
    })
    return false
  }
  return true
}

async function requireSubscription(
  user: CloudUserState,
  response: http.ServerResponse,
): Promise<boolean> {
  if (user.subscriptionPlan) {
    return true
  }
  json(response, 403, {
    error: 'subscription_required',
    message: 'An active subscription is required to use Chatons Cloud.',
    usage: await buildUsage(user),
  })
  return false
}

function requireAdmin(
  user: CloudUserState,
  response: http.ServerResponse,
): boolean {
  if (user.isAdmin) {
    return true
  }
  json(response, 403, {
    error: 'forbidden',
    message: 'Admin access required.',
  })
  return false
}

async function handleRequest(
  request: http.IncomingMessage,
  response: http.ServerResponse,
): Promise<void> {
  const method = request.method ?? 'GET'
  const url = request.url ?? '/'

  if (method === 'GET' && url === '/healthz') {
    const payload: HealthResponse = {
      ok: true,
      service: 'cloud-api',
      version,
      timestamp: new Date().toISOString(),
    }
    json(response, 200, payload)
    return
  }

  if (method === 'GET' && url === '/readyz') {
    response.writeHead(204)
    response.end()
    return
  }

  if (method === 'GET' && url === '/v1/bootstrap') {
    const auth = await requireAuthedUser(request, response)
    if (!auth) {
      return
    }
    if (!(await requireSubscription(auth.user, response))) {
      return
    }
    json(response, 200, await buildBootstrapPayload(auth.user))
    return
  }

  if (method === 'GET' && url === '/v1/account') {
    const auth = await requireAuthedUser(request, response)
    if (!auth) {
      return
    }
    const plans = await store.listPlans()
    const payload: CloudAccountResponse = {
      user: toCloudUserRecord(auth.user, plans),
      usage: await buildUsage(auth.user),
      plans,
    }
    json(response, 200, payload)
    return
  }

  if (method === 'GET' && url === '/v1/admin/users') {
    const auth = await requireAuthedUser(request, response)
    if (!auth) {
      return
    }
    if (!requireAdmin(auth.user, response)) {
      return
    }
    const plans = await store.listPlans()
    const payload: CloudAdminListUsersResponse = {
      users: (await store.listUsers()).map((user) => toCloudUserRecord(user, plans)),
      plans,
    }
    json(response, 200, payload)
    return
  }

  if (method === 'PATCH' && url.startsWith('/v1/admin/plans/')) {
    const auth = await requireAuthedUser(request, response)
    if (!auth) {
      return
    }
    if (!requireAdmin(auth.user, response)) {
      return
    }

    const parsed = new URL(url, `http://127.0.0.1:${port}`)
    const planId = parsed.pathname.split('/').filter(Boolean)[3] as CloudSubscriptionPlan | undefined
    const plans = await store.listPlans()
    const target = planId ? plans.find((plan) => plan.id === planId) ?? null : null
    if (!target || !planId) {
      json(response, 404, {
        error: 'not_found',
        message: 'Plan not found',
      })
      return
    }

    const body = await readJsonBody<CloudAdminUpdatePlanRequest>(request)
    const next: CloudSubscriptionRecord = {
      ...target,
      label:
        typeof body.label === 'string' && body.label.trim()
          ? body.label.trim()
          : target.label,
      parallelSessionsLimit:
        typeof body.parallelSessionsLimit === 'number'
          ? Math.max(0, Math.floor(body.parallelSessionsLimit))
          : target.parallelSessionsLimit,
      isDefault: body.isDefault === true ? true : target.isDefault === true,
    }
    await store.savePlan(next)

    const refreshedPlans = await store.listPlans()
    const payload: CloudAdminListUsersResponse = {
      users: (await store.listUsers()).map((user) => toCloudUserRecord(user, refreshedPlans)),
      plans: refreshedPlans,
    }
    json(response, 200, payload)
    return
  }

  if (method === 'PATCH' && url.startsWith('/v1/admin/users/')) {
    const auth = await requireAuthedUser(request, response)
    if (!auth) {
      return
    }
    if (!requireAdmin(auth.user, response)) {
      return
    }

    const parsed = new URL(url, `http://127.0.0.1:${port}`)
    const userId = parsed.pathname.split('/').filter(Boolean)[3] ?? ''
    const body = await readJsonBody<CloudAdminUpdateUserRequest>(request)
    const plans = await store.listPlans()
    if (body.subscriptionPlan && !plans.some((plan) => plan.id === body.subscriptionPlan)) {
      json(response, 400, {
        error: 'invalid_request',
        message: 'Invalid subscription plan',
      })
      return
    }

    const updated = await store.updateUser(userId, {
      subscriptionPlan: body.subscriptionPlan,
      isAdmin: body.isAdmin,
    })
    if (!updated) {
      json(response, 404, {
        error: 'not_found',
        message: 'User not found',
      })
      return
    }

    const refreshedPlans = await store.listPlans()
    const payload: CloudAccountResponse = {
      user: toCloudUserRecord(updated, refreshedPlans),
      usage: await buildUsage(updated),
      plans: refreshedPlans,
    }
    json(response, 200, payload)
    return
  }

  if (method === 'GET' && url.startsWith('/desktop/auth')) {
    const parsed = new URL(url, `http://127.0.0.1:${port}`)
    const state = parsed.searchParams.get('state')?.trim() ?? ''
    const redirectUri =
      parsed.searchParams.get('redirect_uri')?.trim() ?? 'chatons://cloud/auth/callback'
    const baseUrl = parsed.searchParams.get('base_url')?.trim() ?? publicBaseUrl

    if (!state) {
      json(response, 400, {
        error: 'invalid_request',
        message: 'state is required',
      })
      return
    }

    const authCode = crypto.randomUUID()
    await store.createDesktopAuthRequest({
      state,
      redirectUri,
      baseUrl,
      authCode,
      expiresAt: new Date(Date.now() + desktopAuthRequestTtlSeconds * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      consumedAt: null,
    })

    const redirect = new URL(redirectUri)
    redirect.searchParams.set('code', authCode)
    redirect.searchParams.set('state', state)
    redirect.searchParams.set('base_url', baseUrl)

    html(
      response,
      200,
      `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Chatons Cloud Desktop Login</title>
    <meta http-equiv="refresh" content="0; url=${redirect.toString()}" />
  </head>
  <body>
    <p>Connecting Chatons Desktop...</p>
    <p>If nothing happens, <a href="${redirect.toString()}">return to Chatons Desktop</a>.</p>
  </body>
</html>`,
    )
    return
  }

  if (method === 'POST' && url === '/v1/cloud-instances') {
    json(response, 201, { ok: true })
    return
  }

  if (method === 'POST' && url === '/v1/auth/desktop/exchange') {
    const body = await readJsonBody<CloudDesktopAuthExchangeRequest>(request)
    if (!body.code || !body.state || !body.redirectUri) {
      json(response, 400, {
        error: 'invalid_request',
        message: 'code, state, and redirectUri are required',
      })
      return
    }

    const authRequest = await store.consumeDesktopAuthRequest({
      state: body.state,
      authCode: body.code,
      redirectUri: body.redirectUri,
    })
    if (!authRequest) {
      json(response, 400, {
        error: 'invalid_request',
        message: 'Invalid or expired desktop auth request',
      })
      return
    }

    const user = await store.ensureUserForDesktopAuth(body.code)
    const accessToken = `access-${crypto.randomUUID()}`
    const refreshToken = `refresh-${crypto.randomUUID()}`
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    await store.saveSession({
      userId: user.id,
      accessToken,
      refreshToken,
      expiresAt,
    })

    const plans = await store.listPlans()
    const payload: CloudDesktopAuthExchangeResponse = {
      user: toCloudUserRecord(user, plans),
      session: {
        accessToken,
        refreshToken,
        expiresAt,
      },
    }
    json(response, 200, payload)
    return
  }

  if (method === 'POST' && url === '/v1/projects') {
    const auth = await requireAuthedUser(request, response)
    if (!auth) {
      return
    }
    if (!(await requireSubscription(auth.user, response))) {
      return
    }

    const body = await readJsonBody<CreateCloudProjectRequest>(request)
    const workspace = await store.getWorkspaceState(auth.user)
    const trimmedName = body.name?.trim()
    if (!trimmedName) {
      json(response, 400, {
        error: 'invalid_request',
        message: 'Project name is required',
      })
      return
    }
    if (body.organizationId !== workspace.organization.id) {
      json(response, 400, {
        error: 'invalid_request',
        message: 'Unknown organization',
      })
      return
    }

    const project = await store.createProject(auth.user, {
      ...body,
      name: trimmedName,
    })
    const payload: CreateCloudProjectResponse = {
      project,
    }
    json(response, 201, payload)
    return
  }

  if (method === 'POST' && url === '/v1/conversations') {
    const auth = await requireAuthedUser(request, response)
    if (!auth) {
      return
    }
    if (!(await requireSubscription(auth.user, response))) {
      return
    }

    const body = await readJsonBody<CreateCloudConversationRequest>(request)
    const conversation = await store.createConversation(auth.user, body)
    if (!conversation) {
      json(response, 404, {
        error: 'not_found',
        message: 'Project not found',
      })
      return
    }

    const payload: CreateCloudConversationResponse = {
      conversation,
    }
    json(response, 201, payload)
    return
  }

  if (method === 'GET' && url.match(/^\/v1\/conversations\/[^/]+\/messages$/)) {
    const auth = await requireAuthedUser(request, response)
    if (!auth) {
      return
    }
    if (!(await requireSubscription(auth.user, response))) {
      return
    }

    const parsed = new URL(url, `http://127.0.0.1:${port}`)
    const conversationId = parsed.pathname.split('/').filter(Boolean)[2] ?? ''
    const messages = await store.getConversationMessages(auth.user, conversationId)
    if (messages === null) {
      json(response, 404, {
        error: 'not_found',
        message: 'Conversation not found',
      })
      return
    }

    const payload: GetCloudConversationMessagesResponse = {
      conversationId,
      messages,
    }
    json(response, 200, payload)
    return
  }

  if (method === 'POST' && url.match(/^\/v1\/conversations\/[^/]+\/messages$/)) {
    const auth = await requireAuthedUser(request, response)
    if (!auth) {
      return
    }
    if (!(await requireSubscription(auth.user, response))) {
      return
    }

    const parsed = new URL(url, `http://127.0.0.1:${port}`)
    const conversationId = parsed.pathname.split('/').filter(Boolean)[2] ?? ''
    const body = await readJsonBody<{ messages?: CloudConversationMessageRecord[] }>(request)
    const messages = await store.saveConversationMessages(
      auth.user,
      conversationId,
      Array.isArray(body.messages) ? body.messages : [],
    )
    if (messages === null) {
      json(response, 404, {
        error: 'not_found',
        message: 'Conversation not found',
      })
      return
    }

    const payload: GetCloudConversationMessagesResponse = {
      conversationId,
      messages,
    }
    json(response, 200, payload)
    return
  }

  if (method === 'POST' && url === '/v1/internal/runtime/access') {
    if (!requireInternalService(request, response)) {
      return
    }
    const body = await readJsonBody<{
      accessToken: string
      cloudInstanceId: string
      projectId?: string | null
      conversationId?: string | null
    }>(request)
    if (!body.accessToken || !body.cloudInstanceId) {
      json(response, 400, {
        error: 'invalid_request',
        message: 'accessToken and cloudInstanceId are required',
      })
      return
    }
    const grant = await store.authorizeAccess(body)
    if (!grant) {
      json(response, 404, {
        error: 'not_found',
        message: 'Cloud access grant not found',
      })
      return
    }
    json(response, 200, grant satisfies CloudRuntimeAccessGrant)
    return
  }

  if (method === 'POST' && url === '/v1/internal/realtime/access') {
    if (!requireInternalService(request, response)) {
      return
    }
    const body = await readJsonBody<{
      accessToken: string
      cloudInstanceId: string
    }>(request)
    if (!body.accessToken || !body.cloudInstanceId) {
      json(response, 400, {
        error: 'invalid_request',
        message: 'accessToken and cloudInstanceId are required',
      })
      return
    }
    const grant = await store.authorizeAccess(body)
    if (!grant) {
      json(response, 404, {
        error: 'not_found',
        message: 'Cloud access grant not found',
      })
      return
    }
    json(response, 200, {
      userId: grant.user.id,
      cloudInstanceId: grant.cloudInstance.id,
      organizationId: grant.organization.id,
    })
    return
  }

  json(response, 404, {
    error: 'not_found',
    message: `No route for ${method} ${url}`,
  })
}

const server = http.createServer((request, response) => {
  void handleRequest(request, response).catch((error) => {
    const statusCode =
      typeof (error as { statusCode?: unknown })?.statusCode === 'number'
        ? ((error as { statusCode: number }).statusCode)
        : 500
    json(response, statusCode, {
      error: statusCode >= 500 ? 'internal_error' : 'invalid_request',
      message: error instanceof Error ? error.message : String(error),
    })
  })
})

void store.init().catch((error) => {
  console.error('[cloud-api] failed to initialize store', error)
  process.exitCode = 1
})

server.listen(port, '0.0.0.0', () => {
  console.log(`cloud-api listening on :${port}`)
})
