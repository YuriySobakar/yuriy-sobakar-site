// Publish gate — cross-field rules over an already schema-valid resume object (ADR 0001).
// Pure: no I/O, no Ajv. Returns one line per violation:
//   <path> "<entry label>": <rule in words>
// load.js prefixes each line with `resume.yaml ›` and throws ResumeValidationError.
// A new cross-field invariant = one function here + one test in test/resume-rules.test.js.
import { hostOf, isCodeHost } from "./code-hosts.js";

const RULES = {
  noResult: "experience entry has no result — add at least one item to results",
  noIndustry: "commercial project has no industry — industry is required and stays visible when confidential",
  codeLink: "the code of a commercial project is not published — remove links.code",
  codeHostLink: (host) => `the code of a commercial project is not published — link points to code host ${host}`,
  confidentialPet: "confidential is only valid for a commercial project — a pet project is never hidden, drop confidential",
};

/** `role @ company`; a missing half is left blank (`@ Acme`) so the owner still recognises the entry. */
export function experienceLabel(job) {
  if (!job.role && !job.company) return `#${job.start ?? "?"}`;
  return `${job.role ?? ""} @ ${job.company ?? ""}`.trim();
}

export function projectLabel(project) {
  return project.name ?? project.industry ?? project.kind ?? "?";
}

function violation(path, label, rule) {
  return `${path} "${label}": ${rule}`;
}

function experienceRules(experience = []) {
  const problems = [];
  experience.forEach((job, i) => {
    if (!Array.isArray(job.results) || job.results.length === 0) {
      problems.push(violation(`experience.${i}`, experienceLabel(job), RULES.noResult));
    }
  });
  return problems;
}

function projectRules(projects = []) {
  const problems = [];
  projects.forEach((project, i) => {
    const path = `projects.${i}`;
    const label = projectLabel(project);
    if (project.kind !== "commercial") {
      // confidential is a commercial-only mark (CONTEXT.md); on a pet project it would blank the card.
      if (project.confidential) problems.push(violation(path, label, RULES.confidentialPet));
      return;
    }
    if (!project.industry) problems.push(violation(path, label, RULES.noIndustry));
    const links = project.links ?? {};
    if (links.code) {
      problems.push(violation(path, label, RULES.codeLink));
    }
    for (const [key, url] of Object.entries(links)) {
      if (key === "code") continue;
      if (isCodeHost(url)) problems.push(violation(path, label, RULES.codeHostLink(hostOf(url))));
    }
  });
  return problems;
}

/**
 * Check every cross-field rule in one pass.
 * @param {object} data schema-valid resume data
 * @returns {string[]} violations, empty when the data may be published
 */
export function checkRules(data) {
  return [...experienceRules(data.experience), ...projectRules(data.projects)];
}
