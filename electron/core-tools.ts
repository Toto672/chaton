/**
 * Core conversation tools: task lists, sub-agents, action suggestions,
 * access mode, and runtime commands.
 *
 * These are first-class Pi tools registered directly on every session,
 * not routed through the extension system.
 */

import { Type } from "@sinclair/typebox";
import type { ToolDefinition } from "@mariozechner/pi-coding-agent";
import { getDb } from "./db/index.js";
import { findConversationById } from "./db/repos/conversations.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type EmitUiRequest = (
  method: string,
  payload: Record<string, unknown>,
) => string;

function textResult(data: unknown) {
  return {
    content: [
      { type: "text" as const, text: JSON.stringify(data, null, 2) },
    ],
    details: { ok: true, data },
  };
}

function errorResult(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    details: { ok: false, error: message },
    isError: true,
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Build the set of core tools for a single Pi session.
 *
 * @param conversationId - the owning conversation
 * @param emitUiRequest  - bound reference to PiSdkRuntime.emitExtensionUiRequest
 */
export function createCoreTools(
  conversationId: string,
  emitUiRequest: EmitUiRequest,
): ToolDefinition[] {
  // ---- create_task_list ----
  const createTaskList: ToolDefinition = {
    name: "create_task_list",
    label: "Create task list",
    description:
      "Create a task list displayed in the side panel to break down complex work into visible steps. Each task starts as pending. The panel opens automatically.",
    parameters: Type.Object({
      title: Type.String({
        description:
          'Title of the task list (e.g. "Implementing authentication")',
      }),
      tasks: Type.Array(
        Type.Object({
          title: Type.String({
            description: "Short actionable title for the task",
          }),
        }),
        { minItems: 1, description: "List of tasks to display" },
      ),
    }),
    execute: async (
      _toolCallId: string,
      params: { title: string; tasks: { title: string }[] },
    ) => {
      const title = (params.title ?? "").trim();
      const rawTasks = Array.isArray(params.tasks) ? params.tasks : [];

      if (!title) return errorResult("title is required");
      if (rawTasks.length === 0)
        return errorResult("at least one task is required");

      const now = Date.now();
      const taskListId = `task-list-${now}`;
      const tasks = rawTasks
        .filter(
          (t): t is { title: string } =>
            !!t && typeof t === "object" && typeof t.title === "string",
        )
        .map((t, i) => ({
          id: `${taskListId}-task-${i}`,
          title: t.title.trim(),
          status: "pending" as const,
          order: i,
        }))
        .filter((t) => t.title.length > 0);

      if (tasks.length === 0)
        return errorResult(
          "at least one valid task with a title is required",
        );

      const taskList = {
        id: taskListId,
        title,
        tasks,
        createdAt: new Date(now).toISOString(),
      };

      emitUiRequest("set_task_list", { taskList, conversationId });

      return textResult(taskList);
    },
  };

  // ---- update_task_status ----
  const updateTaskStatus: ToolDefinition = {
    name: "update_task_status",
    label: "Update task status",
    description:
      "Update the status of a task in the side panel task list. Call this as you start or finish each task.",
    parameters: Type.Object({
      taskId: Type.String({
        description:
          "The ID of the task to update (returned by create_task_list)",
      }),
      status: Type.Union(
        [
          Type.Literal("in-progress"),
          Type.Literal("completed"),
          Type.Literal("error"),
        ],
        { description: "New status for the task" },
      ),
      errorMessage: Type.Optional(
        Type.String({
          description: "Error description when status is error",
        }),
      ),
    }),
    execute: async (
      _toolCallId: string,
      params: { taskId: string; status: string; errorMessage?: string },
    ) => {
      const taskId = (params.taskId ?? "").trim();
      const status = (params.status ?? "").trim();
      const errorMessage =
        typeof params.errorMessage === "string"
          ? params.errorMessage.trim()
          : undefined;

      if (!taskId) return errorResult("taskId is required");
      if (
        !["pending", "in-progress", "completed", "error"].includes(status)
      )
        return errorResult(
          "status must be one of: pending, in-progress, completed, error",
        );

      emitUiRequest("update_task_status", {
        taskId,
        status,
        errorMessage,
        conversationId,
      });

      return textResult({ taskId, status });
    },
  };

  // ---- display_action_suggestions ----
  const displayActionSuggestions: ToolDefinition = {
    name: "display_action_suggestions",
    label: "Display action suggestions",
    description:
      "Display a choice menu of action badges in the composer for the user to click. Useful for guiding users through decisions without requiring typed input.",
    parameters: Type.Object({
      suggestions: Type.Array(
        Type.Object({
          label: Type.String({
            description: "Short button text (recommended max 30 chars)",
            maxLength: 50,
          }),
          message: Type.String({
            description:
              "The message to send when user clicks this action",
          }),
          id: Type.Optional(
            Type.String({
              description:
                "Optional unique ID for this suggestion (auto-generated if omitted)",
            }),
          ),
        }),
        {
          minItems: 1,
          maxItems: 4,
          description:
            "Array of action suggestions to display (max 4 for UI fit)",
        },
      ),
    }),
    execute: async (
      _toolCallId: string,
      params: {
        suggestions: {
          label: string;
          message: string;
          id?: string;
        }[];
      },
    ) => {
      const suggestions = Array.isArray(params.suggestions)
        ? params.suggestions
        : [];

      const validated = suggestions
        .filter(
          (s): s is { label: string; message: string; id?: string } =>
            !!s && typeof s === "object" && !Array.isArray(s),
        )
        .slice(0, 4)
        .map((s, i) => ({
          id:
            typeof s.id === "string" && s.id.trim()
              ? s.id.trim()
              : `action_${i}`,
          label:
            typeof s.label === "string"
              ? s.label.trim().slice(0, 50)
              : `Option ${i + 1}`,
          message:
            typeof s.message === "string" ? s.message.trim() : "",
        }))
        .filter((s) => s.label.length > 0 && s.message.length > 0);

      if (validated.length === 0)
        return errorResult(
          "at least one valid suggestion with label and message is required",
        );

      emitUiRequest("set_thread_actions", { actions: validated });

      return textResult({
        count: validated.length,
        suggestions: validated,
      });
    },
  };

  // ---- register_subagent ----
  const registerSubagent: ToolDefinition = {
    name: "register_subagent",
    label: "Register subagent",
    description:
      "Register a subagent in the side panel so the conversation can track delegated work in a dedicated section.",
    parameters: Type.Object({
      subAgentId: Type.String({
        description: "Unique identifier for the subagent",
      }),
      label: Type.String({
        description: "Short human-readable subagent label",
      }),
      description: Type.Optional(
        Type.String({
          description:
            "Optional short description of the delegated work",
        }),
      ),
    }),
    execute: async (
      _toolCallId: string,
      params: {
        subAgentId: string;
        label: string;
        description?: string;
      },
    ) => {
      const subAgentId = (params.subAgentId ?? "").trim();
      const label = (params.label ?? "").trim();
      const description =
        typeof params.description === "string"
          ? params.description.trim()
          : undefined;

      if (!subAgentId) return errorResult("subAgentId is required");
      if (!label) return errorResult("label is required");

      emitUiRequest("register_subagent", {
        subAgent: {
          id: subAgentId,
          name: label,
          description,
          status: "pending",
          taskList: null,
          previousTaskLists: [],
          createdAt: new Date().toISOString(),
        },
        conversationId,
      });

      return textResult({
        subAgentId,
        label,
        status: "pending",
        description: description ?? null,
      });
    },
  };

  // ---- update_subagent_status ----
  const updateSubagentStatus: ToolDefinition = {
    name: "update_subagent_status",
    label: "Update subagent status",
    description:
      "Update a registered subagent status in the side panel.",
    parameters: Type.Object({
      subAgentId: Type.String({
        description: "The registered subagent identifier",
      }),
      status: Type.Union(
        [
          Type.Literal("pending"),
          Type.Literal("running"),
          Type.Literal("completed"),
          Type.Literal("error"),
        ],
        { description: "New subagent status" },
      ),
      errorMessage: Type.Optional(
        Type.String({
          description: "Optional error details when status is error",
        }),
      ),
    }),
    execute: async (
      _toolCallId: string,
      params: {
        subAgentId: string;
        status: string;
        errorMessage?: string;
      },
    ) => {
      const subAgentId = (params.subAgentId ?? "").trim();
      const status = (params.status ?? "").trim();
      const errorMessage =
        typeof params.errorMessage === "string"
          ? params.errorMessage.trim()
          : undefined;

      if (!subAgentId) return errorResult("subAgentId is required");
      if (
        !["pending", "running", "completed", "error"].includes(status)
      )
        return errorResult(
          "status must be one of: pending, running, completed, error",
        );

      emitUiRequest("update_subagent_status", {
        subAgentId,
        status,
        errorMessage,
        conversationId,
      });

      return textResult({
        subAgentId,
        status,
        errorMessage: errorMessage ?? null,
      });
    },
  };

  // ---- set_subagent_task_list ----
  const setSubagentTaskList: ToolDefinition = {
    name: "set_subagent_task_list",
    label: "Set subagent task list",
    description:
      "Create or replace the task list displayed under a registered subagent in the side panel.",
    parameters: Type.Object({
      subAgentId: Type.String({
        description: "The registered subagent identifier",
      }),
      title: Type.String({ description: "Task list title" }),
      tasks: Type.Array(
        Type.Object({
          title: Type.String({
            description: "Short actionable task title",
          }),
        }),
        {
          minItems: 1,
          description: "List of tasks to display for this subagent",
        },
      ),
    }),
    execute: async (
      _toolCallId: string,
      params: {
        subAgentId: string;
        title: string;
        tasks: { title: string }[];
      },
    ) => {
      const subAgentId = (params.subAgentId ?? "").trim();
      const title = (params.title ?? "").trim();
      const rawTasks = Array.isArray(params.tasks) ? params.tasks : [];

      if (!subAgentId) return errorResult("subAgentId is required");
      if (!title) return errorResult("title is required");
      if (rawTasks.length === 0)
        return errorResult("at least one task is required");

      const now = Date.now();
      const taskListId = `subagent-task-list-${subAgentId}-${now}`;
      const tasks = rawTasks
        .filter(
          (t): t is { title: string } =>
            !!t && typeof t === "object" && typeof t.title === "string",
        )
        .map((t, i) => ({
          id: `${taskListId}-task-${i}`,
          title: t.title.trim(),
          status: "pending" as const,
          order: i,
        }))
        .filter((t) => t.title.length > 0);

      if (tasks.length === 0)
        return errorResult(
          "at least one valid task with a title is required",
        );

      const taskList = {
        id: taskListId,
        title,
        tasks,
        createdAt: new Date(now).toISOString(),
      };

      emitUiRequest("set_subagent_task_list", {
        subAgentId,
        taskList,
        conversationId,
      });

      return textResult({ subAgentId, taskList });
    },
  };

  // ---- update_subagent_task_status ----
  const updateSubagentTaskStatus: ToolDefinition = {
    name: "update_subagent_task_status",
    label: "Update subagent task status",
    description:
      "Update the status of a task inside a registered subagent task list.",
    parameters: Type.Object({
      subAgentId: Type.String({
        description: "The registered subagent identifier",
      }),
      taskId: Type.String({
        description:
          "The task identifier returned by set_subagent_task_list",
      }),
      status: Type.Union(
        [
          Type.Literal("pending"),
          Type.Literal("running"),
          Type.Literal("completed"),
          Type.Literal("error"),
        ],
        { description: "New task status" },
      ),
      errorMessage: Type.Optional(
        Type.String({
          description: "Optional error details when status is error",
        }),
      ),
    }),
    execute: async (
      _toolCallId: string,
      params: {
        subAgentId: string;
        taskId: string;
        status: string;
        errorMessage?: string;
      },
    ) => {
      const subAgentId = (params.subAgentId ?? "").trim();
      const taskId = (params.taskId ?? "").trim();
      const status = (params.status ?? "").trim();
      const errorMessage =
        typeof params.errorMessage === "string"
          ? params.errorMessage.trim()
          : undefined;

      if (!subAgentId) return errorResult("subAgentId is required");
      if (!taskId) return errorResult("taskId is required");
      if (
        !["pending", "running", "completed", "error"].includes(status)
      )
        return errorResult(
          "status must be one of: pending, running, completed, error",
        );

      emitUiRequest("update_subagent_task_status", {
        subAgentId,
        taskId,
        status,
        errorMessage,
        conversationId,
      });

      return textResult({
        subAgentId,
        taskId,
        status,
        errorMessage: errorMessage ?? null,
      });
    },
  };

  // ---- get_access_mode ----
  const getAccessMode: ToolDefinition = {
    name: "get_access_mode",
    label: "Get access mode",
    description:
      "Return the current conversation access mode so the agent can verify whether filesystem access is secure or open.",
    parameters: Type.Object({}),
    execute: async () => {
      const db = getDb();
      const conversation = findConversationById(db, conversationId);
      const accessMode =
        conversation?.access_mode === "open" ? "open" : "secure";
      return textResult({ accessMode });
    },
  };

  // ---- get_commands ----
  const getCommands: ToolDefinition = {
    name: "get_commands",
    label: "Get runtime commands",
    description:
      "Return the list of runtime commands supported by the current conversation session.",
    parameters: Type.Object({}),
    execute: async () => {
      return textResult({
        commands: [
          "get_state",
          "get_messages",
          "get_available_models",
          "get_access_mode",
          "get_commands",
          "prompt",
          "steer",
          "follow_up",
          "abort",
          "set_model",
          "set_thinking_level",
          "cycle_thinking_level",
          "set_auto_compaction",
          "set_auto_retry",
          "set_steering_mode",
          "set_follow_up_mode",
        ],
      });
    },
  };

  return [
    createTaskList,
    updateTaskStatus,
    displayActionSuggestions,
    registerSubagent,
    updateSubagentStatus,
    setSubagentTaskList,
    updateSubagentTaskStatus,
    getAccessMode,
    getCommands,
  ];
}

/** Names of all core tools, for filtering them out of extension manifests. */
export const CORE_TOOL_NAMES = new Set([
  "create_task_list",
  "update_task_status",
  "display_action_suggestions",
  "register_subagent",
  "update_subagent_status",
  "set_subagent_task_list",
  "update_subagent_task_status",
  "get_access_mode",
  "get_commands",
]);
