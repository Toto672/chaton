import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export interface CloudInstance {
  id: string
  name: string
  baseUrl: string
}

export interface CloudOrganizationOption {
  id: string
  name: string
  slug: string
}

export interface CreateCloudProjectModalProps {
  instances: CloudInstance[]
  organizations: CloudOrganizationOption[]
  activeOrganizationId?: string | null
  onConfirm: (data: {
    instanceId: string
    projectName: string
    organizationId: string
    kind: 'repository' | 'conversation_only'
    repository?: {
      cloneUrl: string
      defaultBranch: string | null
      authMode: 'none' | 'token'
      accessToken: string | null
    } | null
  }) => void
  onCancel: () => void
}

export function CreateCloudProjectModal({
  instances,
  organizations,
  activeOrganizationId = null,
  onConfirm,
  onCancel,
}: CreateCloudProjectModalProps) {
  const { t } = useTranslation()
  const [selectedInstanceIndex, setSelectedInstanceIndex] = useState(0)
  const [projectName, setProjectName] = useState('')
  const [organizationId, setOrganizationId] = useState(
    activeOrganizationId || organizations[0]?.id || '',
  )
  const [kind, setKind] = useState<'repository' | 'conversation_only'>('conversation_only')
  const [cloneUrl, setCloneUrl] = useState('')
  const [defaultBranch, setDefaultBranch] = useState('')
  const [authMode, setAuthMode] = useState<'none' | 'token'>('none')
  const [repoAccessToken, setRepoAccessToken] = useState('')
  const selectedOrganization = organizations.find((item) => item.id === organizationId) ?? null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectName.trim()) return
    if (!organizationId.trim()) return
    if (kind === 'repository' && !cloneUrl.trim()) return

    const selectedInstance = instances[selectedInstanceIndex]
    onConfirm({
      instanceId: selectedInstance.id,
      projectName: projectName.trim(),
      organizationId: organizationId.trim(),
      kind,
      repository:
        kind === 'repository'
          ? {
              cloneUrl: cloneUrl.trim(),
              defaultBranch: defaultBranch.trim() || null,
              authMode,
              accessToken: authMode === 'token' ? repoAccessToken.trim() || null : null,
            }
          : null,
    })
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-cloud-project-title"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h2 id="create-cloud-project-title" className="modal-title">
              {t('Créer un projet cloud')}
            </h2>
          </div>

          <div className="modal-content">
            {/* Instance Selection */}
            {instances.length > 1 && (
              <div className="form-group">
                <label htmlFor="instance-select" className="form-label">
                  {t('Instance cloud')}
                </label>
                <select
                  id="instance-select"
                  className="form-select"
                  value={selectedInstanceIndex}
                  onChange={(e) => {
                    setSelectedInstanceIndex(Number.parseInt(e.target.value, 10))
                  }}
                >
                  {instances.map((instance, index) => (
                    <option key={instance.id} value={index}>
                      {instance.name} ({instance.baseUrl})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Project Name */}
            <div className="form-group">
              <label htmlFor="project-name" className="form-label">
                {t('Nom du projet')} *
              </label>
              <input
                id="project-name"
                type="text"
                className="form-input"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder={t('Mon projet')}
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="project-kind" className="form-label">
                {t('Type de projet cloud')}
              </label>
              <select
                id="project-kind"
                className="form-select"
                value={kind}
                onChange={(e) => setKind(e.target.value as 'repository' | 'conversation_only')}
              >
                <option value="conversation_only">{t('Conversation uniquement')}</option>
                <option value="repository">{t('Depot Git distant')}</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="organization-id" className="form-label">
                {t("Organisation")}
              </label>
              <select
                id="organization-id"
                className="form-select"
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
              >
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
              <span className="form-hint">
                {selectedOrganization?.slug ?? t('Sélectionnez une organisation accessible')}
              </span>
            </div>

            {kind === 'repository' ? (
              <>
                <div className="form-group">
                  <label htmlFor="clone-url" className="form-label">
                    {t('URL HTTPS du depot')} *
                  </label>
                  <input
                    id="clone-url"
                    type="url"
                    className="form-input"
                    value={cloneUrl}
                    onChange={(e) => setCloneUrl(e.target.value)}
                    placeholder="https://github.com/org/repo.git"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="default-branch" className="form-label">
                    {t('Branche par defaut')}
                  </label>
                  <input
                    id="default-branch"
                    type="text"
                    className="form-input"
                    value={defaultBranch}
                    onChange={(e) => setDefaultBranch(e.target.value)}
                    placeholder="main"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="repo-auth-mode" className="form-label">
                    {t("Authentification du depot")}
                  </label>
                  <select
                    id="repo-auth-mode"
                    className="form-select"
                    value={authMode}
                    onChange={(e) => setAuthMode(e.target.value as 'none' | 'token')}
                  >
                    <option value="none">{t('Aucune')}</option>
                    <option value="token">{t('Token HTTPS')}</option>
                  </select>
                </div>

                {authMode === 'token' ? (
                  <div className="form-group">
                    <label htmlFor="repo-access-token" className="form-label">
                      {t("Token d'acces du depot")}
                    </label>
                    <input
                      id="repo-access-token"
                      type="password"
                      className="form-input"
                      value={repoAccessToken}
                      onChange={(e) => setRepoAccessToken(e.target.value)}
                      placeholder={t('Token optionnel pour cloner le depot')}
                    />
                  </div>
                ) : null}
              </>
            ) : null}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="modal-btn modal-btn-secondary"
              onClick={onCancel}
            >
              {t('Annuler')}
            </button>
            <button
              type="submit"
              className="modal-btn modal-btn-primary"
              disabled={!projectName.trim() || !organizationId.trim() || (kind === 'repository' && !cloneUrl.trim())}
            >
              {t('Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
