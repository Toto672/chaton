import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyCloudEmail } from "./cloud";
import { type LanguageCode, LanguageSwitcher } from "./i18n";

export function CloudVerifyEmailPage({
  currentLanguage,
  onLanguageChange,
}: {
  currentLanguage: LanguageCode;
  onLanguageChange?: (code: LanguageCode) => void;
}) {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Missing verification token.");
      setPending(false);
      return;
    }
    void verifyCloudEmail({ token })
      .then(() => {
        setDone(true);
      })
      .catch((nextError) => {
        setError(nextError instanceof Error ? nextError.message : String(nextError));
      })
      .finally(() => {
        setPending(false);
      });
  }, [token]);

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
          <div className="eyebrow">Email verification</div>
          <h1 className="hero-title cloud-form-title">Confirm your email</h1>
          <p className="hero-subtitle">
            We use email verification to secure account recovery and desktop binding.
          </p>
          {pending ? <div className="cloud-inline-success">Verifying your email...</div> : null}
          {done ? <div className="cloud-inline-success">Your email is now verified.</div> : null}
          {error ? <div className="cloud-inline-error">{error}</div> : null}
          <div className="cloud-form">
            <Link className="cloud-primary-button" to="/cloud/login">
              Continue to login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
