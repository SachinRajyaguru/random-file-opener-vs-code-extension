import * as fs from "fs";
import * as path from "path";
function getScriptFiles(dir: any, fileList: string[] = []): string[] {
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file === "node_modules") {
        return;
      }
      getScriptFiles(filePath, fileList);
    } else if (
      file.endsWith(".js") ||
      file.endsWith(".ts") ||
      file.endsWith(".tsx")
    ) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

export { getScriptFiles };
