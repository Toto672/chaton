import { MemoryCloudStore } from './store/memory-store.js'
import { PostgresCloudStore } from './store/postgres-store.js'
import type { CloudStore, StoreContext } from './store/shared.js'

export { getEffectiveGrant, getEffectivePlanId } from './store/shared.js'
export type {
  CloudDesktopAuthRequestState,
  CloudRuntimeAccessGrant,
  CloudStore,
  CloudUserState,
  CloudWorkspaceState,
} from './store/shared.js'

export function createCloudStore(context: StoreContext): CloudStore {
  const databaseUrl = process.env.DATABASE_URL?.trim() ?? ''
  if (!databaseUrl) {
    return new MemoryCloudStore(context)
  }
  return new PostgresCloudStore(context, databaseUrl)
}
