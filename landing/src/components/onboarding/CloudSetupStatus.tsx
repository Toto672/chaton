import React from "react";
import { SetupStatus, OrgInfo, UserInfo } from "../../shared/types";
import styles from "./CloudSetupStatus.module.css";

interface CloudSetupStatusProps {
  setupStatus: SetupStatus;
  orgInfo: OrgInfo | null;
  userInfo: UserInfo | null;
}

export function CloudSetupStatus({ setupStatus, orgInfo, userInfo }: CloudSetupStatusProps) {
  const items = [
    {
      key: "organization" as const,
      label: "Organization",
      icon: (
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 3.5A1.5 1.5 0 013.5 2h9A1.5 1.5 0 0114 3.5v9a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 12.5v-9zM3.5 3a.5.5 0 00-.5.5v9a.5.5 0 00.5.5h9a.5.5 0 00.5-.5v-9a.5.5 0 00-.5-.5h-9z" />
          <path d="M4 5.5h8v1H4v-1zM4 8.5h6v1H4v-1z" />
        </svg>
      ),
    },
    {
      key: "providers" as const,
      label: "AI Providers",
      icon: (
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M5.5 3.5A1.5 1.5 0 017 2h2a1.5 1.5 0 011.5 1.5V4h1v-.5A2.5 2.5 0 008.5 1H7a2.5 2.5 0 00-2.5 2.5V4H3.5v-.5A1.5 1.5 0 012 2h2a1.5 1.5 0 011.5 1.5V6H5V3.5z" />
          <path d="M2 8.5A1.5 1.5 0 013.5 7h2A1.5 1.5 0 017 8.5V9h1v-.5A2.5 2.5 0 005.5 6H3.5A2.5 2.5 0 001 8.5V9H2v-.5zM3 11.5v1A1.5 1.5 0 014.5 14h2a1.5 1.5 0 001.5-1.5v-1H9v.5A2.5 2.5 0 0111.5 15h-3A2.5 2.5 0 016 12.5v-.5H3zm7-1.5v1a.5.5 0 01-.5.5h-2a.5.5 0 01-.5-.5V10h1v.5a1.5 1.5 0 001.5 1.5h.5v-1.5h-.5z" />
          <circle cx="12.5" cy="4.5" r="1.5" />
        </svg>
      ),
    },
    {
      key: "desktop" as const,
      label: "Desktop App",
      icon: (
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M0 4a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H2a2 2 0 01-2-2V4zm2-1a1 1 0 00-1 1v8a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H2z" />
          <path d="M0 12.5a.5.5 0 01.5-.5h15a.5.5 0 010 1H.5a.5.5 0 01-.5-.5z" />
        </svg>
      ),
    },
  ];

  const completedCount = Object.values(setupStatus).filter((s) => s.status === "completed").length;
  const totalCount = items.length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Setup Progress</h3>
        <span className={styles.counter}>
          {completedCount}/{totalCount}
        </span>
      </div>

      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${(completedCount / totalCount) * 100}%` }}
        />
      </div>

      <ul className={styles.list}>
        {items.map((item, index) => {
          const status = setupStatus[item.key];
          const isCompleted = status.status === "completed";
          const isError = status.status === "error";
          const isActive = status.status === "active" || status.status === "loading";

          return (
            <li key={item.key} className={styles.item}>
              <div className={`${styles.itemIcon} ${isCompleted ? styles.completed : ""} ${isError ? styles.error : ""} ${isActive ? styles.active : ""}`}>
                {isCompleted ? (
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                  </svg>
                ) : isError ? (
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7.25 4.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 7a1 1 0 100-2 1 1 0 000 2z" />
                  </svg>
                ) : (
                  item.icon
                )}
              </div>
              <div className={styles.itemContent}>
                <span className={styles.itemLabel}>{item.label}</span>
                {isCompleted && status.details && (
                  <span className={styles.itemDetails}>{status.details}</span>
                )}
                {isError && <span className={styles.itemError}>Error occurred</span>}
              </div>
            </li>
          );
        })}
      </ul>

      {orgInfo && (
        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Workspace</span>
            <span className={styles.summaryValue}>{orgInfo.name}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>URL</span>
            <code className={styles.summaryUrl}>{orgInfo.slug}.chatons.cloud</code>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Plan</span>
            <span className={`${styles.summaryBadge} ${styles[`plan${orgInfo.plan.charAt(0).toUpperCase()}${orgInfo.plan.slice(1)}`]}`}>
              {orgInfo.plan}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
