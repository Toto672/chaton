import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { useCloudPricingSeo } from "./seo";
import { buildLocalizedPath, getCloudCopy, type LanguageCode, LanguageSwitcher } from "./i18n";

export function CloudPricingPage({
  currentLanguage,
  onLanguageChange,
}: {
  currentLanguage: LanguageCode;
  onLanguageChange?: (code: LanguageCode) => void;
}) {
  useCloudPricingSeo();

  const [annual, setAnnual] = useState(true);
  const copy = getCloudCopy(currentLanguage);
  const homeHref = buildLocalizedPath(currentLanguage, "/");
  const pricingHref = buildLocalizedPath(currentLanguage, "/cloud/pricing");
  const portalHref = buildLocalizedPath(currentLanguage, "/cloud");
  const signupHref = buildLocalizedPath(currentLanguage, "/cloud/signup");

  return (
    <div className="landing-page cloud-page">
      <div className="landing-grid" />
      <div className="landing-orb landing-orb-top" />
      <div className="landing-orb landing-orb-bottom" />

      <header className="site-header">
        <nav className="site-nav" aria-label="Primary">
          <Link to={homeHref}>{copy.nav.home}</Link>
          <Link to={pricingHref}>{copy.nav.pricing}</Link>
          <Link to={signupHref}>{copy.nav.signUp}</Link>
          <LanguageSwitcher currentLanguage={currentLanguage} onLanguageChange={onLanguageChange} />
        </nav>
      </header>

      <main className="site-main cloud-main">
        <section className="hero hero-centered cloud-pricing-hero">
          <motion.div
            className="hero-copy hero-copy-centered cloud-pricing-hero-copy"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <span className="marketing-eyebrow">{copy.pricing.eyebrow}</span>
            <h1 className="hero-title">{copy.pricing.title}</h1>
            <p className="hero-subtitle">{copy.pricing.subtitle}</p>

            <div className="cloud-billing-toggle" role="tablist" aria-label={copy.pricing.compareLabel}>
              <button
                type="button"
                className={`cloud-toggle-button ${annual ? "" : "is-active"}`}
                onClick={() => setAnnual(false)}
              >
                {copy.pricing.monthlyLabel}
              </button>
              <button
                type="button"
                className={`cloud-toggle-button ${annual ? "is-active" : ""}`}
                onClick={() => setAnnual(true)}
              >
                {copy.pricing.annualLabel}
              </button>
              <span className="cloud-billing-note">{copy.pricing.annualNote}</span>
            </div>

            <div className="cloud-pricing-included">
              <span className="cloud-pricing-included-label">{copy.pricing.includedLabel}</span>
              <p>{copy.pricing.includedItemsIntro}</p>
              <div className="cloud-pricing-included-list">
                {copy.pricing.includedItems.map((item) => (
                  <span key={item} className="cloud-panel-chip is-muted">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        <section className="cloud-story-section">
          <div className="cloud-pricing-grid">
            {copy.pricing.plans.map((plan, index) => (
              <motion.article
                key={plan.name}
                className={`cloud-premium-card cloud-pricing-card ${plan.highlight ? "is-highlighted" : ""}`}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.35, delay: index * 0.08 }}
              >
                <div className="cloud-pricing-card-top">
                  <div>
                    <div className="cloud-pricing-plan-header">
                      <h3>{plan.name}</h3>
                      {plan.highlight ? <span className="cloud-pricing-badge">{plan.highlight}</span> : null}
                    </div>
                    <p className="cloud-pricing-audience">{plan.audience}</p>
                  </div>
                  <div className="cloud-pricing-price-block">
                    <div className="cloud-pricing-price">
                      <strong>{annual ? plan.annualPrice : plan.monthlyPrice}</strong>
                      <span>{copy.pricing.priceSuffix}</span>
                    </div>
                  </div>
                </div>

                <p className="cloud-pricing-summary">{plan.blurb}</p>

                <ul className="cloud-pricing-list">
                  {plan.bullets.map((bullet) => (
                    <li key={bullet}>
                      <Check size={16} />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>

                <Link className={`cloud-pricing-button ${plan.highlight ? "cloud-primary-button" : "cloud-secondary-button"}`} to={signupHref}>
                  {plan.cta}
                </Link>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="cloud-story-section">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.35 }}
          >
            <span className="marketing-eyebrow">{copy.pricing.compareLabel}</span>
            <h2>{copy.pricing.comparisonTitle}</h2>
            <p>{copy.pricing.comparisonSubtitle}</p>
          </motion.div>

          <motion.div
            className="cloud-pricing-table-shell"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.35 }}
          >
            <div className="cloud-pricing-table-head">
              <span />
              {copy.pricing.plans.map((plan) => (
                <strong key={plan.name}>{plan.name}</strong>
              ))}
            </div>
            {copy.pricing.comparisonRows.map((row) => (
              <div key={row.label} className="cloud-pricing-table-line">
                <span>{row.label}</span>
                {row.values.map((value) => (
                  <strong key={`${row.label}-${value}`}>{value}</strong>
                ))}
              </div>
            ))}
          </motion.div>
        </section>

        <section className="cloud-bottom-cta">
          <motion.div
            className="cloud-bottom-cta-shell"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.35 }}
          >
            <div>
              <span className="marketing-eyebrow">{copy.pricing.eyebrow}</span>
              <h2>{copy.pricing.ctaTitle}</h2>
              <p>{copy.pricing.ctaBody}</p>
            </div>
            <div className="cloud-bottom-cta-actions">
              <Link className="cloud-primary-button" to={signupHref}>
                {copy.pricing.ctaPrimary}
                <ArrowRight size={16} />
              </Link>
              <Link className="cloud-secondary-button" to={portalHref}>
                {copy.pricing.ctaSecondary}
              </Link>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
