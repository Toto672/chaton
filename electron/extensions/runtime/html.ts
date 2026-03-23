import fs from 'node:fs'
import path from 'node:path'
import { BUILTIN_AUTOMATION_DIR, BUILTIN_AUTOMATION_ID, BUILTIN_BROWSER_DIR, BUILTIN_BROWSER_ID, BUILTIN_MEMORY_DIR, BUILTIN_MEMORY_ID, BUILTIN_TPS_MONITOR_DIR, BUILTIN_TPS_MONITOR_ID, EXTENSIONS_DIR } from './constants.js'
import { appendExtensionLog } from './logging.js'
import { getExtensionRootCandidates } from './manifest.js'
import { listExtensionManifests } from './registry.js'
import { ensureExtensionServerStarted } from './server.js'
import { EXTENSION_UI_BRIDGE_SCRIPT } from './ui-bridge.js'

export function getExtensionMainViewHtml(viewId: string): { ok: true; html: string; baseUrl: string } | { ok: false; message: string } {
  const manifests = listExtensionManifests()
  const match = manifests
    .flatMap((manifest) =>
      (manifest.ui?.mainViews ?? []).map((mainView) => ({
        extensionId: manifest.id,
        mainView,
      })),
    )
    .find((item) => item.mainView.viewId === viewId)

  if (!match) {
    appendExtensionLog('extensions-runtime', 'warn', 'main_view.lookup.failed', { viewId })
    return { ok: false, message: `main view not found: ${viewId}` }
  }

  appendExtensionLog(match.extensionId, 'info', 'main_view.lookup.ok', {
    viewId,
    webviewUrl: match.mainView.webviewUrl,
  })

  const webviewUrl = match.mainView.webviewUrl
  if (!webviewUrl.startsWith('chaton-extension://')) {
    return { ok: false, message: `unsupported webviewUrl: ${webviewUrl}` }
  }

  void ensureExtensionServerStarted(match.extensionId)

  const withoutScheme = webviewUrl.slice('chaton-extension://'.length)
  const expectedPrefix = `${match.extensionId}/`
  let relativePath = withoutScheme
  if (withoutScheme.startsWith(expectedPrefix)) {
    relativePath = withoutScheme.slice(expectedPrefix.length)
  }
  const extensionId = match.extensionId
  function getBuiltinDirForExtension(id: string): string | null {
    if (id === BUILTIN_AUTOMATION_ID) return BUILTIN_AUTOMATION_DIR
    if (id === BUILTIN_MEMORY_ID) return BUILTIN_MEMORY_DIR
    if (id === BUILTIN_BROWSER_ID) return BUILTIN_BROWSER_DIR
    if (id === BUILTIN_TPS_MONITOR_ID) return BUILTIN_TPS_MONITOR_DIR
    return null
  }

  const builtinDir = getBuiltinDirForExtension(extensionId)
  const rootsToTry = builtinDir
    ? [
        builtinDir,
        ...getExtensionRootCandidates(extensionId),
      ].filter((value, index, array): value is string => typeof value === 'string' && value.length > 0 && array.indexOf(value) === index)
    : getExtensionRootCandidates(extensionId)

  let targetPath: string | null = null
  for (const root of rootsToTry) {
    const candidate = path.resolve(root, relativePath)
    if (!candidate.startsWith(path.resolve(root))) {
      continue
    }
    if (fs.existsSync(candidate)) {
      targetPath = candidate
      break
    }
  }
  if (!targetPath) {
    const primaryRoot = rootsToTry[0] ?? path.join(EXTENSIONS_DIR, extensionId)
    appendExtensionLog(extensionId, 'warn', 'main_view.file.missing', {
      viewId,
      relativePath,
      rootsToTry,
      primaryRoot,
    })
    return { ok: false, message: `view file not found: ${path.resolve(primaryRoot, relativePath)}` }
  }

  appendExtensionLog(extensionId, 'info', 'main_view.file.resolved', {
    viewId,
    relativePath,
    targetPath,
    rootsToTry,
  })

  try {
    let html = fs.readFileSync(targetPath, 'utf8')
    const pathPart = relativePath
    const basePath = path.posix.dirname(`/${pathPart}`)
    const baseUrl = `chaton-extension://${encodeURIComponent(extensionId)}${basePath === '/' ? '/' : `${basePath}/`}`

    appendExtensionLog(extensionId, 'info', 'script_inlining.start', {
      targetPath,
      baseUrl,
    })

    // Inject UI bridge script
    const escapedBridge = EXTENSION_UI_BRIDGE_SCRIPT.replace(/<\/script/gi, '<\\/script')
    const baseTag = `<base href="${baseUrl}">`

    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head[^>]*>/i, (matchTag) => `${matchTag}\n${baseTag}\n<script>\n${escapedBridge}\n</script>`)
    } else {
      html = `${baseTag}\n<script>\n${escapedBridge}\n</script>\n${html}`
    }

    return { ok: true, html, baseUrl }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) }
  }
}
