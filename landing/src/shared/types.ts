// Shared types for Cloud onboarding and related pages

export interface SetupStatus {
  organization: SetupStep;
  providers: SetupStep;
  desktop: SetupStep;
}

export interface SetupStep {
  status: "pending" | "active" | "loading" | "completed" | "error";
  details?: string;
}

export interface OrgInfo {
  name: string;
  slug: string;
  plan: string;
}

export interface UserInfo {
  email: string;
  name?: string;
}

export interface PlanDetails {
  name: string;
  price: number;
  period: string;
  sessions: number;
  features: string[];
}

export interface ProviderConfig {
  id: string;
  name: string;
  apiKey?: string;
  status?: "connected" | "disconnected" | "error";
}

export interface CloudWorkspace {
  id: string;
  name: string;
  slug: string;
  plan: string;
  createdAt: string;
  ownerId: string;
}

export interface CloudSession {
  id: string;
  workspaceId: string;
  providerId: string;
  model: string;
  createdAt: string;
  status: "active" | "paused" | "ended";
}
