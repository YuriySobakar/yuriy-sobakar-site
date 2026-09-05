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

// --- SCR-01 page shell (T4): landmarks + section order from the view model ---

async function buildSite() {
  const out = mkdtempSync(path.join(tmpdir(), "yuriy-sobakar-site-"));
  const eleventy = new Eleventy(path.join(root, "src"), out, {
    configPath: path.join(root, "eleventy.config.js"),
    quietMode: true,
  });
  await eleventy.write();
  return { out, html: readFileSync(path.join(out, "index.html"), "utf8") };
}

const count = (html, re) => (html.match(re) ?? []).length;

test("the page has exactly one header, main and footer; h2s follow the view model sections", async () => {
  const { out, html } = await buildSite();
  try {
    assert.equal(count(html, /<header[\s>]/g), 1, "exactly one <header>");
    assert.equal(count(html, /<main[\s>]/g), 1, "exactly one <main>");
    assert.equal(count(html, /<footer[\s>]/g), 1, "exactly one <footer>");

    const resume = loadResumeFile();
    assert.match(html, new RegExp(`<h1[^>]*>\\s*${resume.name}\\s*</h1>`));
    const h2s = [...html.matchAll(/<h2[^>]*>([^<]*)<\/h2>/g)].map((m) => m[1].trim());
    assert.deepEqual(h2s, resume.sections.map((s) => s.title), "one h2 per section, in view-model order");

    const footer = html.slice(html.indexOf("<footer"), html.indexOf("</footer>"));
    assert.ok(/id="contacts"/.test(footer), "contacts section lives in the footer");
    const main = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
    assert.ok(!/<header[\s>]/.test(main), "hero header is not nested inside main");
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
