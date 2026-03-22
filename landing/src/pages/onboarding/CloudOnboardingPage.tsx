import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { SetupStatus, OrgInfo, UserInfo, PlanDetails } from "../../shared/types";
import { CloudSetupStatus } from "../../components/onboarding/CloudSetupStatus";
import styles from "./CloudOnboardingPage.module.css";

type OnboardingStep = "organization" | "providers" | "desktop";

interface ProviderConfig {
  id: string;
  name: string;
  apiKey?: string;
}

const PLAN_DETAILS: Record<string, PlanDetails> = {
  plus: {
    name: "Plus",
    price: 19,
    period: "month",
    sessions: 1,
    features: ["1 concurrent session", "Basic AI models", "Email support"],
  },
  pro: {
    name: "Pro",
    price: 49,
    period: "month",
    sessions: 3,
    features: ["3 concurrent sessions", "All AI models", "Priority support", "Analytics"],
  },
  max: {
    name: "Max",
    price: 149,
    period: "month",
    sessions: 10,
    features: ["10 concurrent sessions", "All AI models", "Dedicated support", "Advanced analytics", "Custom integrations"],
  },
};

const PROVIDER_OPTIONS = [
  { id: "openai", name: "OpenAI", description: "GPT-4o, o1, o3 models", color: "#10A37F" },
  { id: "anthropic", name: "Anthropic", description: "Claude 3.5, 3 models", color: "#CC785C" },
  { id: "google", name: "Google AI", description: "Gemini 1.5, 2.0 models", color: "#4285F4" },
  { id: "mistral", name: "Mistral", description: "Mistral Large, Small models", color: "#EB5F07" },
  { id: "groq", name: "Groq", description: "Fast inference, Llama models", color: "#8B5CF6" },
];

export function CloudOnboardingPage() {
  const navigate = useNavigate();

  const [setupStatus, setSetupStatus] = useState<SetupStatus>({
    organization: { status: "pending" },
    providers: { status: "pending" },
    desktop: { status: "pending" },
  });

  const [currentStep, setCurrentStep] = useState<OnboardingStep>("organization");
  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null);
  const [userInfo] = useState<UserInfo | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("pro");
  const [orgName, setOrgName] = useState("");
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [newProvider, setNewProvider] = useState<{ id: string; apiKey: string } | null>(null);

  const [isSavingOrg, setIsSavingOrg] = useState(false);
  const [isAddingProvider, setIsAddingProvider] = useState(false);
  const [orgSaveError, setOrgSaveError] = useState<string | null>(null);
  const [providerSaveError, setProviderSaveError] = useState<string | null>(null);

  const steps: { key: OnboardingStep; label: string; description: string }[] = [
    { key: "organization", label: "Organization", description: "Create your workspace" },
    { key: "providers", label: "AI Providers", description: "Connect your models" },
    { key: "desktop", label: "Desktop App", description: "Link your installation" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  // Auto-generate slug from org name
  useEffect(() => {
    if (!slugEdited && orgName) {
      const slug = orgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setWorkspaceSlug(slug);
    }
  }, [orgName, slugEdited]);

  const updateStatus = useCallback(
    (step: keyof SetupStatus, status: SetupStatus[keyof SetupStatus]["status"], details?: string) => {
      setSetupStatus((prev) => ({
        ...prev,
        [step]: { status, details },
      }));
    },
    []
  );

  const handleSaveOrganization = useCallback(async () => {
    if (!orgName.trim() || !workspaceSlug.trim()) {
      setOrgSaveError("Please fill in all required fields");
      return;
    }

    setIsSavingOrg(true);
    setOrgSaveError(null);
    updateStatus("organization", "loading");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setOrgInfo({
        name: orgName,
        slug: workspaceSlug,
        plan: selectedPlan,
      });

      updateStatus("organization", "completed", `${orgName} workspace created`);
      setSetupStatus((prev) => ({
        ...prev,
        organization: { status: "completed", details: `${orgName} workspace created` },
      }));

      // Move to next step
      setTimeout(() => {
        setCurrentStep("providers");
        updateStatus("providers", "active");
      }, 500);
    } catch (error) {
      setOrgSaveError("Failed to create organization. Please try again.");
      updateStatus("organization", "error");
    } finally {
      setIsSavingOrg(false);
    }
  }, [orgName, workspaceSlug, selectedPlan, updateStatus]);

  const handleAddProvider = useCallback(async () => {
    if (!newProvider?.apiKey.trim()) {
      setProviderSaveError("Please enter an API key");
      return;
    }

    setIsAddingProvider(true);
    setProviderSaveError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const providerConfig: ProviderConfig = {
        id: newProvider.id,
        name: PROVIDER_OPTIONS.find((p) => p.id === newProvider.id)?.name || newProvider.id,
        apiKey: newProvider.apiKey,
      };

      setProviders((prev) => [...prev.filter((p) => p.id !== newProvider.id), providerConfig]);
      setNewProvider(null);
      updateStatus("providers", providers.length >= 3 ? "completed" : "active");
    } catch (error) {
      setProviderSaveError("Failed to add provider. Please check your API key.");
    } finally {
      setIsAddingProvider(false);
    }
  }, [newProvider, providers.length, updateStatus]);

  const handleRemoveProvider = useCallback(
    (providerId: string) => {
      setProviders((prev) => prev.filter((p) => p.id !== providerId));
      updateStatus("providers", providers.length <= 1 ? "active" : "completed");
    },
    [providers.length, updateStatus]
  );

  const handleSkipProviders = useCallback(() => {
    updateStatus("providers", "completed", "Skipped - configure later in settings");
    setCurrentStep("desktop");
    updateStatus("desktop", "active");
  }, [updateStatus]);

  const handleOpenDesktopApp = useCallback(() => {
    // In production, this would open the desktop app via deep link
    window.location.href = "chatons://connect";
    updateStatus("desktop", "completed");
  }, [updateStatus]);

  const handleFinish = useCallback(() => {
    updateStatus("desktop", "completed");
    navigate({ to: "/cloud/dashboard" });
  }, [navigate, updateStatus]);

  const handleBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].key);
    }
  }, [currentStepIndex, steps]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logoSection}>
          <svg className={styles.logo} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" />
            <path d="M10 16C10 12.6863 12.6863 10 16 10C19.3137 10 22 12.6863 22 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="16" cy="20" r="2" fill="currentColor" />
          </svg>
          <span className={styles.logoText}>Chatons Cloud</span>
        </div>
      </header>

      <main className={styles.main}>
        {/* Progress Sidebar */}
        <aside className={styles.sidebar}>
          <CloudSetupStatus setupStatus={setupStatus} orgInfo={orgInfo} userInfo={userInfo} />
        </aside>

        {/* Step Content */}
        <div className={styles.content}>
          {/* Step Progress */}
          <div className={styles.stepProgress}>
            {steps.map((step, index) => (
              <React.Fragment key={step.key}>
                <div
                  className={`${styles.stepIndicator} ${
                    index < currentStepIndex
                      ? styles.completed
                      : index === currentStepIndex
                      ? styles.active
                      : ""
                  }`}
                >
                  <div className={styles.stepDot}>
                    {index < currentStepIndex ? (
                      <svg viewBox="0 0 16 16" fill="currentColor">
                        <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                      </svg>
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <div className={styles.stepInfo}>
                    <span className={styles.stepLabel}>{step.label}</span>
                    <span className={styles.stepDescription}>{step.description}</span>
                  </div>
                </div>
                {index < steps.length - 1 && <div className={`${styles.stepConnector} ${index < currentStepIndex ? styles.completed : ""}`} />}
              </React.Fragment>
            ))}
          </div>

          {/* Step Content Cards */}
          <div className={styles.stepContent}>
            {/* Organization Step */}
            {currentStep === "organization" && (
              <div className={styles.stepCard}>
                <div className={styles.stepHeader}>
                  <h2 className={styles.stepTitle}>Create your organization</h2>
                  <p className={styles.stepSubtitle}>
                    Set up your workspace to collaborate with your team and manage AI sessions
                  </p>
                </div>

                <div className={styles.form}>
                  <div className={styles.formGroup}>
                    <label htmlFor="orgName" className={styles.label}>
                      Organization name
                      <span className={styles.required}>*</span>
                    </label>
                    <input
                      id="orgName"
                      type="text"
                      className={styles.input}
                      placeholder="Acme Labs"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      autoFocus
                    />
                    <span className={styles.hint}>This is your organization's display name</span>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="workspaceSlug" className={styles.label}>
                      Workspace URL
                      <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.slugWrapper}>
                      <input
                        id="workspaceSlug"
                        type="text"
                        className={`${styles.input} ${styles.slugInput}`}
                        placeholder="acme-labs"
                        value={workspaceSlug}
                        onChange={(e) => {
                          setWorkspaceSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                          setSlugEdited(true);
                        }}
                      />
                      <span className={styles.slugSuffix}>.chatons.cloud</span>
                    </div>
                    <span className={styles.hint}>Your workspace will be accessible at this URL</span>
                  </div>
                </div>

                {/* Plan Selection */}
                <div className={styles.planSection}>
                  <h3 className={styles.planSectionTitle}>Choose your plan</h3>
                  <p className={styles.planSectionSubtitle}>Select the plan that best fits your team's needs</p>

                  <div className={styles.planGrid}>
                    {Object.entries(PLAN_DETAILS).map(([key, plan]) => (
                      <button
                        key={key}
                        type="button"
                        className={`${styles.planCard} ${selectedPlan === key ? styles.selected : ""}`}
                        onClick={() => setSelectedPlan(key)}
                      >
                        {key === "pro" && <span className={styles.planBadge}>Most Popular</span>}
                        <div className={styles.planHeader}>
                          <h4 className={styles.planName}>{plan.name}</h4>
                          <div className={styles.planPrice}>
                            <span className={styles.planAmount}>${plan.price}</span>
                            <span className={styles.planPeriod}>/{plan.period}</span>
                          </div>
                        </div>
                        <div className={styles.planSessions}>
                          <svg viewBox="0 0 16 16" fill="currentColor" className={styles.planIcon}>
                            <path d="M8 2a2 2 0 100 4 2 2 0 000-4zM5 7a3 3 0 116 0v1H5V7zM2 9.5C2 8.12 3.12 7 4.5 7h7C12.88 7 14 8.12 14 9.5v3c0 .69-.56 1.25-1.25 1.25h-7C5.56 14 5 13.44 5 12.75v-3.25z" />
                          </svg>
                          <span>{plan.sessions} concurrent session{plan.sessions > 1 ? "s" : ""}</span>
                        </div>
                        <ul className={styles.planFeatures}>
                          {plan.features.slice(0, 3).map((feature, i) => (
                            <li key={i} className={styles.planFeature}>
                              <svg viewBox="0 0 16 16" fill="currentColor" className={styles.checkIcon}>
                                <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                              </svg>
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <div className={`${styles.planSelectIndicator} ${selectedPlan === key ? styles.active : ""}`}>
                          {selectedPlan === key ? (
                            <svg viewBox="0 0 16 16" fill="currentColor">
                              <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                            </svg>
                          ) : (
                            <span>Select</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {orgSaveError && (
                  <div className={styles.errorBanner}>
                    <svg viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7.25 4.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 7a1 1 0 100-2 1 1 0 000 2z" />
                    </svg>
                    {orgSaveError}
                  </div>
                )}

                <div className={styles.stepActions}>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={handleSaveOrganization}
                    disabled={isSavingOrg || !orgName.trim() || !workspaceSlug.trim()}
                  >
                    {isSavingOrg ? (
                      <>
                        <span className={styles.spinner} />
                        Creating workspace...
                      </>
                    ) : (
                      <>
                        Create workspace
                        <svg viewBox="0 0 16 16" fill="currentColor" className={styles.buttonIcon}>
                          <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Providers Step */}
            {currentStep === "providers" && (
              <div className={styles.stepCard}>
                <div className={styles.stepHeader}>
                  <h2 className={styles.stepTitle}>Connect AI providers</h2>
                  <p className={styles.stepSubtitle}>
                    Add your API keys to enable AI model access in your sessions. You can skip this step and configure providers later.
                  </p>
                </div>

                {/* Connected Providers */}
                {providers.length > 0 && (
                  <div className={styles.connectedSection}>
                    <h3 className={styles.sectionTitle}>Connected providers</h3>
                    <div className={styles.providerList}>
                      {providers.map((provider) => {
                        const providerInfo = PROVIDER_OPTIONS.find((p) => p.id === provider.id);
                        return (
                          <div key={provider.id} className={styles.providerItem}>
                            <div className={styles.providerIcon} style={{ backgroundColor: providerInfo?.color }}>
                              {provider.name.charAt(0)}
                            </div>
                            <div className={styles.providerInfo}>
                              <span className={styles.providerName}>{provider.name}</span>
                              <span className={styles.providerStatus}>
                                <span className={styles.statusDot} />
                                Connected
                              </span>
                            </div>
                            <button
                              type="button"
                              className={styles.removeButton}
                              onClick={() => handleRemoveProvider(provider.id)}
                              aria-label={`Remove ${provider.name}`}
                            >
                              <svg viewBox="0 0 16 16" fill="currentColor">
                                <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
                              </svg>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Add Provider */}
                <div className={styles.addProviderSection}>
                  <h3 className={styles.sectionTitle}>
                    {providers.length > 0 ? "Add another provider" : "Add a provider"}
                  </h3>

                  <div className={styles.providerGrid}>
                    {PROVIDER_OPTIONS.filter((p) => !providers.find((cp) => cp.id === p.id)).map((provider) => (
                      <button
                        key={provider.id}
                        type="button"
                        className={`${styles.providerOption} ${newProvider?.id === provider.id ? styles.selected : ""}`}
                        onClick={() => setNewProvider({ id: provider.id, apiKey: "" })}
                      >
                        <div className={styles.providerIcon} style={{ backgroundColor: provider.color }}>
                          {provider.name.charAt(0)}
                        </div>
                        <div className={styles.providerInfo}>
                          <span className={styles.providerName}>{provider.name}</span>
                          <span className={styles.providerDescription}>{provider.description}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {newProvider && (
                    <div className={styles.apiKeyForm}>
                      <div className={styles.formGroup}>
                        <label htmlFor="apiKey" className={styles.label}>
                          API Key for {PROVIDER_OPTIONS.find((p) => p.id === newProvider.id)?.name}
                          <span className={styles.required}>*</span>
                        </label>
                        <input
                          id="apiKey"
                          type="password"
                          className={styles.input}
                          placeholder="sk-..."
                          value={newProvider.apiKey}
                          onChange={(e) => setNewProvider({ ...newProvider, apiKey: e.target.value })}
                          autoFocus
                        />
                        <span className={styles.hint}>
                          Get your API key from your{" "}
                          <a
                            href={`https://platform.${newProvider.id === "openai" ? "openai" : newProvider.id === "anthropic" ? "anthropic" : newProvider.id === "google" ? "google.com" : newProvider.id === "mistral" ? "mistral.ai" : "console.groq"}.com`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.link}
                          >
                            {newProvider.id} account
                          </a>
                        </span>
                      </div>

                      {providerSaveError && (
                        <div className={styles.errorBanner}>
                          <svg viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7.25 4.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 7a1 1 0 100-2 1 1 0 000 2z" />
                          </svg>
                          {providerSaveError}
                        </div>
                      )}

                      <div className={styles.apiKeyActions}>
                        <button
                          type="button"
                          className={styles.primaryButton}
                          onClick={handleAddProvider}
                          disabled={isAddingProvider || !newProvider.apiKey.trim()}
                        >
                          {isAddingProvider ? (
                            <>
                              <span className={styles.spinner} />
                              Connecting...
                            </>
                          ) : (
                            <>
                              Connect {PROVIDER_OPTIONS.find((p) => p.id === newProvider.id)?.name}
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={() => setNewProvider(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.stepActions}>
                  <button type="button" className={styles.secondaryButton} onClick={handleBack}>
                    <svg viewBox="0 0 16 16" fill="currentColor" className={styles.buttonIcon}>
                      <path d="M9.78 12.78a.75.75 0 01-1.06 0L4.47 8.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 1.06L6.06 8l3.72 3.72a.75.75 0 010 1.06z" />
                    </svg>
                    Back
                  </button>
                  <button type="button" className={styles.ghostButton} onClick={handleSkipProviders}>
                    Skip for now
                  </button>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => {
                      setCurrentStep("desktop");
                      updateStatus("desktop", "active");
                    }}
                  >
                    Continue
                    <svg viewBox="0 0 16 16" fill="currentColor" className={styles.buttonIcon}>
                      <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Desktop Step */}
            {currentStep === "desktop" && (
              <div className={styles.stepCard}>
                <div className={styles.stepHeader}>
                  <h2 className={styles.stepTitle}>Connect your desktop app</h2>
                  <p className={styles.stepSubtitle}>
                    Link your Chatons desktop installation to your cloud workspace to sync sessions and settings
                  </p>
                </div>

                <div className={styles.desktopInstructions}>
                  <div className={styles.instructionStep}>
                    <div className={styles.instructionNumber}>1</div>
                    <div className={styles.instructionContent}>
                      <h4 className={styles.instructionTitle}>Open Chatons desktop app</h4>
                      <p className={styles.instructionDescription}>
                        Make sure you have the latest version of Chatons installed on your computer
                      </p>
                    </div>
                  </div>

                  <div className={styles.instructionStep}>
                    <div className={styles.instructionNumber}>2</div>
                    <div className={styles.instructionContent}>
                      <h4 className={styles.instructionTitle}>Go to Settings</h4>
                      <p className={styles.instructionDescription}>
                        Navigate to Settings → Cloud → Connect to Cloud Workspace
                      </p>
                    </div>
                  </div>

                  <div className={styles.instructionStep}>
                    <div className={styles.instructionNumber}>3</div>
                    <div className={styles.instructionContent}>
                      <h4 className={styles.instructionTitle}>Enter your workspace URL</h4>
                      <div className={styles.workspaceUrlBox}>
                        <code className={styles.workspaceUrl}>{workspaceSlug || "your-workspace"}.chatons.cloud</code>
                        <button
                          type="button"
                          className={styles.copyButton}
                          onClick={() => navigator.clipboard.writeText(`${workspaceSlug || "your-workspace"}.chatons.cloud`)}
                        >
                          <svg viewBox="0 0 16 16" fill="currentColor">
                            <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z" />
                            <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z" />
                          </svg>
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={styles.instructionStep}>
                    <div className={styles.instructionNumber}>4</div>
                    <div className={styles.instructionContent}>
                      <h4 className={styles.instructionTitle}>Sign in</h4>
                      <p className={styles.instructionDescription}>
                        Authenticate with your account to complete the connection
                      </p>
                    </div>
                  </div>
                </div>

                <div className={styles.desktopOpenSection}>
                  <button
                    type="button"
                    className={styles.desktopOpenButton}
                    onClick={handleOpenDesktopApp}
                  >
                    <svg viewBox="0 0 16 16" fill="currentColor" className={styles.desktopIcon}>
                      <path d="M2.5 2.75a.25.25 0 01.25-.25h10.5a.25.25 0 01.25.25v10.5a.25.25 0 01-.25.25H2.75a.25.25 0 01-.25-.25V2.75zM1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v7.736a1.75 1.75 0 01-.438 1.168L12 13.289l-2.062-1.636a1.75 1.75 0 01-.438-1.168V2.75z" />
                    </svg>
                    Open Chatons Desktop
                  </button>
                  <span className={styles.desktopHint}>This will open the Chatons app on your computer</span>
                </div>

                <div className={styles.stepActions}>
                  <button type="button" className={styles.secondaryButton} onClick={handleBack}>
                    <svg viewBox="0 0 16 16" fill="currentColor" className={styles.buttonIcon}>
                      <path d="M9.78 12.78a.75.75 0 01-1.06 0L4.47 8.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 1.06L6.06 8l3.72 3.72a.75.75 0 010 1.06z" />
                    </svg>
                    Back
                  </button>
                  <button type="button" className={styles.primaryButton} onClick={handleFinish}>
                    Go to dashboard
                    <svg viewBox="0 0 16 16" fill="currentColor" className={styles.buttonIcon}>
                      <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
