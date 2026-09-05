// View model (ADR 0002): the safe presentation templates receive instead of raw resume data.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildViewModel } from "../lib/resume/view-model.js";

const sections = [
  { id: "experience", title: "Experience" },
  { id: "skills", title: "Skills" },
  { id: "projects", title: "Projects" },
  { id: "contacts", title: "Contacts" },
];

const data = (overrides = {}) => ({
  name: "Someone",
  headline: "Developer",
  facts: ["10 years"],
  contacts: [{ type: "email", label: "Email", url: "mailto:a@b.c" }],
  sections,
  experience: [
    { role: "Mid", company: "B", start: "2023-01", end: "2025-02", results: ["r1"] },
    { role: "Lead", company: "C", start: "2025-03", results: ["r2"] },
    { role: "Junior", company: "A", start: "2019-06", end: "2022-12", results: ["r3"] },
  ],
  skills: [
    { group: "Backend", items: ["PHP"] },
    { group: "Empty", items: [] },
    { group: "Frontend", items: ["CSS", "JS"] },
  ],
  projects: [
    { kind: "commercial", name: "Acme Shop", industry: "Retail", role: "Dev", result: "x", stack: ["PHP"], links: { live: "https://acme.example.com" } },
    {
      kind: "commercial",
      confidential: true,
      name: "Secret Client",
      industry: "Healthcare",
      role: "WordPress developer",
      result: "y",
      stack: ["WordPress"],
      links: { live: "https://secret.example.com" },
    },
    { kind: "pet", name: "Toy", role: "Author", result: "z", links: { live: "https://toy.example.com", code: "https://github.com/me/toy" } },
  ],
  ...overrides,
});

test("experience is sorted by start descending and open-ended entries are marked current", () => {
  const vm = buildViewModel(data());
  assert.deepEqual(
    vm.experience.map((j) => j.start),
    ["2025-03", "2023-01", "2019-06"],
  );
  assert.equal(vm.experience[0].current, true);
  assert.ok(!vm.experience[1].current);
  assert.ok(!vm.experience[2].current);
  assert.equal(vm.experience[1].end, "2025-02");
});

test("skills keep their order and drop empty groups", () => {
  const vm = buildViewModel(data());
  assert.deepEqual(
    vm.skills.map((g) => g.group),
    ["Backend", "Frontend"],
  );
  assert.deepEqual(vm.skills[1].items, [{ label: "CSS" }, { label: "JS" }], "string items become {label}");
});

test("a skill item with a url keeps label and url (a linked chip, e.g. a certificate)", () => {
  const vm = buildViewModel(data({ skills: [{ group: "Languages", items: [{ label: "English — B2", url: "https://cert.example.com/x" }, "Ukrainian"] }] }));
  assert.deepEqual(vm.skills[0].items, [{ label: "English — B2", url: "https://cert.example.com/x" }, { label: "Ukrainian" }]);
});

test("a confidential project loses name, links and stack but keeps industry, role, result", () => {
  const vm = buildViewModel(data());
  const [commercial, confidential, pet] = vm.projects;
  assert.equal(vm.projects.length, 3);

  const keys = Object.keys(confidential);
  for (const secret of ["name", "links", "stack"]) assert.ok(!keys.includes(secret), `confidential still has ${secret}`);
  assert.equal(confidential.confidential, true);
  assert.equal(confidential.industry, "Healthcare");
  assert.equal(confidential.role, "WordPress developer");
  assert.equal(confidential.result, "y");
  assert.ok(!JSON.stringify(vm).includes("Secret Client"));
  assert.ok(!JSON.stringify(vm).includes("secret.example.com"));

  assert.equal(commercial.name, "Acme Shop");
  assert.deepEqual(commercial.links, { live: "https://acme.example.com" });
  assert.deepEqual(commercial.stack, ["PHP"]);
  assert.equal(pet.links.code, "https://github.com/me/toy");
});

test("a non-confidential commercial project never carries links.code (second barrier)", () => {
  const vm = buildViewModel(
    data({
      projects: [{ kind: "commercial", name: "Acme", industry: "Retail", role: "Dev", result: "x", links: { live: "https://a.example.com", code: "https://example.org/repo" } }],
    }),
  );
  assert.deepEqual(vm.projects[0].links, { live: "https://a.example.com" });
});

test("sections whose content is empty are removed, others keep the YAML order and titles", () => {
  const full = buildViewModel(data());
  assert.deepEqual(
    full.sections.map((s) => s.id),
    ["experience", "skills", "projects", "contacts"],
  );
  assert.equal(full.sections[0].title, "Experience");

  const noExperience = buildViewModel(data({ experience: [] }));
  assert.deepEqual(
    noExperience.sections.map((s) => s.id),
    ["skills", "projects", "contacts"],
  );

  const allGroupsEmpty = buildViewModel(data({ skills: [{ group: "A", items: [] }, { group: "B", items: [] }] }));
  assert.deepEqual(
    allGroupsEmpty.sections.map((s) => s.id),
    ["experience", "projects", "contacts"],
  );
  assert.deepEqual(allGroupsEmpty.skills, []);

  const nothing = buildViewModel(data({ experience: [], skills: [], projects: [] }));
  assert.deepEqual(
    nothing.sections.map((s) => s.id),
    ["contacts"],
  );
});

test("name, headline, facts and contacts pass through unchanged", () => {
  const input = data();
  const vm = buildViewModel(input);
  assert.equal(vm.name, "Someone");
  assert.equal(vm.headline, "Developer");
  assert.deepEqual(vm.facts, ["10 years"]);
  assert.deepEqual(vm.contacts, input.contacts);
});

test("the input object is not mutated", () => {
  const input = data();
  const snapshot = structuredClone(input);
  buildViewModel(input);
  assert.deepEqual(input, snapshot);
});

test("education is sorted by start descending, open-ended entries are current, and its section shows only when present", () => {
  const withEdu = data({
    sections: [...sections, { id: "education", title: "Education" }],
    education: [
      { school: "B", program: "Second", start: "2024-10", end: "2025-03" },
      { school: "C", program: "Third", start: "2025-07" },
      { school: "A", program: "First", start: "2002-09", end: "2006-06" },
    ],
  });
  const vm = buildViewModel(withEdu);
  assert.deepEqual(vm.education.map((e) => e.program), ["Third", "Second", "First"]);
  assert.equal(vm.education[0].current, true);
  assert.equal(vm.education[1].current, undefined);
  assert.ok(vm.sections.some((s) => s.id === "education"), "education section is visible with entries");

  const withoutEdu = buildViewModel(data({ sections: [...sections, { id: "education", title: "Education" }] }));
  assert.ok(!withoutEdu.sections.some((s) => s.id === "education"), "education section disappears without entries");
});
