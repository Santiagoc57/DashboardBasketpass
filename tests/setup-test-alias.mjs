import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), ".codex-temp", "test-dist");
const aliasDir = path.join(root, "node_modules", "@", "lib");
const aliasPackageDir = path.join(aliasDir, "copy");
const aliasModules = [
  "assignment-confirmation",
  "club-catalog",
  "constants",
  "date",
  "display",
  "env",
  "logo-library-index",
  "team-directory",
  "team-excel-metadata-overrides",
  "team-metadata-overrides",
  "utils",
];

mkdirSync(aliasDir, { recursive: true });
mkdirSync(aliasPackageDir, { recursive: true });

writeFileSync(
  path.join(aliasDir, "copy.js"),
  "module.exports = require('../../../lib/copy.js');\n",
);

writeFileSync(
  path.join(aliasPackageDir, "index.js"),
  "module.exports = require('../../../../lib/copy.js');\n",
);

for (const moduleName of aliasModules) {
  const moduleDir = path.join(aliasDir, moduleName);
  mkdirSync(moduleDir, { recursive: true });
  writeFileSync(
    path.join(moduleDir, "index.js"),
    `module.exports = require('../../../../lib/${moduleName}.js');\n`,
  );
}
