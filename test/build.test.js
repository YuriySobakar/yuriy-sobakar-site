// Build tests: Eleventy renders the site (real resume.yaml or a fixture) into a temp folder and the
// HTML is checked. Guards the XSS convention (no `| safe` in section partials), the landmarks,
// every SCR from screens.md, and the second barrier against a confidential-project leak (ADR 0002).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, existsSync, readdirSync, rmSync, cpSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Eleventy from "@11ty/eleventy";
import { loadResumeFile, ResumeValidationError } from "../lib/resume/load.js";

const root = path.resolve(import.meta.dirname, "..");
const fixture = (name) => path.join(root, "test", "fixtures", name);
const count = (html, re) => (html.match(re) ?? []).length;
const sectionOf = (html, id) => {
  const start = html.indexOf(`id="${id}"`);
  return start === -1 ? "" : html.slice(start, html.indexOf("</section>", start));
};
const between = (html, open, close) => html.slice(html.indexOf(open), html.indexOf(close));
const headings = (fragment, level) => [...fragment.matchAll(new RegExp(`<h${level}[^>]*>([^<]*)</h${level}>`, "g"))].map((m) => m[1].trim());

async function render(src, out) {
  const eleventy = new Eleventy(src, out, { configPath: path.join(root, "eleventy.config.js"), quietMode: true });
  await eleventy.write();
}

/** Build the real src/ into a temp folder. */
async function buildSite() {
  const out = mkdtempSync(path.join(tmpdir(), "yuriy-sobakar-site-"));
  await render(path.join(root, "src"), out);
  return { out, html: readFileSync(path.join(out, "index.html"), "utf8"), cleanup: () => rmSync(out, { recursive: true, force: true }) };
}

/**
 * Build from fixture data: copy src/ to a temp folder (never touching the working tree), swap
 * _data/resume.yaml for the fixture (and optionally _data/site.json), render into a second temp folder.
 * Returns { html: string|null, out, cleanup }. On failure the error carries `indexWritten`.
 */
async function buildWith(fixturePath, { siteJson } = {}) {
  const work = mkdtempSync(path.join(tmpdir(), "yuriy-sobakar-site-src-"));
  const out = mkdtempSync(path.join(tmpdir(), "yuriy-sobakar-site-out-"));
  const src = path.join(work, "src");
  cpSync(path.join(root, "src"), src, { recursive: true });
  writeFileSync(path.join(src, "_data", "resume.yaml"), readFileSync(fixturePath, "utf8"));
  if (siteJson !== undefined) writeFileSync(path.join(src, "_data", "site.json"), JSON.stringify(siteJson));
  const cleanup = () => {
    rmSync(work, { recursive: true, force: true });
    rmSync(out, { recursive: true, force: true });
  };
  try {
    await render(src, out);
    const indexPath = path.join(out, "index.html");
    return { html: existsSync(indexPath) ? readFileSync(indexPath, "utf8") : null, out, cleanup };
  } catch (error) {
    error.indexWritten = existsSync(path.join(out, "index.html"));
    cleanup();
    throw error;
  }
}

// --- Skeleton smoke + conventions ---

test("npm run build produces _site/index.html with the owner's name", async () => {
  const { out, html, cleanup } = await buildSite();
  try {
    const resume = loadResumeFile();
    assert.ok(html.includes(resume.name), "index.html does not contain resume.name");
    assert.ok(html.includes("<h1"), "index.html has no <h1>");
    assert.ok(existsSync(path.join(out, "styles", "tokens.css")), "styles were not copied through");
  } finally {
    cleanup();
  }
});

test("section partials never use the `safe` filter on resume data", () => {
  const dir = path.join(root, "src", "_includes", "sections");
  for (const file of readdirSync(dir)) {
    const source = readFileSync(path.join(dir, file), "utf8");
    assert.ok(!/\|\s*safe\b/.test(source), `${file} uses the safe filter — resume text must stay text`);
  }
});

test("partials hide and sort nothing — that is the view model's job (ADR 0002)", () => {
  const dir = path.join(root, "src", "_includes", "sections");
  const read = (f) => readFileSync(path.join(dir, f), "utf8");
  assert.ok(!/\{%\s*if\s+resume\.\w+/.test(read("experience.njk") + read("skills.njk") + read("projects.njk") + read("contacts.njk")), "no section-level hiding condition");
  assert.ok(!/\{%\s*if\s+job\.results/.test(read("experience.njk")), "no results hiding condition");
  assert.ok(!/job\.end\s+else|if\s+job\.end/.test(read("experience.njk")), "Present is decided by job.current");
  assert.match(read("experience.njk"), /job\.current/);
  assert.ok(!/\{%\s*if\s+group\.items/.test(read("skills.njk")), "no group-level hiding condition");
  assert.ok(!/not\s+project\.confidential|confidential\s*==\s*false/.test(read("projects.njk")), "no 'hide when confidential' logic");
  for (const f of readdirSync(dir)) assert.ok(!/\|\s*sort/.test(read(f)), `${f} sorts in the template`);
  const hero = read("hero.njk");
  assert.ok(hero.includes('class="fact-list"') && !/class="tag"/.test(hero), "hero uses fact-list, not tag chips");
});

test("the fact-list primitive is defined in base.css through tokens only", () => {
  const base = readFileSync(path.join(root, "src", "styles", "base.css"), "utf8");
  const block = base.match(/\.fact-list\s*\{([^}]*)\}/);
  assert.ok(block, "base.css defines .fact-list");
  assert.match(block[1], /font-size:\s*var\(--text-base\)/, "fact-list body text is the 16 px token");
  assert.deepEqual(block[1].match(/:\s*[^;]*\b\d+(\.\d+)?(px|rem|em)\b/g) ?? [], [], "fact-list uses tokens only");
});

// --- The real resume.yaml: SCR-01 landmarks + SCR-02 hero ---

test("the page has exactly one header, main and footer; h2s follow the view model sections", async () => {
  const { html, cleanup } = await buildSite();
  try {
    assert.equal(count(html, /<header[\s>]/g), 1, "exactly one <header>");
    assert.equal(count(html, /<main[\s>]/g), 1, "exactly one <main>");
    assert.equal(count(html, /<footer[\s>]/g), 1, "exactly one <footer>");
    const resume = loadResumeFile();
    assert.match(html, new RegExp(`<h1[^>]*>\\s*${resume.name}\\s*</h1>`));
    assert.deepEqual(headings(html, 2), resume.sections.map((s) => s.title), "one h2 per section, in view-model order");
    assert.ok(/id="contacts"/.test(between(html, "<footer", "</footer>")), "contacts section lives in the footer");
    assert.ok(!/<header[\s>]/.test(between(html, "<main", "</main>")), "hero header is not nested inside main");
    const header = between(html, "<header", "</header>");
    assert.ok(header.includes(resume.headline), "headline is in the hero");
    const factList = header.match(/<ul class="fact-list">([\s\S]*?)<\/ul>/);
    assert.ok(factList, 'hero has a <ul class="fact-list">');
    assert.equal(count(factList[1], /<li[\s>]/g), resume.facts.length, "one <li> per fact");
    assert.equal(count(header, /data-contact="/g), resume.contacts.length, "one data-contact per contact in the hero");
    assert.ok(!/target=/.test(header), "contact links open in the same tab");
  } finally {
    cleanup();
  }
});

// --- Fixture: full resume (SCR-01…SCR-06 default states, AC-01/03/06/08/11) ---

test("full fixture: landmarks, hero, 4 sections, experience newest first with Present, verbatim result", async () => {
  const { html, cleanup } = await buildWith(fixture("resume.full.yaml"));
  try {
    assert.equal(count(html, /<header[\s>]/g), 1);
    assert.equal(count(html, /<main[\s>]/g), 1);
    assert.equal(count(html, /<footer[\s>]/g), 1);
    assert.match(html, /<h1[^>]*>\s*Test Person\s*<\/h1>/);
    assert.deepEqual(headings(html, 2), ["Experience", "Skills", "Projects", "Contacts"]);

    const header = between(html, "<header", "</header>");
    assert.equal(count(header.match(/<ul class="fact-list">([\s\S]*?)<\/ul>/)[1], /<li[\s>]/g), 3, "3 facts");
    assert.equal(count(header, /data-contact="/g), 3, "3 contacts in the hero");
    assert.equal(count(between(html, "<footer", "</footer>"), /data-contact="/g), 3, "3 contacts in the footer");

    const experience = sectionOf(html, "experience");
    assert.deepEqual(headings(experience, 3), ["Lead Developer", "Mid Developer", "Junior Developer"], "newest first");
    const items = experience.split('class="timeline-item"').slice(1);
    assert.match(items[0], /2025-03 – Present/);
    assert.match(items[1], /2023-01 – 2025-02/);
    assert.ok(!/Present/.test(items[1] + items[2]), "closed periods have no Present");
    assert.equal(count(items[0], /timeline-item__meta/g), 1, "period line uses the small-text meta class");
    assert.ok(html.includes("Unique verbatim result marker 8f3a"), "a result string from the fixture appears verbatim (AC-11)");
  } finally {
    cleanup();
  }
});

test("full fixture: skill groups in order without the empty one; project cards commercial / pet / confidential", async () => {
  const { html, cleanup } = await buildWith(fixture("resume.full.yaml"));
  try {
    const skills = sectionOf(html, "skills");
    assert.match(skills, /<div class="skill-groups">/);
    assert.deepEqual(headings(skills, 3), ["Group Alpha", "Group Charlie"]);
    assert.ok(!skills.includes("Group Bravo"), "empty group is absent");
    assert.ok(!/<progress|<meter|\d+\s*%/.test(skills), "no levels, percentages or scales");

    const projects = sectionOf(html, "projects");
    const [commercial, pet, confidential] = projects.split('class="card"').slice(1);
    assert.match(commercial, /Acme Storefront/);
    assert.match(commercial, /Retail/);
    assert.equal(count(commercial, /class="tag"/g), 2, "stack chips");
    assert.match(commercial, /href="https:\/\/acme-storefront\.example\.com"[^>]*>\s*Live/);
    assert.ok(!/>\s*Code\s*</.test(commercial), "commercial card has no Code button");
    assert.match(pet, /href="https:\/\/toy-tracker\.example\.com"[^>]*>\s*Live/);
    assert.match(pet, /href="https:\/\/github\.com\/testperson\/toy-tracker"[^>]*>\s*Code/);
    assert.match(confidential, /<h3[^>]*>\s*Healthcare/);
    assert.match(confidential, /Confidential/);
    assert.match(confidential, /WordPress developer/);
    assert.ok(!/href=/.test(confidential), "confidential card has no links");
    for (const link of projects.matchAll(/<a [^>]*>/g)) {
      assert.match(link[0], /target="_blank"/, `${link[0]} opens in a new tab`);
      assert.match(link[0], /rel="noopener noreferrer"/, `${link[0]} has rel`);
    }
  } finally {
    cleanup();
  }
});

test("full fixture: the confidential client's name, URL and stack are absent from the whole HTML (AC-06)", async () => {
  const { html, cleanup } = await buildWith(fixture("resume.full.yaml"));
  try {
    for (const secret of ["SecretClientCo", "secretclientco.example.com", "SecretStackTech"]) {
      assert.ok(!html.includes(secret), `${secret} leaked into the HTML`);
    }
  } finally {
    cleanup();
  }
});

// --- Fixture: empty sections (SCR-03/04/05 empty states, AC-08) ---

test("empty-sections fixture: only the Contacts h2 remains; no empty section or heading in the HTML", async () => {
  const { html, cleanup } = await buildWith(fixture("resume.empty-sections.yaml"));
  try {
    assert.deepEqual(headings(html, 2), ["Contacts"]);
    for (const id of ["experience", "skills", "projects"]) assert.ok(!html.includes(`id="${id}"`), `${id} section must be absent`);
    for (const title of ["Experience", "Skills", "Projects"]) assert.ok(!new RegExp(`<h2[^>]*>\\s*${title}`).test(html), `${title} heading must be absent`);
    assert.equal(count(html, /<h3[\s>]/g), 0, "no group or entry headings");
  } finally {
    cleanup();
  }
});

// --- Fixture: rule violation (publish gate, AC-05/AC-09) ---

test("invalid-rule fixture: the build rejects with ResumeValidationError and writes no index.html", async () => {
  await assert.rejects(
    () => buildWith(fixture("resume.invalid-rule.yaml")),
    (error) => {
      const chain = [];
      for (let e = error; e; e = e.originalError ?? e.cause) chain.push(e);
      const validation = chain.find((e) => e instanceof ResumeValidationError || e.name === "ResumeValidationError");
      assert.ok(validation, `no ResumeValidationError in the chain: ${error.message}`);
      assert.ok(validation.problems.some((l) => l.includes('"Acme Storefront"') && l.includes("code of a commercial project")), validation.problems.join("\n"));
      assert.equal(error.indexWritten, false, "index.html must not be written");
      return true;
    },
  );
});

// --- SCR-06 contacts + click counter (ADR 0003) ---

test("footer contacts: one same-tab button per contact type with data-contact", async () => {
  const { html, cleanup } = await buildWith(fixture("resume.full.yaml"), { siteJson: { counter: { script: "", endpoint: "" } } });
  try {
    const links = [...between(html, "<footer", "</footer>").matchAll(/<a [^>]*>/g)].map((m) => m[0]);
    assert.deepEqual(links.map((l) => l.match(/data-contact="([^"]+)"/)[1]), ["email", "telegram", "linkedin"]);
    assert.match(links[0], /href="mailto:test@example\.com"/);
    assert.match(links[1], /href="https:\/\/t\.me\/testperson"/);
    assert.match(links[2], /href="https:\/\/www\.linkedin\.com\/in\/testperson\/"/);
    for (const link of links) assert.ok(!/target=/.test(link), `${link} must open in the same tab`);
  } finally {
    cleanup();
  }
});

test("with a counter address the page has exactly one async script tag and one data-contact click handler", async () => {
  const site = { counter: { script: "https://counter.example.com/count.js", endpoint: "https://test.counter.example.com/count" } };
  const { html, cleanup } = await buildWith(fixture("resume.full.yaml"), { siteJson: site });
  try {
    const scripts = [...html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/g)].map((m) => m[0]);
    assert.equal(scripts.length, 2, "exactly two <script> elements: the async tag and the inline handler");
    const asyncTags = scripts.filter((s) => /<script[^>]*\basync\b/.test(s));
    assert.equal(asyncTags.length, 1, "exactly one async script tag");
    assert.match(asyncTags[0], /src="https:\/\/counter\.example\.com\/count\.js"/);
    assert.match(asyncTags[0], /https:\/\/test\.counter\.example\.com\/count/, "endpoint is passed to the counter");
    const inline = scripts.find((s) => !/\bsrc=/.test(s));
    assert.ok(inline, "one inline handler");
    assert.match(inline, /data-contact/);
    assert.match(inline, /contact:/);
    assert.ok(!/preventDefault/.test(inline), "the handler never blocks the navigation");
    assert.ok(!/document\.cookie|localStorage/.test(inline), "no cookies or storage");
  } finally {
    cleanup();
  }
});

test("without a counter address the page has no <script> at all", async () => {
  for (const siteJson of [{ counter: { script: "", endpoint: "" } }, {}]) {
    const { html, cleanup } = await buildWith(fixture("resume.full.yaml"), { siteJson });
    try {
      assert.equal(count(html, /<script\b/g), 0, `no script for site.json ${JSON.stringify(siteJson)}`);
    } finally {
      cleanup();
    }
  }
});

test("src/_data/site.json exists with counter.script and counter.endpoint strings", () => {
  const site = JSON.parse(readFileSync(path.join(root, "src", "_data", "site.json"), "utf8"));
  assert.equal(typeof site.counter.script, "string");
  assert.equal(typeof site.counter.endpoint, "string");
});
