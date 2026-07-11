import fs from "fs";
import path from "path";
import { chromium, Browser } from "playwright";
import { SlideBundle } from "@/lib/schemas";
import { Theme } from "@/lib/generation/themes";
import { ValidationFailure } from "@/lib/schemas";
import { validateSlide } from "@/lib/rendering/validation";
import { buildSlideDocument } from "@/lib/rendering/document";

let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium.launch({ headless: true });
  }
  return browserPromise;
}

function getSlideCss(): string {
  const cssPath = path.join(process.cwd(), "public", "slide-tailwind.css");
  if (fs.existsSync(cssPath)) {
    return fs.readFileSync(cssPath, "utf-8");
  }
  return "";
}

export async function renderSlideToFailures(bundle: SlideBundle, theme: Theme): Promise<ValidationFailure[]> {
  const html = buildSlideDocument(bundle, theme, getSlideCss());
  const browser = await getBrowser();
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();

  try {
    await page.setContent(html, { waitUntil: "networkidle" });
    const failures = await validateSlide(page);
    await context.close();
    return failures;
  } catch (error) {
    await context.close();
    return [{ rule: "render", message: String(error) }];
  }
}

export async function captureSlideScreenshot(bundle: SlideBundle, theme: Theme, outputPath: string): Promise<void> {
  const html = buildSlideDocument(bundle, theme, getSlideCss());
  const browser = await getBrowser();
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();

  await page.setContent(html, { waitUntil: "networkidle" });
  await page.screenshot({ path: outputPath, type: "png" });
  await context.close();
}

export async function exportSlideToPdf(
  bundle: SlideBundle,
  theme: Theme,
  outputPath: string,
  pageSize: { width: string; height: string }
): Promise<void> {
  const html = buildSlideDocument(bundle, theme, getSlideCss());
  const browser = await getBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.setContent(html, { waitUntil: "networkidle" });
  await page.pdf({
    path: outputPath,
    width: pageSize.width,
    height: pageSize.height,
    printBackground: true,
    preferCSSPageSize: false,
  });
  await context.close();
}

export { buildSlideDocument };
