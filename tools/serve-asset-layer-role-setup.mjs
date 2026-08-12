import { createReadStream } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(directory, "asset-layer-role-setup.html");

createServer((request, response) => {
  if (request.url !== "/" && request.url !== "/asset-layer-role-setup.html") {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "cache-control": "no-store",
    "content-security-policy": "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src https://sepolia.base.org https://sepolia.basescan.org; frame-ancestors 'none'",
    "content-type": "text/html; charset=utf-8",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY"
  });
  createReadStream(file).pipe(response);
}).listen(8765, "127.0.0.1", () => {
  console.log("Asset Layer role setup: http://127.0.0.1:8765/");
});
