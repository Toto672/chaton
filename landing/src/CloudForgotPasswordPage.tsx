import { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "./cloud";
import { type LanguageCode, LanguageSwitcher } from "./i18n";

export function CloudForgotPasswordPage({
  currentLanguage,
  onLanguageChange,
}: {
  currentLanguage: LanguageCode;
  onLanguageChange?: (code: LanguageCode) => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

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
          <div className="eyebrow">Password recovery</div>
          <h1 className="hero-title cloud-form-title">Reset your password</h1>
          <p className="hero-subtitle">
            Enter your email address and we will send you a reset link if the account exists.
          </p>
          <form
            className="cloud-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!email.trim()) {
                return;
              }
              setPending(true);
              setError("");
              void requestPasswordReset({ email })
                .then(() => setDone(true))
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
            {error ? <div className="cloud-inline-error">{error}</div> : null}
            {done ? (
              <div className="cloud-inline-success">
                If an account exists for this email, a reset link has been sent.
              </div>
            ) : null}
            <button className="cloud-primary-button" type="submit" disabled={pending}>
              {pending ? "Sending..." : "Send reset link"}
            </button>
            <Link className="cloud-text-link" to="/cloud/login">
              Back to login
            </Link>
          </form>
        </div>
      </main>
    </div>
  );
}
