import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetCloudPassword } from "./cloud";
import { type LanguageCode, LanguageSwitcher } from "./i18n";

export function CloudResetPasswordPage({
  currentLanguage,
  onLanguageChange,
}: {
  currentLanguage: LanguageCode;
  onLanguageChange?: (code: LanguageCode) => void;
}) {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
          <div className="eyebrow">Set a new password</div>
          <h1 className="hero-title cloud-form-title">Choose a new password</h1>
          <p className="hero-subtitle">
            This link is single-use and expires automatically.
          </p>
          <form
            className="cloud-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!token) {
                setError("Missing reset token.");
                return;
              }
              if (!password.trim() || password !== confirmPassword) {
                setError("Passwords must match.");
                return;
              }
              setPending(true);
              setError("");
              void resetCloudPassword({ token, password })
                .then(() => setDone(true))
                .catch((nextError) => {
                  setError(nextError instanceof Error ? nextError.message : String(nextError));
                })
                .finally(() => setPending(false));
            }}
          >
            <label className="cloud-field">
              <span>New password</span>
              <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" type="password" />
            </label>
            <label className="cloud-field">
              <span>Confirm password</span>
              <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat password" type="password" />
            </label>
            {error ? <div className="cloud-inline-error">{error}</div> : null}
            {done ? (
              <div className="cloud-inline-success">
                Your password has been reset. You can now sign in again.
              </div>
            ) : null}
            <button className="cloud-primary-button" type="submit" disabled={pending || done}>
              {pending ? "Resetting..." : "Reset password"}
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
