// Build smoke test: Eleventy renders the site into a temp folder; index.html exists and contains the name.
// Also guards the XSS convention: no `| safe` filter inside section partials.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, existsSync, readdirSync, rmSync, cpSync, writeFileSync } from "node:fs";
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

// --- Builds from fixture data: copy src/ to a temp folder, swap _data/resume.yaml, render there ---

async function buildWith(resumeYaml, { siteJson } = {}) {
  const work = mkdtempSync(path.join(tmpdir(), "yuriy-sobakar-site-src-"));
  const out = mkdtempSync(path.join(tmpdir(), "yuriy-sobakar-site-out-"));
  const src = path.join(work, "src");
  cpSync(path.join(root, "src"), src, { recursive: true });
  writeFileSync(path.join(src, "_data", "resume.yaml"), resumeYaml);
  if (siteJson !== undefined) writeFileSync(path.join(src, "_data", "site.json"), JSON.stringify(siteJson));
  const cleanup = () => {
    rmSync(work, { recursive: true, force: true });
    rmSync(out, { recursive: true, force: true });
  };
  try {
    const eleventy = new Eleventy(src, out, { configPath: path.join(root, "eleventy.config.js"), quietMode: true });
    await eleventy.write();
    const indexPath = path.join(out, "index.html");
    const html = existsSync(indexPath) ? readFileSync(indexPath, "utf8") : null;
    return { html, out, cleanup };
  } catch (error) {
    error.indexWritten = existsSync(path.join(out, "index.html"));
    cleanup();
    throw error;
  }
}

const FIXTURE_HEAD = `
name: Test Person
headline: Test headline
facts: ["Fact one", "Fact two", "Fact three"]
contacts:
  - type: email
    label: Email
    url: "mailto:test@example.com"
  - type: telegram
    label: Telegram
    url: "https://t.me/testperson"
  - type: linkedin
    label: LinkedIn
    url: "https://www.linkedin.com/in/testperson/"
sections:
  - id: experience
    title: Experience
  - id: skills
    title: Skills
  - id: projects
    title: Projects
  - id: contacts
    title: Contacts
`;

// --- SCR-03 experience (T6): view-model order, Present for the current role ---

test("experience entries render newest first, with Present for the open-ended one", async () => {
  const yaml = `${FIXTURE_HEAD}
experience:
  - role: Mid Developer
    company: Beta Corp
    start: "2023-01"
    end: "2025-02"
    results: ["Result mid"]
  - role: Lead Developer
    company: Gamma LLC
    start: "2025-03"
    results: ["Result lead", "Second result lead"]
  - role: Junior Developer
    company: Alpha Inc
    start: "2019-06"
    end: "2022-12"
    results: ["Result junior"]
skills: []
projects: []
`;
  const { html, cleanup } = await buildWith(yaml);
  try {
    const section = html.slice(html.indexOf('id="experience"'), html.indexOf("</section>", html.indexOf('id="experience"')));
    const roles = [...section.matchAll(/<h3[^>]*>([^<]*)<\/h3>/g)].map((m) => m[1].trim());
    assert.deepEqual(roles, ["Lead Developer", "Mid Developer", "Junior Developer"]);
    const items = section.split('class="timeline-item"').slice(1);
    assert.equal(items.length, 3);
    assert.match(items[0], /Gamma LLC/);
    assert.match(items[0], /2025-03 – Present/);
    assert.match(items[1], /2023-01 – 2025-02/);
    assert.ok(!/Present/.test(items[1]), "closed period has no Present");
    assert.match(items[0], /Second result lead/);
    assert.equal(count(items[0], /timeline-item__meta/g), 1, "period line uses the small-text meta class");
  } finally {
    cleanup();
  }
});

test("experience.njk has no hiding conditions and reads job.current, not job.end, for Present", () => {
  const source = readFileSync(path.join(root, "src", "_includes", "sections", "experience.njk"), "utf8");
  assert.ok(!/\{%\s*if\s+resume\.experience/.test(source), "no section-level hiding condition");
  assert.ok(!/\{%\s*if\s+job\.results/.test(source), "no results hiding condition");
  assert.ok(!/job\.end\s+else|if\s+job\.end/.test(source), "Present is decided by job.current");
  assert.match(source, /job\.current/);
  assert.ok(!/\|\s*sort/.test(source), "no sort filter in the template");
});

// --- SCR-04 skills (T7): groups in YAML order inside .skill-groups, empty group absent, no scales ---

test("skill groups render in order inside .skill-groups, without the empty group or any scale", async () => {
  const yaml = `${FIXTURE_HEAD}
experience: []
skills:
  - group: Group Alpha
    items: ["PHP", "WordPress"]
  - group: Group Bravo
    items: []
  - group: Group Charlie
    items: ["CSS"]
projects: []
`;
  const { html, cleanup } = await buildWith(yaml);
  try {
    const start = html.indexOf('id="skills"');
    const section = html.slice(start, html.indexOf("</section>", start));
    assert.match(section, /<div class="skill-groups">/, "groups are wrapped in the .skill-groups grid");
    const groups = [...section.matchAll(/<h3[^>]*>([^<]*)<\/h3>/g)].map((m) => m[1].trim());
    assert.deepEqual(groups, ["Group Alpha", "Group Charlie"]);
    assert.ok(!section.includes("Group Bravo"), "empty group is absent");
    assert.equal(count(section, /class="tag"/g), 3, "one tag per skill");
    assert.ok(!/<progress|<meter|\d+\s*%/.test(section), "no levels, percentages or scales");
  } finally {
    cleanup();
  }
});

test("skills.njk has no hiding conditions", () => {
  const source = readFileSync(path.join(root, "src", "_includes", "sections", "skills.njk"), "utf8");
  assert.ok(!/\{%\s*if\s+resume\.skills/.test(source), "no section-level hiding condition");
  assert.ok(!/\{%\s*if\s+group\.items/.test(source), "no group-level hiding condition");
  assert.match(source, /class="skill-groups"/);
});

// --- SCR-05 projects (T8): commercial / pet / confidential cards ---

const PROJECTS_YAML = `${FIXTURE_HEAD}
experience: []
skills: []
projects:
  - kind: commercial
    name: Acme Storefront
    industry: Retail
    role: Full-stack developer
    result: Commercial result marker
    stack: ["WordPress", "PHP"]
    links:
      live: "https://acme-storefront.example.com"
  - kind: pet
    name: Toy Tracker
    role: Author
    result: Pet result marker
    stack: ["Eleventy"]
    links:
      live: "https://toy-tracker.example.com"
      code: "https://github.com/testperson/toy-tracker"
  - kind: commercial
    confidential: true
    name: SecretClientCo
    industry: Healthcare
    role: WordPress developer
    result: Confidential result marker
    stack: ["SecretStackTech"]
    links:
      live: "https://secretclientco.example.com"
`;

test("project cards: commercial has Live only, pet has Live + Code, confidential shows industry + Confidential", async () => {
  const { html, cleanup } = await buildWith(PROJECTS_YAML);
  try {
    const start = html.indexOf('id="projects"');
    const section = html.slice(start, html.indexOf("</section>", start));
    const cards = section.split('class="card"').slice(1);
    assert.equal(cards.length, 3);
    const [commercial, pet, confidential] = cards;

    assert.match(commercial, /Acme Storefront/);
    assert.match(commercial, /Retail/);
    assert.match(commercial, /Full-stack developer/);
    assert.match(commercial, /Commercial result marker/);
    assert.equal(count(commercial, /class="tag"/g), 2, "stack chips");
    assert.match(commercial, /href="https:\/\/acme-storefront\.example\.com"[^>]*>\s*Live/);
    assert.ok(!/>\s*Code\s*</.test(commercial), "commercial card has no Code button");

    assert.match(pet, /Toy Tracker/);
    assert.match(pet, /href="https:\/\/toy-tracker\.example\.com"[^>]*>\s*Live/);
    assert.match(pet, /href="https:\/\/github\.com\/testperson\/toy-tracker"[^>]*>\s*Code/);

    assert.match(confidential, /<h3[^>]*>\s*Healthcare/);
    assert.match(confidential, /Confidential/);
    assert.match(confidential, /WordPress developer/);
    assert.match(confidential, /Confidential result marker/);
    assert.ok(!/href=/.test(confidential), "confidential card has no links");

    for (const link of section.matchAll(/<a [^>]*>/g)) {
      assert.match(link[0], /target="_blank"/, `${link[0]} opens in a new tab`);
      assert.match(link[0], /rel="noopener noreferrer"/, `${link[0]} has rel`);
    }

    for (const secret of ["SecretClientCo", "secretclientco.example.com", "SecretStackTech"]) {
      assert.ok(!html.includes(secret), `${secret} leaked into the HTML`);
    }
  } finally {
    cleanup();
  }
});

test("projects.njk hides nothing by confidential flag except the heading/chip variant", () => {
  const source = readFileSync(path.join(root, "src", "_includes", "sections", "projects.njk"), "utf8");
  assert.ok(!/\{%\s*if\s+resume\.projects/.test(source), "no section-level hiding condition");
  assert.ok(!/if\s+not\s+project\.confidential|confidential\s*==\s*false|not\s+project\.confidential/.test(source), "no 'hide when confidential' logic");
  assert.match(source, /rel="noopener noreferrer"/);
});

// --- SCR-06 contacts + click counter (T9, ADR 0003) ---

const CONTACTS_YAML = `${FIXTURE_HEAD}
experience: []
skills: []
projects: []
`;

test("footer contacts: one same-tab button per contact type with data-contact", async () => {
  const { html, cleanup } = await buildWith(CONTACTS_YAML, { siteJson: { counter: { script: "", endpoint: "" } } });
  try {
    const footer = html.slice(html.indexOf("<footer"), html.indexOf("</footer>"));
    const links = [...footer.matchAll(/<a [^>]*>/g)].map((m) => m[0]);
    assert.equal(links.length, 3);
    assert.deepEqual(
      links.map((l) => l.match(/data-contact="([^"]+)"/)[1]),
      ["email", "telegram", "linkedin"],
    );
    assert.match(links[0], /href="mailto:test@example\.com"/);
    assert.match(links[1], /href="https:\/\/t\.me\/testperson"/);
    assert.match(links[2], /href="https:\/\/www\.linkedin\.com\/in\/testperson\/"/);
    for (const link of links) assert.ok(!/target=/.test(link), `${link} must open in the same tab`);
    const source = readFileSync(path.join(root, "src", "_includes", "sections", "contacts.njk"), "utf8");
    assert.ok(!/\{%\s*if\s+resume\.contacts/.test(source), "no hiding condition in contacts.njk");
  } finally {
    cleanup();
  }
});

test("with a counter address the page has exactly one async script tag and one data-contact click handler", async () => {
  const site = { counter: { script: "https://counter.example.com/count.js", endpoint: "https://test.counter.example.com/count" } };
  const { html, cleanup } = await buildWith(CONTACTS_YAML, { siteJson: site });
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
    const { html, cleanup } = await buildWith(CONTACTS_YAML, { siteJson });
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
