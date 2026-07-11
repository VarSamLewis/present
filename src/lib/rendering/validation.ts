import { Page } from "playwright";
import { ValidationFailure } from "@/lib/schemas";

const MIN_FONT_SIZE = 12;
const MAX_TEXT_DENSITY = 0.7;

export async function validateSlide(page: Page): Promise<ValidationFailure[]> {
  const failures: ValidationFailure[] = [];

  // Check for external resource requests.
  const externalRequests: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (url.startsWith("http") && !url.startsWith("data:")) {
      externalRequests.push(url);
    }
  });

  // Check scripts and forbidden tags.
  const forbiddenTags = await page.evaluate(() => {
    const tags = ["script", "iframe", "object", "embed", "foreignobject"];
    const found: string[] = [];
    for (const tag of tags) {
      if (document.querySelector(tag)) {
        found.push(tag);
      }
    }
    return found;
  });

  for (const tag of forbiddenTags) {
    failures.push({ rule: "forbidden-tag", message: `Slide contains forbidden <${tag}> element` });
  }

  for (const url of externalRequests) {
    failures.push({ rule: "external-resource", message: `External request blocked: ${url}` });
  }

  // Layout checks.
  const layoutFailures = await page.evaluate(({ minFontSize, maxTextDensity }) => {
    const result: ValidationFailure[] = [];
    const body = document.body;
    const viewportWidth = 1600;
    const viewportHeight = 900;

    function isOutOfViewport(rect: DOMRect): boolean {
      return rect.right > viewportWidth + 1 || rect.bottom > viewportHeight + 1 || rect.left < -1 || rect.top < -1;
    }

    const allElements = Array.from(body.querySelectorAll("*"));
    for (const el of allElements) {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);

      if (rect.width > 0 && rect.height > 0) {
        if (isOutOfViewport(rect)) {
          result.push({
            rule: "overflow",
            message: `Element extends outside the 1600x900 viewport`,
            element: el.tagName,
          });
        }

        const fontSize = parseFloat(style.fontSize);
        if (fontSize > 0 && fontSize < minFontSize) {
          result.push({
            rule: "min-font-size",
            message: `Font size ${fontSize}px is below the minimum ${minFontSize}px`,
            element: el.tagName,
          });
        }
      }
    }

    // Text density: text area vs viewport area.
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode as Text);
    }

    const totalText = textNodes.map((n) => n.textContent ?? "").join("").length;
    const density = totalText / 5000; // heuristic: ~5000 chars fills the slide
    if (density > maxTextDensity) {
      result.push({
        rule: "text-density",
        message: `Slide has excessive text density (${Math.round(density * 100)}%)`,
      });
    }

    // SVG viewBox checks.
    const svgs = Array.from(document.querySelectorAll("svg"));
    for (const svg of svgs) {
      const rect = svg.getBoundingClientRect();
      const viewBox = svg.viewBox.baseVal;
      if (viewBox && (rect.width > viewBox.width + 1 || rect.height > viewBox.height + 1)) {
        result.push({
          rule: "svg-viewbox",
          message: `SVG content exceeds its viewBox`,
          element: "svg",
        });
      }
    }

    return result;
  }, { minFontSize: MIN_FONT_SIZE, maxTextDensity: MAX_TEXT_DENSITY });

  failures.push(...layoutFailures);

  return failures;
}
