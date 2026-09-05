// Resume data loader: YAML text → parsed object → JSON Schema validation.
// Used by the Eleventy data extension (build) and by the tests (no site build needed).
// Any violation throws ResumeValidationError listing EVERY problem in one pass, each as
//   resume.yaml › <field path>: <rule in words>
// Cross-field rules and the view model (feature resume-page, ADR 0001/0002) plug in here later.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import yaml from "js-yaml";
import Ajv from "ajv";

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

function describe(error) {
  const where = error.instancePath ? error.instancePath.slice(1).replaceAll("/", ".") : "(root)";
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
 * Validate an already-parsed resume object against the schema.
 * @returns {object} the same object when valid
 * @throws {ResumeValidationError}
 */
export function validateResume(data, { schema = readSchema(), source = "resume.yaml" } = {}) {
  const ajv = new Ajv({ allErrors: true, strict: true });
  const validate = ajv.compile(schema);
  if (validate(data)) return data;
  const problems = validate.errors.map((e) => `${source} › ${describe(e)}`);
  throw new ResumeValidationError(problems);
}

/** Parse YAML text and validate it. */
export function loadResume(text, options = {}) {
  return validateResume(parseYaml(text), options);
}

/** Read + parse + validate the real resume.yaml from disk. */
export function loadResumeFile(resumePath = RESUME_PATH, options = {}) {
  return loadResume(readFileSync(resumePath, "utf8"), { source: path.basename(resumePath), ...options });
}
