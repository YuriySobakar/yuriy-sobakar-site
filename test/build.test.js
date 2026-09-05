// Build smoke test: Eleventy renders the site into a temp folder; index.html exists and contains the name.
// Also guards the XSS convention: no `| safe` filter inside section partials.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, existsSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Eleventy from "@11ty/eleventy";
import { loadResumeFile } from "../lib/resume/load.js";

const root = path.resolve(import.meta.dirname, "..");

test("npm run build produces _site/index.html with the owner's name", async () => {
  const out = mkdtempSync(path.join(tmpdir(), "yuriy-sobakar-site-"));
  try {
    const eleventy = new Eleventy(path.join(root, "src"), out, {
      configPath: path.join(root, "eleventy.config.js"),
      quietMode: true,
    });
    await eleventy.write();

    const indexPath = path.join(out, "index.html");
    assert.ok(existsSync(indexPath), "index.html was not written");
    const html = readFileSync(indexPath, "utf8");
    const resume = loadResumeFile();
    assert.ok(html.includes(resume.name), "index.html does not contain resume.name");
    assert.ok(html.includes("<h1"), "index.html has no <h1>");
    assert.ok(existsSync(path.join(out, "styles", "tokens.css")), "styles were not copied through");
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test("section partials never use the `safe` filter on resume data", () => {
  const dir = path.join(root, "src", "_includes", "sections");
  for (const file of readdirSync(dir)) {
    const source = readFileSync(path.join(dir, file), "utf8");
    assert.ok(!/\|\s*safe\b/.test(source), `${file} uses the safe filter — resume text must stay text`);
  }
});
