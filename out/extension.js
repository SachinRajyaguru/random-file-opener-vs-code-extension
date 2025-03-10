"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const getScriptFiles_1 = require("./getScriptFiles");
let workspaceRoot = vscode.workspace.rootPath;
var scriptFiles = (0, getScriptFiles_1.getScriptFiles)(workspaceRoot, []);
const randomIndeies = [];
async function closeAllSavedTextDocuments() {
    const documents = vscode.workspace.textDocuments;
    for (const document of documents) {
        if (!document.isDirty) {
            await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
        }
    }
}
const showTextDocument = () => {
    if (randomIndeies.length >= 10) {
        randomIndeies.length = 0;
        closeAllSavedTextDocuments();
    }
    let randomFileIndex = Math.floor(Math.random() * scriptFiles.length);
    randomIndeies.push(randomFileIndex);
    vscode.workspace
        .openTextDocument(scriptFiles[randomFileIndex])
        .then((doc) => {
        vscode.window.showTextDocument(doc);
    });
};
var id = undefined;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand("randomfileopener.openRandomFile", async () => {
        if (typeof id !== "undefined") {
            clearInterval(id);
        }
        const LIST = 10;
        const GAP = 2;
        const arrOfminutes = Array(LIST)
            .fill(0)
            .map((x, index) => `${index + GAP}`);
        vscode.window.showQuickPick(arrOfminutes).then((item) => {
            if (item) {
                id = setInterval(showTextDocument, parseInt(item) * 1000 * 60);
            }
        });
    });
    vscode.commands.registerCommand("randomfileopener.stopOpenFile", () => {
        if (typeof id !== "undefined") {
            console.log(JSON.stringify(`clearInterval(${id})`, null, 2));
            clearInterval(id);
        }
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map