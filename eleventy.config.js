// Eleventy 3 configuration — the single wiring point of the site.
// Input: src/ (Nunjucks templates + _data, passed as --input=src by the npm scripts), output: _site/.
// resume.yaml is parsed AND validated against resume.schema.json here (data extension);
// an invalid file stops the build with a field-level message instead of publishing an empty section.
import path from "node:path";
import { parseYaml, loadResume } from "./lib/resume/load.js";

export default function (eleventyConfig) {
  eleventyConfig.addDataExtension("yaml,yml", (contents, filePath) => {
    if (path.basename(filePath) === "resume.yaml") {
      return loadResume(contents, { source: "src/_data/resume.yaml" });
    }
    return parseYaml(contents);
  });

  // Explicit output names: the input dir may be an absolute path (programmatic builds in tests),
  // so the copies must not depend on stripping a relative input prefix.
  eleventyConfig.addPassthroughCopy({ "src/styles": "styles" });
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  // Dev server: full page reload instead of in-place DOM diffing — the diff left stale styles on the
  // page after CSS/template edits (skills rendered as a plain list until a manual refresh).
  eleventyConfig.setServerOptions({ domDiff: false });

  eleventyConfig.setNunjucksEnvironmentOptions({
    autoescape: true,
    throwOnUndefined: false,
  });

  // Input and output are NOT set here on purpose: `dir.input` / `dir.output` returned from the
  // config override programmatic callers, and test/build.test.js renders a temp copy of src/
  // (fixture resume.yaml) into a temp output folder. The npm scripts pass `--input=src`;
  // output stays Eleventy's default `_site/` (what netlify.toml publishes).
  return {
    dir: {
      includes: "_includes",
      data: "_data",
    },
    templateFormats: ["njk"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: false,
  };
}
