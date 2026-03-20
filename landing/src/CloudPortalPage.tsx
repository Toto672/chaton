import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Cloud,
  FolderKanban,
  KeyRound,
  Layers3,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users2,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCloudAccount, refreshCloudAccount } from "./cloud";
import { type LanguageCode, LanguageSwitcher } from "./i18n";

export function CloudPortalPage({
  currentLanguage,
  onLanguageChange,
}: {
  currentLanguage: LanguageCode;
  onLanguageChange?: (code: LanguageCode) => void;
}) {
  const [account, setAccount] = useState(() => getCloudAccount());

  useEffect(() => {
    void refreshCloudAccount()
      .then((next) => {
        setAccount(next);
      })
      .catch(() => {
        setAccount(getCloudAccount());
      });
  }, []);

  const org = account?.organizations[0] ?? null;

  const steps = useMemo(
    () => [
      {
        title: "Create your cloud account",
        body: "Provision a Chatons Cloud identity that your desktop app can bind to through browser auth.",
        done: Boolean(account),
        icon: Cloud,
      },
      {
        title: "Create your organization",
        body: "Define the workspace that owns projects, settings, provider access, quotas and collaboration policy.",
        done: Boolean(org),
        icon: ShieldCheck,
      },
      {
        title: "Connect providers",
        body: "Attach provider access at the organization layer so cloud projects never depend on local desktop secrets.",
        done: Boolean(org && org.providers.length > 0),
        icon: KeyRound,
      },
    ],
    [account, org],
  );

  const valueProps = [
    {
      title: "Settings that follow the workspace",
      body: "Cloud-backed state keeps project context, organization defaults and runtime access aligned across devices.",
      icon: RefreshCw,
    },
    {
      title: "Conversations that outlive the laptop",
      body: "Long investigations keep running remotely after a computer sleeps, closes or disconnects.",
      icon: Clock3,
    },
    {
      title: "One provider contract for the team",
      body: "Centralize premium model access at the organization layer and expose it cleanly through Chatons Cloud.",
      icon: WalletCards,
    },
  ] as const;

  const premiumFeatures = [
    {
      title: "Realtime shared projects",
      body: "Projects, threads and runtime state stay synchronized across devices, so teams work from the same live source of truth.",
      icon: FolderKanban,
      accent: "azure",
    },
    {
      title: "Persistent cloud execution",
      body: "Threads can keep running after the desktop closes, making the system feel dependable for serious ongoing work.",
      icon: Activity,
      accent: "amber",
    },
    {
      title: "Organization-owned provider access",
      body: "Secrets and subscriptions live in the cloud control plane, not in scattered local environments.",
      icon: ShieldCheck,
      accent: "emerald",
    },
    {
      title: "Centralized subscription economics",
      body: "Aggregate premium AI provider spend once and let the organization consume it under a single governed surface.",
      icon: Layers3,
      accent: "violet",
    },
    {
      title: "Collaborative conversations",
      body: "Multiple operators can inspect, resume and extend the same conversation without copying transcripts around.",
      icon: Users2,
      accent: "slate",
    },
    {
      title: "A premium desktop client",
      body: "Desktop Chatons becomes the polished interface to a durable cloud runtime rather than the only place the work can exist.",
      icon: Cloud,
      accent: "indigo",
    },
  ] as const;

  return (
    <div className="landing-page cloud-page">
      <div className="landing-grid" />
      <div className="landing-orb landing-orb-top" />
      <div className="landing-orb landing-orb-bottom" />

      <header className="site-header">
        <a className="brand" href="/">
          <span className="brand-mark">C</span>
          <span>Chatons Cloud</span>
        </a>
        <nav className="site-nav" aria-label="Primary">
          <Link to="/">Home</Link>
          <Link to="/cloud/signup">Sign up</Link>
          <Link to="/cloud/login">Log in</Link>
          <LanguageSwitcher currentLanguage={currentLanguage} onLanguageChange={onLanguageChange} />
        </nav>
      </header>

      <main className="site-main cloud-main">
        <section className="hero cloud-hero-premium">
          <motion.div
            className="hero-copy"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="eyebrow">
              <Sparkles size={14} />
              Premium cloud runtime for collaborative teams
            </div>
            <h1 className="hero-title">
              The durable operating layer behind modern Chatons workspaces.
            </h1>
            <p className="hero-subtitle">
              Chatons Cloud gives your team a shared control plane for projects,
              conversations, provider access and runtime execution, with a desktop
              experience that feels polished, synchronized and always current.
            </p>

            <div className="cloud-hero-actions">
              <Link className="cloud-primary-button cloud-button-wide" to={account ? "/cloud/onboarding" : "/cloud/signup"}>
                {account ? "Continue setup" : "Start with Chatons Cloud"}
                <ArrowRight size={15} />
              </Link>
              <Link className="cloud-secondary-button cloud-button-wide" to="/cloud/login">
                Open your existing workspace
              </Link>
            </div>

            <div className="cloud-value-strip">
              {valueProps.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="cloud-value-card">
                    <div className="cloud-value-icon">
                      <Icon size={18} />
                    </div>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            className="cloud-command-stage"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.06 }}
          >
            <div className="cloud-command-shell">
              <div className="cloud-command-topline">
                <span className="cloud-panel-chip">control plane</span>
                <span className="cloud-panel-chip is-muted">cloud.chatons.ai</span>
                <span className="cloud-panel-chip is-success">
                  {account ? "workspace connected" : "ready to provision"}
                </span>
              </div>

              <div className="cloud-command-grid">
                <div className="cloud-command-column">
                  <span className="cloud-command-label">Organization</span>
                  <strong>{org?.name ?? "Northstar Studio"}</strong>
                  <p>Projects, policies, providers and collaboration defaults under one governed surface.</p>
                </div>
                <div className="cloud-command-column">
                  <span className="cloud-command-label">Runtime</span>
                  <strong>Persistent cloud sessions</strong>
                  <p>Conversations continue on the server while desktops disconnect, sleep or move offline.</p>
                </div>
                <div className="cloud-command-column">
                  <span className="cloud-command-label">Team mode</span>
                  <strong>Shared project continuity</strong>
                  <p>Every device reconnects to the same live workspace instead of reconstructing local state.</p>
                </div>
              </div>

              <div className="cloud-command-board">
                <div className="cloud-command-panel">
                  <div className="cloud-command-panel-title">Provisioning checklist</div>
                  <div className="cloud-checklist">
                    {steps.map((step) => {
                      const Icon = step.icon;
                      return (
                        <div key={step.title} className={`cloud-checklist-item ${step.done ? "is-done" : ""}`}>
                          <div className="cloud-checklist-icon">
                            {step.done ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                          </div>
                          <div>
                            <strong>{step.title}</strong>
                            <p>{step.body}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="cloud-command-panel cloud-command-panel-metric">
                  <div className="cloud-metric-stack">
                    <div>
                      <span className="cloud-metric-label">Runtime continuity</span>
                      <strong>24/7 remote execution</strong>
                      <p>Long-running threads survive closed lids, reconnects and handoffs.</p>
                    </div>
                    <div>
                      <span className="cloud-metric-label">Desktop experience</span>
                      <strong>Synchronized premium client</strong>
                      <p>The desktop becomes a fast, elegant window into a durable cloud workspace.</p>
                    </div>
                    <div>
                      <span className="cloud-metric-label">Provider model</span>
                      <strong>Organization-owned access</strong>
                      <p>Use shared provider subscriptions without pushing secrets onto every local machine.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="cloud-story-section">
          <div className="section-header cloud-section-header-left">
            <div className="eyebrow">
              <Sparkles size={14} />
              Why subscribe to cloud
            </div>
            <h2>Built for organizations that want control, continuity and credibility.</h2>
            <p>
              The value is not just sync. It is the combination of centralized runtime execution,
              durable collaboration, organization-grade provider management and a desktop workflow
              that finally behaves like part of a serious shared system.
            </p>
          </div>

          <div className="cloud-premium-grid">
            {premiumFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.article
                  key={feature.title}
                  className={`cloud-premium-card accent-${feature.accent}`}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.35, delay: index * 0.04 }}
                >
                  <div className="cloud-premium-icon">
                    <Icon size={18} />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                </motion.article>
              );
            })}
          </div>
        </section>

        <section className="cloud-executive-band">
          <div className="cloud-executive-copy">
            <div className="eyebrow">
              <Sparkles size={14} />
              Premium positioning
            </div>
            <h2>From personal desktop use to organization-wide AI operations.</h2>
            <p>
              Start by centralizing providers and workspace state. Grow into shared projects,
              persistent execution, collaborative conversations and centrally managed access for the whole organization.
            </p>
          </div>
          <div className="cloud-executive-points">
            <div className="cloud-executive-point">
              <strong>Settings travel with the workspace</strong>
              <span>Cloud-backed workspace context follows the operator instead of being rebuilt on each machine.</span>
            </div>
            <div className="cloud-executive-point">
              <strong>Projects become shared assets</strong>
              <span>Teams inspect the same threads and resume the same work without manual exports or duplicated local state.</span>
            </div>
            <div className="cloud-executive-point">
              <strong>Provider access becomes strategic</strong>
              <span>Centralize premium provider subscriptions once and expose them through policy instead of personal setup.</span>
            </div>
          </div>
        </section>

        <section className="cloud-bottom-cta">
          <div className="cloud-bottom-cta-shell">
            <div>
              <div className="eyebrow">
                <Sparkles size={14} />
                Ready to provision
              </div>
              <h2>Put Chatons on top of a durable cloud workspace.</h2>
              <p>
                Create the organization, connect your providers once, and let every desktop attach to the same premium runtime environment.
              </p>
            </div>
            <div className="cloud-bottom-cta-actions">
              <Link className="cloud-primary-button cloud-button-wide" to={account ? "/cloud/onboarding" : "/cloud/signup"}>
                {account ? "Continue onboarding" : "Create your cloud account"}
                <ArrowRight size={15} />
              </Link>
              <Link className="cloud-secondary-button cloud-button-wide" to="/cloud/login">
                Sign in to existing workspace
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
