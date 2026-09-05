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
