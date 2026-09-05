// Code-hosting domains (sad.md §8 «Заборона коду commercial project», AC-05).
// A link whose host equals one of these or is a subdomain of it points at source code.
// Static hosting pages (*.github.io, *.gitlab.io, *.pages.dev) are live sites, not code — allowed.
export const CODE_HOSTS = Object.freeze([
  "github.com",
  "gitlab.com",
  "bitbucket.org",
  "codeberg.org",
  "git.sr.ht",
  "gitee.com",
  "dev.azure.com",
]);

export const HOSTING_PAGE_SUFFIXES = Object.freeze(["github.io", "gitlab.io", "pages.dev"]);

function hostMatches(host, domain) {
  return host === domain || host.endsWith(`.${domain}`);
}

/** @returns {string|null} the hostname of the URL, or null when it is not an absolute URL */
export function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/** True when the URL points at a code-hosting service (or any subdomain of one). */
export function isCodeHost(url) {
  const host = hostOf(url);
  if (!host) return false;
  if (HOSTING_PAGE_SUFFIXES.some((suffix) => hostMatches(host, suffix))) return false;
  return CODE_HOSTS.some((domain) => hostMatches(host, domain));
}
