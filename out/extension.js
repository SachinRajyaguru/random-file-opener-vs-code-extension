"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
let scriptFiles = [];
const recentIndices = [];
let intervalId;
// ── File discovery ────────────────────────────────────────────────────────────
async function updateScriptFiles() {
    // Exclude common noise folders so picks feel meaningful
    scriptFiles = await vscode.workspace.findFiles("**/*", "**/{node_modules,.git,dist,out,build}/**");
}
// ── Tab hygiene ───────────────────────────────────────────────────────────────
async function closeAllSavedTextDocuments() {
    for (const editor of vscode.window.visibleTextEditors) {
        if (!editor.document.isDirty) {
            await vscode.window.showTextDocument(editor.document, { preserveFocus: false });
            await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
        }
    }
}
// ── Core: open a random file ──────────────────────────────────────────────────
async function showRandomDocument() {
    if (scriptFiles.length === 0) {
        await updateScriptFiles();
        if (scriptFiles.length === 0)
            return; // empty workspace
    }
    // Flush + clean up tabs every 10 opens
    if (recentIndices.length >= 10) {
        recentIndices.length = 0;
        await closeAllSavedTextDocuments();
    }
    // Pick a random file, avoiding immediate repeats when possible
    let index;
    let attempts = 0;
    do {
        index = Math.floor(Math.random() * scriptFiles.length);
        attempts++;
    } while (recentIndices.includes(index) && attempts < 10);
    recentIndices.push(index);
    try {
        const doc = await vscode.workspace.openTextDocument(scriptFiles[index]);
        await vscode.window.showTextDocument(doc, { preview: true, preserveFocus: false });
    }
    catch {
        // File may have been deleted — refresh list on next cycle
        scriptFiles = [];
    }
}
// ── Commands ──────────────────────────────────────────────────────────────────
async function startCommand(intervalMs) {
    if (intervalId) {
        clearInterval(intervalId);
    }
    await updateScriptFiles();
    if (scriptFiles.length === 0) {
        vscode.window.showWarningMessage("No files found in workspace.");
        return;
    }
    intervalId = setInterval(showRandomDocument, intervalMs);
    vscode.window.showInformationMessage(`Random File Opener started — every ${intervalMs}ms across ${scriptFiles.length} files.`);
}
function stopCommand() {
    if (intervalId) {
        clearInterval(intervalId); // covers setInterval (startCommand)
        clearTimeout(intervalId); // covers setTimeout  (startWithPickCommand)
        intervalId = undefined;
        vscode.window.showInformationMessage("Random File Opener stopped.");
    }
    else {
        vscode.window.showInformationMessage("Random File Opener is not running.");
    }
}
// ── Interval range constants ───────────────────────────────────────────────────
const INTERVAL_RANGES = {
    "5sec - 25sec": { min: 5000, max: 25000 },
    "35s – 135s": { min: 35000, max: 135000 },
    // "5min – 10min": { min: 300_000, max: 600_000 },
};
function randomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
// ── Updated pick command ───────────────────────────────────────────────────────
async function startWithPickCommand() {
    const picked = await vscode.window.showQuickPick(Object.keys(INTERVAL_RANGES), {
        placeHolder: "Select switch interval range",
    });
    if (!picked)
        return;
    const { min, max } = INTERVAL_RANGES[picked];
    // Kick off the first open immediately, then schedule the next with a fresh
    // random interval after each file switch.
    async function scheduleNext() {
        await showRandomDocument();
        const next = randomInRange(min, max);
        intervalId = setTimeout(scheduleNext, next);
    }
    if (intervalId) {
        clearTimeout(intervalId); // add this line
    }
    await updateScriptFiles();
    if (scriptFiles.length === 0) {
        vscode.window.showWarningMessage("No files found in workspace.");
        return;
    }
    vscode.window.showInformationMessage(`Random File Opener started — switching every ${min / 1000}s–${max / 1000}s.`);
    scheduleNext();
}
// ── Lifecycle ─────────────────────────────────────────────────────────────────
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand("randomfileopener.openRandomFile", () => startCommand(2000) // default: 2-second interval
    ), vscode.commands.registerCommand("randomfileopener.openRandomFilePick", startWithPickCommand // user picks the interval
    ), vscode.commands.registerCommand("randomfileopener.stopOpenFile", stopCommand));
}
exports.activate = activate;
function deactivate() {
    if (intervalId) {
        clearInterval(intervalId);
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map