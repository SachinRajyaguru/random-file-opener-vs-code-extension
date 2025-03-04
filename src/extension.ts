import * as vscode from "vscode";

let scriptFiles: vscode.Uri[] = [];
const randomIndices: number[] = [];
let intervalId: NodeJS.Timeout | undefined = undefined;

// Function to fetch script files dynamically
async function updateScriptFiles() {
  scriptFiles = await vscode.workspace.findFiles("**/*");
}

// Function to close all saved documents
async function closeAllSavedTextDocuments() {
  const editors = vscode.window.visibleTextEditors;

  for (const editor of editors) {
    if (!editor.document.isDirty) {
      await vscode.window.showTextDocument(editor.document);
      await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
    }
  }
}

// Function to show a random file
async function showTextDocument() {
  if (scriptFiles.length === 0) {
    await updateScriptFiles();
  }

  if (randomIndices.length >= 10) {
    randomIndices.length = 0;
    await closeAllSavedTextDocuments();
  }

  const randomFileIndex = Math.floor(Math.random() * scriptFiles.length);
  randomIndices.push(randomFileIndex);

  const doc = await vscode.workspace.openTextDocument(scriptFiles[randomFileIndex]);
  vscode.window.showTextDocument(doc);
}

// Extension activation
export function activate(context: vscode.ExtensionContext) {
  vscode.commands.registerCommand("randomfileopener.openRandomFile", async () => {
    if (intervalId) {
      clearInterval(intervalId);
    }

    await updateScriptFiles();

    const LIST = 10;
    const GAP = 2;
    const arrOfMinutes = Array.from({ length: LIST }, (_, i) => `${i + GAP}`);

    vscode.window.showQuickPick(arrOfMinutes, { placeHolder: "Select interval in minutes" }).then((item) => {
      if (item) {
        intervalId = setInterval(showTextDocument, parseInt(item) * 60 * 1000);
      }
    });
  });

  vscode.commands.registerCommand("randomfileopener.stopOpenFile", () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = undefined;
      vscode.window.showInformationMessage("Stopped opening random files.");
    }
  });

  context.subscriptions.push();
}

// Extension deactivation
export function deactivate() {
  if (intervalId) {
    clearInterval(intervalId);
  }
}
