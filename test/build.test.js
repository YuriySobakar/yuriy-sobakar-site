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

// --- SCR-02 hero (T5): name, headline, fact-list, contact buttons above the fold ---

test("the hero shows the name, headline, a fact-list and one contact button per contact", async () => {
  const { out, html } = await buildSite();
  try {
    const resume = loadResumeFile();
    const header = html.slice(html.indexOf("<header"), html.indexOf("</header>"));
    assert.ok(header.includes(resume.headline), "headline is in the hero");
    const factList = header.match(/<ul class="fact-list">([\s\S]*?)<\/ul>/);
    assert.ok(factList, "hero has a <ul class=\"fact-list\">");
    assert.equal(count(factList[1], /<li[\s>]/g), resume.facts.length, "one <li> per fact");
    assert.ok(!/class="tag"/.test(factList[0]), "facts are not rendered as tags");
    assert.equal(count(header, /data-contact="/g), resume.contacts.length, "one data-contact per contact in the hero");
    assert.ok(!/target=/.test(header), "contact links open in the same tab");
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test("hero.njk renders facts with the fact-list primitive, styled in base.css through tokens only", () => {
  const hero = readFileSync(path.join(root, "src", "_includes", "sections", "hero.njk"), "utf8");
  assert.ok(hero.includes('class="fact-list"'), "hero.njk uses fact-list");
  assert.ok(!/class="tag"/.test(hero), "hero.njk has no tag chips");
  const base = readFileSync(path.join(root, "src", "styles", "base.css"), "utf8");
  const block = base.match(/\.fact-list\s*\{([^}]*)\}/);
  assert.ok(block, "base.css defines .fact-list");
  assert.match(block[1], /font-size:\s*var\(--text-base\)/, "fact-list body text is the 16 px token");
  const literalValues = block[1].match(/:\s*[^;]*\b\d+(\.\d+)?(px|rem|em)\b/g) ?? [];
  assert.deepEqual(literalValues, [], "fact-list uses tokens only, no literal sizes");
});
