import type { ReactNode } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

export type StepStatus = "pending" | "active" | "completed" | "error";

export interface WizardStep {
  id: string;
  title: string;
  subtitle?: string;
  status: StepStatus;
  completedMessage?: string;
}

interface CloudStepWizardProps {
  steps: WizardStep[];
  currentStepId: string;
  onStepClick?: (stepId: string) => void;
  children: ReactNode;
}

export function CloudStepWizard({
  steps,
  currentStepId,
  onStepClick,
  children,
}: CloudStepWizardProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);

  return (
    <div className="cloud-step-wizard">
      <div className="cloud-step-progress">
        {steps.map((step, index) => {
          const isCompleted = step.status === "completed";
          const isActive = step.id === currentStepId;
          const isPast = index < currentIndex;
          const canClick = isCompleted || isPast;

          return (
            <div
              key={step.id}
              className={`cloud-step-progress-item ${isCompleted ? "is-completed" : ""} ${isActive ? "is-active" : ""} ${isPast ? "is-past" : ""}`}
            >
              <button
                type="button"
                className="cloud-step-progress-button"
                onClick={() => canClick && onStepClick?.(step.id)}
                disabled={!canClick && !isActive}
                aria-current={isActive ? "step" : undefined}
              >
                <div className="cloud-step-progress-dot">
                  {isCompleted ? <Check size={14} strokeWidth={3} /> : <span>{index + 1}</span>}
                </div>
                <div className="cloud-step-progress-info">
                  <span className="cloud-step-progress-label">{step.title}</span>
                  {step.subtitle && <span className="cloud-step-progress-subtitle">{step.subtitle}</span>}
                </div>
              </button>
              {index < steps.length - 1 && (
                <div className={`cloud-step-progress-connector ${isPast || isCompleted ? "is-filled" : ""}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="cloud-step-content">{children}</div>
    </div>
  );
}

interface CloudStepPanelProps {
  stepId: string;
  currentStepId: string;
  status: StepStatus;
  eyebrow: string;
  title: string;
  subtitle?: string;
  completedMessage?: string;
  children: ReactNode;
  onToggle?: () => void;
}

export function CloudStepPanel({
  stepId,
  currentStepId,
  status,
  eyebrow,
  title,
  subtitle,
  completedMessage,
  children,
  onToggle,
}: CloudStepPanelProps) {
  const isActive = stepId === currentStepId;
  const isCompleted = status === "completed";
  const canToggle = isCompleted && onToggle;

  return (
    <div
      className={`cloud-step-panel ${isActive ? "is-active" : ""} ${isCompleted ? "is-completed" : ""}`}
    >
      <button
        type="button"
        className="cloud-step-header"
        onClick={canToggle ? onToggle : undefined}
        disabled={!canToggle}
      >
        <div className="cloud-step-header-content">
          <div className="cloud-step-header-icon">
            {isCompleted ? <Check size={18} /> : <span>{stepId === "organization" ? "1" : stepId === "provider" ? "2" : "3"}</span>}
          </div>
          <div className="cloud-step-header-text">
            <span className="cloud-step-eyebrow">{eyebrow}</span>
            <h3 className="cloud-step-title">{title}</h3>
            {subtitle && !isActive && !isCompleted && (
              <p className="cloud-step-subtitle">{subtitle}</p>
            )}
          </div>
        </div>
        {canToggle && (
          <div className="cloud-step-header-action">
            {isActive ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        )}
        {isCompleted && !canToggle && !isActive && (
          <div className="cloud-step-header-badge">
            <Check size={14} />
            <span>Done</span>
          </div>
        )}
      </button>

      {(isActive || (isCompleted && !canToggle)) && (
        <div className="cloud-step-body">{children}</div>
      )}

      {isCompleted && completedMessage && !isActive && (
        <div className="cloud-step-completed-message">
          <Check size={16} />
          <span>{completedMessage}</span>
        </div>
      )}
    </div>
  );
}
