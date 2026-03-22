import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetCloudPassword } from "./cloud";
import { buildLocalizedPath, getCloudCopy, type LanguageCode } from "./i18n";
import { CloudAuthShell } from "./CloudLayout";

export function CloudResetPasswordPage({
  currentLanguage,
  onLanguageChange,
}: {
  currentLanguage: LanguageCode;
  onLanguageChange?: (code: LanguageCode) => void;
}) {
  const copy = getCloudCopy(currentLanguage);
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <CloudAuthShell
      currentLanguage={currentLanguage}
      onLanguageChange={onLanguageChange}
      form={
        <div className="cloud-form-shell">
          <div className="eyebrow">{copy.resetPassword.eyebrow}</div>
          <h1 className="hero-title cloud-form-title">{copy.resetPassword.title}</h1>
          <p className="hero-subtitle">{copy.resetPassword.subtitle}</p>
          <form
            className="cloud-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!token) {
                setError(copy.resetPassword.missingToken);
                return;
              }
              if (!password.trim() || password !== confirmPassword) {
                setError(copy.resetPassword.mismatch);
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
              <span>{copy.resetPassword.newPassword}</span>
              <input 
                id="reset-password"
                value={password} 
                onChange={(event) => setPassword(event.target.value)} 
                placeholder={copy.resetPassword.newPasswordPlaceholder} 
                type="password" 
                autoComplete="new-password"
                aria-label={copy.resetPassword.newPassword}
                aria-invalid={error ? "true" : "false"}
                aria-describedby={error ? "reset-error" : done ? "reset-success" : undefined}
              />
            </label>
            <label className="cloud-field">
              <span>{copy.resetPassword.confirmPassword}</span>
              <input 
                id="reset-confirm-password"
                value={confirmPassword} 
                onChange={(event) => setConfirmPassword(event.target.value)} 
                placeholder={copy.resetPassword.confirmPasswordPlaceholder} 
                type="password" 
                autoComplete="new-password"
                aria-label={copy.resetPassword.confirmPassword}
                aria-invalid={error ? "true" : "false"}
                aria-describedby={error ? "reset-error" : done ? "reset-success" : undefined}
              />
            </label>
            {error ? (
              <div 
                id="reset-error" 
                className="cloud-inline-error" 
                role="alert" 
                aria-live="polite"
              >
                {error}
              </div>
            ) : null}
            {done ? (
              <div 
                id="reset-success"
                className="cloud-inline-success"
                role="status"
                aria-live="polite"
              >
                {copy.resetPassword.success}
              </div>
            ) : null}
            <button 
              className="cloud-primary-button" 
              type="submit" 
              disabled={pending || done}
              aria-busy={pending}
            >
              {pending ? copy.resetPassword.pending : copy.resetPassword.submit}
            </button>
            <Link className="cloud-text-link" to={buildLocalizedPath(currentLanguage, "/cloud/login")}>
              {copy.resetPassword.backToLogin}
            </Link>
          </form>
        </div>
      }
    />
  );
}
