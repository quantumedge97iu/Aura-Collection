import { cpSync, mkdirSync, rmdirSync, existsSync } from "node:fs";
import path from "node:path";

const link = path.join(process.cwd(), "sanity-cms");
if (existsSync(link)) rmdirSync(link);

const source = path.join(process.cwd(), "..", "sanity", "integration");
const destination = path.join(process.cwd(), "lib", "sanity");
mkdirSync(destination, { recursive: true });
for (const file of ["client.ts", "index.ts", "queries.ts", "types.ts"]) {
  cpSync(path.join(source, file), path.join(destination, file));
}
console.log("Copied Sanity integration into lib/sanity.");
