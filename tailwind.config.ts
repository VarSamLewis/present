import type { Config } from "tailwindcss";

const spacing = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96];
const colors = ["slate", "gray", "zinc", "neutral", "stone", "red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal", "cyan", "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose"];
const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

function pattern(base: string, values: (string | number)[]): { pattern: RegExp }[] {
  return [{ pattern: new RegExp(`^${base}-(${values.join("|")})$`) }];
}

const safelist: { pattern: RegExp }[] = [
  // Layout
  { pattern: /^(flex|grid|block|inline-block|hidden|relative|absolute|fixed|container|mx-auto|w-full|h-full|w-screen|h-screen|min-w-full|min-h-full|max-w-full|max-h-full)$/ },
  { pattern: /^(flex-row|flex-col|flex-wrap|flex-nowrap|flex-1|flex-auto|flex-none|flex-shrink-0|flex-grow)$/ },
  { pattern: /^(items|justify|content)-(start|center|end|between|around|evenly|stretch)$/ },
  { pattern: /^(overflow|overflow-x|overflow-y)-(auto|hidden|visible|scroll)$/ },
  { pattern: /^(top|right|bottom|left|inset)-(0|auto|1\/2|full)$/ },

  // Spacing
  ...pattern("p", spacing),
  ...pattern("px", spacing),
  ...pattern("py", spacing),
  ...pattern("pt", spacing),
  ...pattern("pr", spacing),
  ...pattern("pb", spacing),
  ...pattern("pl", spacing),
  ...pattern("m", spacing),
  ...pattern("mx", spacing),
  ...pattern("my", spacing),
  ...pattern("mt", spacing),
  ...pattern("mr", spacing),
  ...pattern("mb", spacing),
  ...pattern("ml", spacing),
  ...pattern("gap", spacing),
  ...pattern("gap-x", spacing),
  ...pattern("gap-y", spacing),
  ...pattern("space-x", spacing),
  ...pattern("space-y", spacing),

  // Sizing
  { pattern: /^(w|h)-(1\/2|1\/3|2\/3|1\/4|3\/4|1\/5|2\/5|3\/5|4\/5|full|screen|min|max|fit|auto)$/ },
  { pattern: /^(w|h|min-w|min-h|max-w|max-h)-(0|px|0\.5|1|2|4|6|8|12|16|20|24|32|40|48|64|80|96|1\/2|1\/3|2\/3|full)$/ },

  // Typography
  { pattern: /^(text|font)-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/ },
  { pattern: /^(font)-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/ },
  { pattern: /^(leading)-(3|4|5|6|7|8|9|10|none|tight|snug|normal|relaxed|loose)$/ },
  { pattern: /^(tracking)-(tighter|tight|normal|wide|wider|widest)$/ },
  { pattern: /^(text|align)-(left|center|right|justify)$/ },
  { pattern: /^(uppercase|lowercase|capitalize|truncate|italic|not-italic|underline|line-through|no-underline)$/ },

  // Colors
  ...colors.flatMap((c) => [
    ...pattern(`bg-${c}`, shades),
    ...pattern(`text-${c}`, shades),
    ...pattern(`border-${c}`, shades),
  ]),

  // Borders
  { pattern: /^(border|border-0|border-2|border-4|border-8)$/ },
  { pattern: /^(border)-(t|r|b|l|x|y)$/ },
  { pattern: /^(rounded|rounded-none|rounded-sm|rounded-md|rounded-lg|rounded-xl|rounded-2xl|rounded-3xl|rounded-full)$/ },
  { pattern: /^(rounded)-(t|r|b|l|tl|tr|br|bl|full)$/ },

  // Effects
  { pattern: /^(shadow|shadow-sm|shadow-md|shadow-lg|shadow-xl|shadow-2xl|shadow-none)$/ },
  { pattern: /^(opacity)-(0|5|10|20|25|30|40|50|60|70|75|80|90|95|100)$/ },

  // Grid
  { pattern: /^(grid-cols|col-span|row-span)-(1|2|3|4|5|6|7|8|9|10|11|12|none|full)$/ },
  { pattern: /^(col-start|col-end|row-start|row-end)-(1|2|3|4|5|6|7|8|9|10|11|12|13|auto)$/ },
];

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist,
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
