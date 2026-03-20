import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCloudAccount, loginCloudAccount } from "./cloud";
import { type LanguageCode, LanguageSwitcher } from "./i18n";

export function CloudLoginPage({
  currentLanguage,
  onLanguageChange,
}: {
  currentLanguage: LanguageCode;
  onLanguageChange?: (code: LanguageCode) => void;
}) {
  const navigate = useNavigate();
  const existing = getCloudAccount();
  const [email, setEmail] = useState(existing?.email ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

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
        <LanguageSwitcher currentLanguage={currentLanguage} onLanguageChange={onLanguageChange} />
      </header>
      <main className="site-main cloud-main cloud-main-narrow">
        <div className="cloud-form-shell">
          <div className="eyebrow">Log in</div>
          <h1 className="hero-title cloud-form-title">Return to your cloud workspace</h1>
          <p className="hero-subtitle">
            Sign back into your Chatons Cloud workspace and continue organization onboarding from the browser.
          </p>
          <form
            className="cloud-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!email.trim() || !password.trim()) {
                return;
              }
              setPending(true);
              setError("");
              void loginCloudAccount({ email, password })
                .then(() => navigate("/cloud/onboarding"))
                .catch((nextError) => {
                  setError(nextError instanceof Error ? nextError.message : String(nextError));
                })
                .finally(() => setPending(false));
            }}
          >
            <label className="cloud-field">
              <span>Email</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ada@team.dev" type="email" />
            </label>
            <label className="cloud-field">
              <span>Password</span>
              <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" type="password" />
            </label>
            {error ? <div className="cloud-inline-error">{error}</div> : null}
            <button className="cloud-primary-button" type="submit" disabled={pending}>
              {pending ? "Signing in..." : "Continue"}
            </button>
            <Link className="cloud-text-link" to="/cloud/forgot-password">
              Forgot your password?
            </Link>
          </form>
        </div>
      </main>
    </div>
  );
}
