// Schema test: the real resume.yaml is valid, and an invalid file is rejected with a field-level message.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadResumeFile, loadResume, ResumeValidationError } from "../lib/resume/load.js";

test("src/_data/resume.yaml validates against resume.schema.json", () => {
  const resume = loadResumeFile();
  assert.equal(typeof resume.name, "string");
  assert.ok(resume.name.length > 0, "name must not be empty");
  assert.ok(Array.isArray(resume.sections), "sections must be an array");
});

test("a missing required field stops the load and names the field", () => {
  const broken = `
headline: Someone
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
    () => loadResume(broken, { source: "resume.yaml" }),
    (error) =>
      error instanceof ResumeValidationError &&
      error.problems.some((line) => line.includes('required field "name" is missing')),
  );
});

test("an unknown field is rejected (schema first, then YAML)", () => {
  const withTypo = `
name: Someone
headline: Someone
contacts:
  - type: email
    label: Email
    url: "mailto:a@b.c"
sections: []
experience: []
skills: []
projects: []
experiense: []
`;
  assert.throws(
    () => loadResume(withTypo),
    (error) => error instanceof ResumeValidationError && /unknown field "experiense"/.test(error.message),
  );
});

// --- Pipeline wiring (T3): schema → rules → view model ---

const validYaml = `
name: Someone
headline: Developer
facts: ["10 years"]
contacts:
  - type: email
    label: Email
    url: "mailto:a@b.c"
sections:
  - id: experience
    title: Experience
  - id: skills
    title: Skills
  - id: projects
    title: Projects
  - id: contacts
    title: Contacts
experience:
  - role: Developer
    company: Acme
    start: "2024-01"
    results: ["Shipped"]
skills: []
projects: []
`;

test("loadResume returns the view model, not the raw object", () => {
  const vm = loadResume(validYaml);
  assert.equal(vm.experience[0].current, true, "open-ended entry is marked current by the view model");
  assert.deepEqual(
    vm.sections.map((s) => s.id),
    ["experience", "contacts"],
    "empty sections are filtered out",
  );
});

test("loadResumeFile returns filtered sections for the real resume.yaml", () => {
  const vm = loadResumeFile();
  assert.ok(Array.isArray(vm.sections));
  assert.ok(vm.sections.every((s) => s.id === "contacts" || vm[s.id].length > 0));
});

test("a rule violation with a valid schema throws ResumeValidationError naming the entry", () => {
  const withCode = validYaml.replace(
    "projects: []",
    `projects:
  - kind: commercial
    name: Acme Shop
    industry: Retail
    role: Dev
    result: Done
    links:
      live: "https://acme.example.com"
      code: "https://example.org/repo"`,
  );
  assert.throws(
    () => loadResume(withCode, { source: "resume.yaml" }),
    (error) =>
      error instanceof ResumeValidationError &&
      error.problems.length === 1 &&
      error.problems[0].startsWith('resume.yaml › projects.0 "Acme Shop": the code of a commercial project is not published'),
  );
});

test("a schema error inside an array element carries the entry label", () => {
  const noRole = validYaml.replace("  - role: Developer\n    company: Acme", "  - company: Acme");
  assert.notEqual(noRole, validYaml, "fixture edit must apply");
  assert.throws(
    () => loadResume(noRole, { source: "resume.yaml" }),
    (error) =>
      error instanceof ResumeValidationError &&
      error.problems.some((line) => line.includes('experience.0 "@ Acme": required field "role" is missing')),
  );

  const noItems = validYaml.replace("skills: []", "skills:\n  - group: Backend");
  assert.throws(
    () => loadResume(noItems),
    (error) => error.problems.some((line) => line.includes('skills.0 "Backend": required field "items" is missing')),
  );

  const noUrl = validYaml.replace('    url: "mailto:a@b.c"\n', "");
  assert.throws(
    () => loadResume(noUrl),
    (error) => error.problems.some((line) => line.includes('contacts.0 "Email": required field "url" is missing')),
  );
});

test("schema errors and rule errors are not mixed: rules run only on a schema-valid object", () => {
  const broken = validYaml.replace("    results: [\"Shipped\"]\n", "").replace("name: Someone\n", "");
  assert.throws(
    () => loadResume(broken),
    (error) =>
      error.problems.some((line) => line.includes('required field "name" is missing')) &&
      !error.problems.some((line) => line.includes("has no result")),
  );
});

test("photo is optional, but when present it needs src under /assets/, alt, width and height", () => {
  const noAlt = validYaml.replace("headline: Developer\n", "headline: Developer\nphoto:\n  src: /assets/me.jpg\n  width: 300\n  height: 395\n");
  assert.throws(
    () => loadResume(noAlt),
    (error) => error.problems.some((line) => line.includes('photo: required field "alt" is missing')),
  );
  const external = validYaml.replace("headline: Developer\n", 'headline: Developer\nphoto:\n  src: "https://cdn.example.com/me.jpg"\n  alt: Me\n  width: 300\n  height: 395\n');
  assert.throws(() => loadResume(external), (error) => error.problems.some((line) => line.startsWith("resume.yaml › photo.src")));
  const ok = validYaml.replace("headline: Developer\n", "headline: Developer\nphoto:\n  src: /assets/me.jpg\n  alt: Me\n  width: 300\n  height: 395\n");
  assert.equal(loadResume(ok).photo.alt, "Me");
});

test("an education entry without a program is rejected and named by its school", () => {
  const noProgram = validYaml.replace("skills: []", 'education:\n  - school: Hillel\n    start: "2024-10"\nskills: []');
  assert.throws(
    () => loadResume(noProgram),
    (error) => error.problems.some((line) => line.includes('education.0 "Hillel": required field "program" is missing')),
  );
});

test("a linked skill item needs both label and an https url", () => {
  const noUrl = validYaml.replace("skills: []", "skills:\n  - group: Languages\n    items:\n      - label: English\n");
  assert.throws(() => loadResume(noUrl), (error) => error.problems.some((line) => line.startsWith('resume.yaml › skills.0.items.0 "Languages"')));
  const http = validYaml.replace("skills: []", 'skills:\n  - group: Languages\n    items:\n      - label: English\n        url: "http://cert.example.com/x"\n');
  assert.throws(() => loadResume(http), (error) => error.problems.some((line) => line.startsWith('resume.yaml › skills.0.items.0 "Languages"')));
});
