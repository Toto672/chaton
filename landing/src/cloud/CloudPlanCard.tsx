import { Check } from "lucide-react";
import type { LanguageCode } from "../i18n";

export interface PlanOption {
  id: "plus" | "pro" | "max";
  label: string;
  detail: string;
  monthlyPrice: string;
  annualPrice: string;
  highlight?: string;
  audience: string;
  bullets: string[];
  cta: string;
}

interface CloudPlanCardProps {
  plan: PlanOption;
  isSelected: boolean;
  onSelect: () => void;
  billingCycle?: "monthly" | "annual";
  isHighlighted?: boolean;
}

export function CloudPlanCard({
  plan,
  isSelected,
  onSelect,
  billingCycle = "monthly",
  isHighlighted,
}: CloudPlanCardProps) {
  const price = billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice;

  return (
    <button
      type="button"
      className={`cloud-plan-card-v2 ${isSelected ? "is-selected" : ""} ${isHighlighted ? "is-highlighted" : ""}`}
      onClick={onSelect}
    >
      <div className="cloud-plan-card-v2-header">
        <div className="cloud-plan-card-v2-name-row">
          <span className="cloud-plan-card-v2-name">{plan.label}</span>
          {plan.highlight && (
            <span className="cloud-plan-card-v2-badge">{plan.highlight}</span>
          )}
        </div>
        <span className="cloud-plan-card-v2-audience">{plan.audience}</span>
      </div>

      <div className="cloud-plan-card-v2-price">
        <span className="cloud-plan-card-v2-price-value">{price}</span>
        <span className="cloud-plan-card-v2-price-cycle">/month</span>
        {billingCycle === "annual" && (
          <span className="cloud-plan-card-v2-billing-note">billed annually</span>
        )}
      </div>

      <p className="cloud-plan-card-v2-detail">{plan.detail}</p>

      <ul className="cloud-plan-card-v2-bullets">
        {plan.bullets.map((bullet, i) => (
          <li key={i}>
            <Check size={14} />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>

      {isSelected && (
        <div className="cloud-plan-card-v2-selected-indicator">
          <Check size={14} />
          <span>Selected</span>
        </div>
      )}
    </button>
  );
}

interface CloudPlanSelectorProps {
  plans: PlanOption[];
  selectedPlanId: "plus" | "pro" | "max";
  onSelect: (planId: "plus" | "pro" | "max") => void;
  billingCycle?: "monthly" | "annual";
}

export function CloudPlanSelector({
  plans,
  selectedPlanId,
  onSelect,
  billingCycle = "monthly",
}: CloudPlanSelectorProps) {
  return (
    <div className="cloud-plan-selector">
      {plans.map((plan) => (
        <CloudPlanCard
          key={plan.id}
          plan={plan}
          isSelected={selectedPlanId === plan.id}
          onSelect={() => onSelect(plan.id)}
          billingCycle={billingCycle}
          isHighlighted={plan.highlight === "Best value"}
        />
      ))}
    </div>
  );
}
