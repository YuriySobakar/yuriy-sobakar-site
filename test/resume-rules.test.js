// Publish gate rules (ADR 0001): cross-field invariants the schema cannot express well.
// Each violation is one line `<path> "<entry label>": <rule in words>`; load.js adds the `resume.yaml ›` prefix.
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkRules } from "../lib/resume/rules.js";
import { isCodeHost, CODE_HOSTS } from "../lib/resume/code-hosts.js";
import { loadResume, ResumeValidationError } from "../lib/resume/load.js";

const job = (overrides = {}) => ({
  role: "Developer",
  company: "Acme",
  start: "2024-01",
  results: ["Shipped a thing"],
  ...overrides,
});

const commercial = (overrides = {}) => ({
  kind: "commercial",
  name: "Acme Shop",
  industry: "Retail",
  role: "Full-stack developer",
  result: "Doubled conversion",
  links: { live: "https://acme.example.com" },
  ...overrides,
});

const base = (overrides = {}) => ({
  name: "Someone",
  headline: "Developer",
  facts: ["10 years"],
  contacts: [{ type: "email", label: "Email", url: "mailto:a@b.c" }],
  sections: [],
  experience: [job()],
  skills: [],
  projects: [commercial()],
  ...overrides,
});

test("valid data yields no rule violations", () => {
  assert.deepEqual(checkRules(base()), []);
});

test("an experience entry without results is one violation naming the entry", () => {
  const problems = checkRules(base({ experience: [job(), job({ role: "Lead", company: "Beta", results: [] })] }));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /^experience\.1 "Lead @ Beta": /);
  assert.match(problems[0], /experience entry has no result/);

  const missing = checkRules(base({ experience: [job({ results: undefined })] }));
  assert.equal(missing.length, 1);
  assert.match(missing[0], /^experience\.0 "Developer @ Acme": /);
});

test("a commercial project without industry is one violation naming the project", () => {
  const problems = checkRules(base({ projects: [commercial({ industry: undefined })] }));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /^projects\.0 "Acme Shop": commercial project has no industry/);
});

test("a pet project without industry is fine", () => {
  const pet = { kind: "pet", name: "Toy", role: "Author", result: "Fun", links: { live: "https://toy.example.com", code: "https://github.com/me/toy" } };
  assert.deepEqual(checkRules(base({ projects: [pet] })), []);
});

test("confidential on a pet project is one violation — confidential is a commercial-only mark", () => {
  const pet = { kind: "pet", confidential: true, name: "Toy", role: "Author", result: "Fun", links: { live: "https://toy.example.com" } };
  const problems = checkRules(base({ projects: [pet] }));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /^projects\.0 "Toy": confidential is only valid for a commercial project/);

  // confidential: false on a pet project is not a violation
  assert.deepEqual(checkRules(base({ projects: [{ ...pet, confidential: false }] })), []);
});

test("a commercial project with links.code is one violation with the rule in words", () => {
  const problems = checkRules(
    base({ projects: [commercial({ links: { live: "https://acme.example.com", code: "https://example.org/repo" } })] }),
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /^projects\.0 "Acme Shop": the code of a commercial project is not published/);
});

test("a commercial project whose live link points to a code host is a violation naming the domain", () => {
  const problems = checkRules(base({ projects: [commercial({ links: { live: "https://gist.github.com/acme/site" } })] }));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /the code of a commercial project is not published/);
  assert.match(problems[0], /gist\.github\.com/);
});

test("the project label falls back to industry when there is no name", () => {
  const problems = checkRules(
    base({ projects: [commercial({ name: undefined, confidential: true, links: { live: "https://gitlab.com/x/y" } })] }),
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /^projects\.0 "Retail": /);
});

test("all violations are reported in one pass", () => {
  const problems = checkRules(
    base({
      experience: [job({ results: [] })],
      projects: [commercial({ industry: undefined, links: { live: "https://bitbucket.org/a/b" } })],
    }),
  );
  assert.equal(problems.length, 3);
});

test("isCodeHost matches code hosts and their subdomains, not hosting pages", () => {
  for (const host of CODE_HOSTS) assert.ok(isCodeHost(`https://${host}/x/y`), host);
  assert.ok(isCodeHost("https://gist.github.com/x"));
  assert.ok(isCodeHost("http://www.gitlab.com/x"));
  assert.ok(isCodeHost("https://dev.azure.com/org/project/_git/repo"));
  assert.equal(isCodeHost("https://client.github.io/"), false);
  assert.equal(isCodeHost("https://docs.gitlab.io/"), false);
  assert.equal(isCodeHost("https://x.pages.dev/"), false);
  assert.equal(isCodeHost("https://example.com/github.com"), false);
  assert.equal(isCodeHost("https://notgithub.com/"), false);
  assert.equal(isCodeHost("not a url"), false);
});

test("the schema requires 1–3 facts", () => {
  const yamlWith = (facts) => `
name: Someone
headline: Developer
facts: ${facts}
contacts:
  - type: email
    label: Email
    url: "mailto:a@b.c"
sections: []
experience: []
skills: []
projects: []
`;
  assert.throws(
    () => loadResume(yamlWith("[]")),
    (e) => e instanceof ResumeValidationError && e.problems.some((l) => /facts: must have at least 1 item/.test(l)),
  );
  assert.throws(
    () => loadResume(yamlWith('["a", "b", "c", "d"]')),
    (e) => e instanceof ResumeValidationError && e.problems.some((l) => /facts: must have at most 3 item/.test(l)),
  );
  assert.throws(
    () => loadResume(yamlWith("").replace("facts: \n", "")),
    (e) => e instanceof ResumeValidationError && e.problems.some((l) => /required field "facts" is missing/.test(l)),
  );
  assert.ok(loadResume(yamlWith('["one fact"]')));
});
