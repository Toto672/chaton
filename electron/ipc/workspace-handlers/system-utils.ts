import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import electron from "electron";

const { ipcMain, shell } = electron;

async function detectExternalCommand(command: string) {
  try {
    if (typeof command !== "string" || !command.trim()) {
      return { detected: false };
    }
    const { execSync } = await import("node:child_process");
    try {
      if (process.platform === "win32") {
        execSync(`where ${command}`, { stdio: "pipe" });
      } else {
        execSync(`command -v ${command}`, { stdio: "pipe", shell: "/bin/sh" });
      }
      return { detected: true };
    } catch {
      return { detected: false };
    }
  } catch {
    return { detected: false };
  }
}

export function registerSystemUtilityHandlers(): void {
  ipcMain.handle("vscode:detect", async () => detectExternalCommand("code"));

  ipcMain.handle("app:detectExternalCommand", async (_event, command: string) =>
    detectExternalCommand(command),
  );

  ipcMain.handle("app:openExternal", async (_event, url: string) => {
    try {
      if (typeof url !== "string" || !url.trim()) {
        return { success: false, error: "Missing URL" };
      }
      new URL(url);
      await shell.openExternal(url);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle("ollama:detect", async () => {
    try {
      const { execSync } = await import("node:child_process");
      let installed = false;
      try {
        if (process.platform === "win32") {
          execSync("where ollama", { stdio: "pipe" });
        } else {
          execSync("command -v ollama", { stdio: "pipe", shell: "/bin/sh" });
        }
        installed = true;
      } catch {
        installed = false;
      }

      let apiRunning = false;
      try {
        const response = await fetch("http://127.0.0.1:11434/api/tags");
        apiRunning = response.ok;
      } catch {
        apiRunning = false;
      }

      return { installed, apiRunning, baseUrl: "http://localhost:11434/v1" };
    } catch {
      return {
        installed: false,
        apiRunning: false,
        baseUrl: "http://localhost:11434/v1",
      };
    }
  });

  ipcMain.handle("lmstudio:detect", async () => {
    try {
      let installed = false;
      if (process.platform === "darwin") {
        installed = fs.existsSync("/Applications/LM Studio.app");
      } else if (process.platform === "win32") {
        const base = process.env.LOCALAPPDATA ?? "";
        installed = base
          ? fs.existsSync(path.join(base, "Programs", "LM Studio"))
          : false;
      } else {
        const home = os.homedir();
        installed =
          fs.existsSync(path.join(home, "LM-Studio")) ||
          fs.existsSync(path.join(home, "Applications", "LM-Studio"));
      }

      let apiRunning = false;
      try {
        const response = await fetch("http://127.0.0.1:1234/v1/models");
        apiRunning = response.ok;
      } catch {
        apiRunning = false;
      }

      return { installed, apiRunning, baseUrl: "http://localhost:1234/v1" };
    } catch {
      return {
        installed: false,
        apiRunning: false,
        baseUrl: "http://localhost:1234/v1",
      };
    }
  });

  ipcMain.handle(
    "vscode:openWorktree",
    async (_event, worktreePath: string) => {
      try {
        const { execSync } = await import("node:child_process");
        if (process.platform === "darwin") {
          execSync(`open -a "Visual Studio Code" "${worktreePath}"`);
        } else {
          execSync(`code "${worktreePath}"`);
        }
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  );

  ipcMain.handle(
    "app:openExternalApplication",
    async (_event, command: string, args: string[]) => {
      try {
        if (typeof command !== "string" || !command.trim()) {
          return { success: false, error: "Missing command" };
        }
        const normalizedArgs = Array.isArray(args)
          ? args.filter((arg): arg is string => typeof arg === "string")
          : [];
        const { spawn } = await import("node:child_process");
        const child = spawn(command, normalizedArgs, {
          detached: true,
          stdio: "ignore",
          shell: process.platform === "win32",
        });
        child.unref();
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  );
}
