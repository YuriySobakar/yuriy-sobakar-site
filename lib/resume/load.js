// Resume data loader — the publish gate pipeline: YAML text → schema → rules → view model.
// Used by the Eleventy data extension (build) and by the tests (no site build needed).
// Any violation throws ResumeValidationError listing EVERY problem of the failing stage in one pass:
//   resume.yaml › <field path> "<entry label>": <rule in words>
// Rules (ADR 0001) run only on a schema-valid object; templates receive the view model (ADR 0002).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import yaml from "js-yaml";
import Ajv from "ajv";
import { checkRules, experienceLabel, projectLabel } from "./rules.js";
import { buildViewModel } from "./view-model.js";

const here = path.dirname(fileURLToPath(import.meta.url));
export const SCHEMA_PATH = path.resolve(here, "../../src/_data/resume.schema.json");
export const RESUME_PATH = path.resolve(here, "../../src/_data/resume.yaml");

export class ResumeValidationError extends Error {
  /** @param {string[]} problems one line per violation */
  constructor(problems) {
    super(`resume data is invalid — the build was stopped:\n  ${problems.join("\n  ")}`);
    this.name = "ResumeValidationError";
    this.problems = problems;
  }
}

export function readSchema(schemaPath = SCHEMA_PATH) {
  return JSON.parse(readFileSync(schemaPath, "utf8"));
}

export function parseYaml(text) {
  return yaml.load(text) ?? {};
}

// Label of the array element an error points into (AC-03b: name the entry, not just the index).
const ENTRY_LABELS = {
  experience: experienceLabel,
  projects: projectLabel,
  skills: (group) => group.group,
  contacts: (contact) => contact.label,
  education: (entry) => entry.school,
};

function entryLabel(data, segments) {
  const [collection, index] = segments;
  const entry = data?.[collection]?.[index];
  const labelOf = ENTRY_LABELS[collection];
  if (!labelOf || !entry || typeof entry !== "object") return "";
  const label = labelOf(entry);
  return label ? ` "${label}"` : "";
}

function describe(error, data) {
  const segments = error.instancePath ? error.instancePath.slice(1).split("/") : [];
  const where = segments.length ? segments.join(".") + entryLabel(data, segments) : "(root)";
  switch (error.keyword) {
    case "required":
      return `${where}: required field "${error.params.missingProperty}" is missing`;
    case "additionalProperties":
      return `${where}: unknown field "${error.params.additionalProperty}" — add it to resume.schema.json first`;
    case "minLength":
      return `${where}: must not be empty`;
    case "minItems":
      return `${where}: must have at least ${error.params.limit} item(s)`;
    case "maxItems":
      return `${where}: must have at most ${error.params.limit} item(s)`;
    default:
      return `${where}: ${error.message}`;
  }
}

/**
 * Publish gate: validate an already-parsed resume object — schema first, then the cross-field rules.
 * Each stage reports all of its violations together; rules run only when the schema passed.
 * @returns {object} the same (raw) object when it may be published
 * @throws {ResumeValidationError}
 */
export function validateResume(data, { schema = readSchema(), source = "resume.yaml" } = {}) {
  const ajv = new Ajv({ allErrors: true, strict: true });
  const validate = ajv.compile(schema);
  const problems = validate(data) ? checkRules(data) : validate.errors.map((e) => describe(e, data));
  if (problems.length) throw new ResumeValidationError(problems.map((line) => `${source} › ${line}`));
  return data;
}

/** Parse YAML text, run the publish gate and return the view model for templates. */
export function loadResume(text, options = {}) {
  return buildViewModel(validateResume(parseYaml(text), options));
}

/** Read + parse + validate the real resume.yaml from disk. */
export function loadResumeFile(resumePath = RESUME_PATH, options = {}) {
  return loadResume(readFileSync(resumePath, "utf8"), { source: path.basename(resumePath), ...options });
}
