"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getScriptFiles = void 0;
const fs = require("fs");
const path = require("path");
function getScriptFiles(dir, fileList = []) {
    fs.readdirSync(dir).forEach((file) => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            if (file === "node_modules") {
                return;
            }
            getScriptFiles(filePath, fileList);
        }
        else if (file.endsWith(".js") ||
            file.endsWith(".ts") ||
            file.endsWith(".tsx")) {
            fileList.push(filePath);
        }
    });
    return fileList;
}
exports.getScriptFiles = getScriptFiles;
//# sourceMappingURL=getScriptFiles.js.map