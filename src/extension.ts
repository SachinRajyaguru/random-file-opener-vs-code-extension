import * as vscode from "vscode";

let scriptFiles: vscode.Uri[] = [];
const recentIndices: number[] = [];
let intervalId: NodeJS.Timeout | undefined;

// ── File discovery ────────────────────────────────────────────────────────────

async function updateScriptFiles(): Promise<void> {
  // Exclude common noise folders so picks feel meaningful
  scriptFiles = await vscode.workspace.findFiles(
    "**/*",
    "**/{node_modules,.git,dist,out,build}/**"
  );
}

// ── Tab hygiene ───────────────────────────────────────────────────────────────

async function closeAllSavedTextDocuments(): Promise<void> {
  for (const editor of vscode.window.visibleTextEditors) {
    if (!editor.document.isDirty) {
      await vscode.window.showTextDocument(editor.document, { preserveFocus: false });
      await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
    }
  }
}

// ── Core: open a random file ──────────────────────────────────────────────────

async function showRandomDocument(): Promise<void> {
  if (scriptFiles.length === 0) {
    await updateScriptFiles();
    if (scriptFiles.length === 0) return; // empty workspace
  }

  // Flush + clean up tabs every 10 opens
  if (recentIndices.length >= 10) {
    recentIndices.length = 0;
    await closeAllSavedTextDocuments();
  }

  // Pick a random file, avoiding immediate repeats when possible
  let index: number;
  let attempts = 0;
  do {
    index = Math.floor(Math.random() * scriptFiles.length);
    attempts++;
  } while (recentIndices.includes(index) && attempts < 10);

  recentIndices.push(index);

  try {
    const doc = await vscode.workspace.openTextDocument(scriptFiles[index]);
    await vscode.window.showTextDocument(doc, { preview: true, preserveFocus: false });
  } catch {
    // File may have been deleted — refresh list on next cycle
    scriptFiles = [];
  }
}

// ── Commands ──────────────────────────────────────────────────────────────────

async function startCommand(intervalMs: number): Promise<void> {
  if (intervalId) {
    clearInterval(intervalId);
  }

  await updateScriptFiles();

  if (scriptFiles.length === 0) {
    vscode.window.showWarningMessage("No files found in workspace.");
    return;
  }

  intervalId = setInterval(showRandomDocument, intervalMs);
  vscode.window.showInformationMessage(
    `Random File Opener started — every ${intervalMs}ms across ${scriptFiles.length} files.`
  );
}

function stopCommand(): void {
  if (intervalId) {
    clearInterval(intervalId);   // covers setInterval (startCommand)
    clearTimeout(intervalId);    // covers setTimeout  (startWithPickCommand)
    intervalId = undefined;
    vscode.window.showInformationMessage("Random File Opener stopped.");
  } else {
    vscode.window.showInformationMessage("Random File Opener is not running.");
  }
}

// ── Interval range constants ───────────────────────────────────────────────────

const INTERVAL_RANGES: Record<string, { min: number; max: number }> = {
  "5sec - 25sec":  { min: 5_000,  max: 25_000 },   // add future ranges here
  "35s – 135s": { min: 35_000, max: 135_000 },
  // "5min – 10min": { min: 300_000, max: 600_000 },
};

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ── Updated pick command ───────────────────────────────────────────────────────

async function startWithPickCommand(): Promise<void> {
  const picked = await vscode.window.showQuickPick(Object.keys(INTERVAL_RANGES), {
    placeHolder: "Select switch interval range",
  });

  if (!picked) return;

  const { min, max } = INTERVAL_RANGES[picked];

  // Kick off the first open immediately, then schedule the next with a fresh
  // random interval after each file switch.
  async function scheduleNext(): Promise<void> {
    await showRandomDocument();
    const next = randomInRange(min, max);
    intervalId = setTimeout(scheduleNext, next);
  }

  if (intervalId) {
    clearTimeout(intervalId);   // add this line
  }

  await updateScriptFiles();

  if (scriptFiles.length === 0) {
    vscode.window.showWarningMessage("No files found in workspace.");
    return;
  }

  vscode.window.showInformationMessage(
    `Random File Opener started — switching every ${min / 1000}s–${max / 1000}s.`
  );

  scheduleNext();
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "randomfileopener.openRandomFile",
      () => startCommand(2_000)           // default: 2-second interval
    ),
    vscode.commands.registerCommand(
      "randomfileopener.openRandomFilePick",
      startWithPickCommand                 // user picks the interval
    ),
    vscode.commands.registerCommand(
      "randomfileopener.stopOpenFile",
      stopCommand
    )
  );
}

export function deactivate(): void {
  if (intervalId) {
    clearInterval(intervalId);
  }
}
