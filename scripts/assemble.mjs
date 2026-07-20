import {
  copyFileSync,
  cpSync,
  mkdirSync,
  rmSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "dist");

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

for (const file of ["index.html", "hub.css", "storage-migration.js"]) {
  copyFileSync(resolve(root, file), resolve(output, file));
}

for (const folder of ["taipei", "thailand"]) {
  cpSync(resolve(root, folder), resolve(output, folder), {
    recursive: true,
    filter: (source) => !source.endsWith("server.js"),
  });
}

cpSync(resolve(root, "tokyo", "dist"), resolve(output, "tokyo"), {
  recursive: true,
});

console.log("Assembled Trip Companion → dist/");
