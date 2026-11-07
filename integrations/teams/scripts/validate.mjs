import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const requiredJson = [
  "appPackage/manifest.demo.json",
  "appPackage/manifest.template.json",
  "cards/survey-invitation.ca.json",
  "cards/survey-reminder.ca.json",
  "cards/action-approval.ca.json",
];

let failed = false;
for (const relativePath of requiredJson) {
  try {
    JSON.parse(await readFile(resolve(root, relativePath), "utf8"));
    console.log(`OK JSON  ${relativePath}`);
  } catch (error) {
    failed = true;
    console.error(`FAIL     ${relativePath}: ${error.message}`);
  }
}

const manifest = JSON.parse(
  await readFile(resolve(root, "appPackage/manifest.demo.json"), "utf8"),
);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
if (!uuid.test(manifest.id) || !uuid.test(manifest.bots?.[0]?.botId)) {
  failed = true;
  console.error("FAIL     manifest demo IDs are not valid UUIDs");
}

for (const icon of ["color.png", "outline.png"]) {
  try {
    const info = await stat(resolve(root, "appPackage", icon));
    if (info.size < 100) throw new Error("file is unexpectedly small");
    console.log(`OK ICON  appPackage/${icon} (${info.size} bytes)`);
  } catch (error) {
    failed = true;
    console.error(`FAIL     appPackage/${icon}: ${error.message}`);
  }
}

if (failed) process.exit(1);
console.log("Teams integration assets passed local structural validation.");
