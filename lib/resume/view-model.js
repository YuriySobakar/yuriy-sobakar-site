// View model — the safe presentation of resume data that templates receive (ADR 0002).
// Pure and non-mutating: input is schema- and rules-valid resume data.
//   - experience: sorted by start descending; an entry without end gets current: true
//   - skills: original order, empty groups removed
//   - projects: original order; confidential → name/links/stack removed; commercial → links.code removed
//   - sections: entries whose content is empty are removed; order and titles come from YAML
// Anything a template wants to show is computed HERE, never with conditions in .njk files.

function sortExperience(experience = []) {
  return experience
    .map((job) => {
      const copy = structuredClone(job);
      if (!copy.end) copy.current = true;
      return copy;
    })
    .sort((a, b) => (a.start < b.start ? 1 : a.start > b.start ? -1 : 0));
}

function nonEmptyGroups(skills = []) {
  return skills.filter((group) => Array.isArray(group.items) && group.items.length > 0).map((group) => structuredClone(group));
}

const CONFIDENTIAL_SECRETS = ["name", "links", "stack"];

function presentProject(project) {
  const copy = structuredClone(project);
  if (copy.confidential) {
    for (const key of CONFIDENTIAL_SECRETS) delete copy[key];
    return copy;
  }
  if (copy.kind === "commercial" && copy.links) delete copy.links.code;
  return copy;
}

const SECTION_CONTENT = {
  experience: (vm) => vm.experience,
  skills: (vm) => vm.skills,
  projects: (vm) => vm.projects,
  contacts: (vm) => vm.contacts,
};

function visibleSections(sections = [], vm) {
  return sections
    .filter((section) => {
      const content = SECTION_CONTENT[section.id]?.(vm);
      return Array.isArray(content) && content.length > 0;
    })
    .map((section) => structuredClone(section));
}

/**
 * @param {object} data valid resume data
 * @returns {object} the view model for templates
 */
export function buildViewModel(data) {
  const vm = {
    ...structuredClone(data),
    experience: sortExperience(data.experience),
    skills: nonEmptyGroups(data.skills),
    projects: (data.projects ?? []).map(presentProject),
  };
  vm.sections = visibleSections(data.sections, vm);
  return vm;
}
