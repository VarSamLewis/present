import { SlideBundle } from "@/lib/schemas";
import { Theme, themeCssVariables } from "@/lib/generation/themes";

export function buildSlideDocument(bundle: SlideBundle, theme: Theme, tailwindCss: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
${themeCssVariables(theme)}
${bundle.content.css}
${tailwindCss}
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; width: 1600px; height: 900px; overflow: hidden; background: var(--bg); font-family: var(--font-body); }
</style>
</head>
<body>
${bundle.content.html}
</body>
</html>`;
}
