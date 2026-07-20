const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT) || 5174;

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".map": "application/json",
};

function send(res, code, body, type) {
  res.writeHead(code, { "Content-Type": type || "text/plain; charset=utf-8" });
  res.end(body);
}

function resolveFile(urlPath) {
  let pathname = decodeURIComponent((urlPath || "/").split("?")[0]);
  if (pathname === "/") pathname = "/index.html";

  // Serve built Tokyo app under /tokyo
  if (pathname === "/tokyo" || pathname === "/tokyo/") {
    pathname = "/tokyo/dist/index.html";
  } else if (pathname.startsWith("/tokyo/") && !pathname.startsWith("/tokyo/dist/")) {
    const rest = pathname.slice("/tokyo/".length);
    const distCandidate = path.join(root, "tokyo", "dist", rest);
    if (fs.existsSync(distCandidate) && fs.statSync(distCandidate).isFile()) {
      pathname = `/tokyo/dist/${rest}`;
    } else if (!rest.includes(".")) {
      pathname = "/tokyo/dist/index.html";
    }
  }

  // Directory → index.html
  let filePath = path.normalize(path.join(root, pathname));
  if (!filePath.startsWith(root)) return null;

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  return filePath;
}

const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent((req.url || "/").split("?")[0]);
  if (["/taipei", "/tokyo", "/thailand"].includes(pathname)) {
    res.writeHead(308, { Location: `${pathname}/` });
    res.end();
    return;
  }

  const filePath = resolveFile(req.url || "/");
  if (!filePath) {
    send(res, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 404, "Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, data, types[ext] || "application/octet-stream");
  });
});

server.listen(port, () => {
  console.log(`Trip Companion hub at http://localhost:${port}`);
  console.log(`  Taipei   → http://localhost:${port}/taipei/`);
  console.log(`  Tokyo    → http://localhost:${port}/tokyo/`);
  console.log(`  Thailand → http://localhost:${port}/thailand/`);
});
