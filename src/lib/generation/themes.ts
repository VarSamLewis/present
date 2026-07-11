export type Theme = {
  id: string;
  name: string;
  tokens: {
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    primary: string;
    secondary: string;
    accent: string;
    border: string;
    fontHeading: string;
    fontBody: string;
  };
};

export const THEMES: Theme[] = [
  {
    id: "clean",
    name: "Clean",
    tokens: {
      background: "#ffffff",
      surface: "#f8fafc",
      text: "#0f172a",
      textMuted: "#64748b",
      primary: "#2563eb",
      secondary: "#475569",
      accent: "#f59e0b",
      border: "#e2e8f0",
      fontHeading: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto",
      fontBody: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto",
    },
  },
];

export function getTheme(id: string): Theme | undefined {
  return THEMES.find((t) => t.id === id);
}

export function themeCssVariables(theme: Theme): string {
  return `
    :root {
      --bg: ${theme.tokens.background};
      --surface: ${theme.tokens.surface};
      --text: ${theme.tokens.text};
      --text-muted: ${theme.tokens.textMuted};
      --primary: ${theme.tokens.primary};
      --secondary: ${theme.tokens.secondary};
      --accent: ${theme.tokens.accent};
      --border: ${theme.tokens.border};
      --font-heading: ${theme.tokens.fontHeading};
      --font-body: ${theme.tokens.fontBody};
    }
  `;
}
