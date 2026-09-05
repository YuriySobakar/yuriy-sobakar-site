// Eleventy 3 configuration — the single wiring point of the site.
// Input: src/ (Nunjucks templates + _data), output: _site/.
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

  eleventyConfig.addPassthroughCopy("src/styles");
  eleventyConfig.addPassthroughCopy("src/assets");

  eleventyConfig.setNunjucksEnvironmentOptions({
    autoescape: true,
    throwOnUndefined: false,
  });

  // Output stays Eleventy's default `_site/` (also what netlify.toml publishes). It is NOT set here
  // on purpose: a `dir.output` returned from the config overrides programmatic callers, and
  // test/build.test.js needs to render into a temp folder.
  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
    },
    templateFormats: ["njk"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: false,
  };
}
