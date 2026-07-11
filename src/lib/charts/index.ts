import { ChartSpec } from "@/lib/schemas";

const PALETTE = ["#2563eb", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#84cc16"];

export function chartToSvg(spec: ChartSpec): string {
  switch (spec.type) {
    case "bar":
      return renderBarChart(spec);
    case "line":
      return renderLineChart(spec);
    case "pie":
      return renderPieChart(spec);
    case "timeline":
      return renderTimeline(spec);
    case "process":
      return renderProcess(spec);
    case "architecture":
      return renderArchitecture(spec);
    default:
      return "";
  }
}

function wrapSvg(content: string, title: string | undefined, width: number, height: number): string {
  const titleEl = title ? `<text x="${width / 2}" y="28" text-anchor="middle" font-size="20" font-weight="600" fill="var(--text)">${escapeXml(title)}</text>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${titleEl}${content}</svg>`;
}

function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderBarChart(spec: Extract<ChartSpec, { type: "bar" }>): string {
  const width = 560;
  const height = 320;
  const margin = { top: 48, right: 24, bottom: 64, left: 56 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;

  const values = spec.series.flatMap((s) => s.data);
  const max = spec.yAxis?.max ?? Math.max(...values, 1);

  const groupCount = spec.xAxis.values.length;
  const groupWidth = chartW / groupCount;
  const barWidth = groupWidth / (spec.series.length + 1);

  let bars = "";
  for (let g = 0; g < groupCount; g++) {
    const x0 = margin.left + g * groupWidth + barWidth / 2;
    for (let s = 0; s < spec.series.length; s++) {
      const value = spec.series[s].data[g] ?? 0;
      const barH = (value / max) * chartH;
      const x = x0 + s * barWidth;
      const y = margin.top + chartH - barH;
      bars += `<rect x="${x}" y="${y}" width="${barWidth * 0.8}" height="${barH}" fill="${PALETTE[s % PALETTE.length]}" rx="4" />`;
    }
  }

  let xLabels = "";
  for (let g = 0; g < groupCount; g++) {
    const x = margin.left + g * groupWidth + groupWidth / 2;
    xLabels += `<text x="${x}" y="${height - 24}" text-anchor="middle" font-size="12" fill="var(--text-muted)">${escapeXml(spec.xAxis.values[g])}</text>`;
  }

  const yTicks = 5;
  let yLabels = "";
  for (let i = 0; i <= yTicks; i++) {
    const value = (max / yTicks) * i;
    const y = margin.top + chartH - (value / max) * chartH;
    yLabels += `<text x="${margin.left - 10}" y="${y + 4}" text-anchor="end" font-size="12" fill="var(--text-muted)">${Math.round(value)}</text>`;
  }

  return wrapSvg(`<line x1="${margin.left}" y1="${margin.top + chartH}" x2="${width - margin.right}" y2="${margin.top + chartH}" stroke="var(--border)" stroke-width="2" />${bars}${xLabels}${yLabels}`, spec.title, width, height);
}

function renderLineChart(spec: Extract<ChartSpec, { type: "line" }>): string {
  const width = 560;
  const height = 320;
  const margin = { top: 48, right: 24, bottom: 64, left: 56 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;

  const values = spec.series.flatMap((s) => s.data);
  const max = spec.yAxis?.max ?? Math.max(...values, 1);
  const pointCount = spec.xAxis.values.length;
  const stepX = chartW / (pointCount - 1);

  let paths = "";
  for (let s = 0; s < spec.series.length; s++) {
    const points = spec.series[s].data.map((value, i) => {
      const x = margin.left + i * stepX;
      const y = margin.top + chartH - (value / max) * chartH;
      return `${x},${y}`;
    }).join(" ");
    paths += `<polyline points="${points}" fill="none" stroke="${PALETTE[s % PALETTE.length]}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />`;
  }

  let xLabels = "";
  for (let i = 0; i < pointCount; i++) {
    const x = margin.left + i * stepX;
    xLabels += `<text x="${x}" y="${height - 24}" text-anchor="middle" font-size="12" fill="var(--text-muted)">${escapeXml(spec.xAxis.values[i])}</text>`;
  }

  return wrapSvg(`<line x1="${margin.left}" y1="${margin.top + chartH}" x2="${width - margin.right}" y2="${margin.top + chartH}" stroke="var(--border)" stroke-width="2" />${paths}${xLabels}`, spec.title, width, height);
}

function renderPieChart(spec: Extract<ChartSpec, { type: "pie" }>): string {
  const width = 320;
  const height = 320;
  const cx = width / 2;
  const cy = height / 2 + 8;
  const radius = 120;

  const total = spec.slices.reduce((sum, slice) => sum + slice.value, 0);
  let startAngle = 0;
  let slices = "";
  let legend = "";

  for (let i = 0; i < spec.slices.length; i++) {
    const slice = spec.slices[i];
    const angle = (slice.value / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const color = slice.color ?? PALETTE[i % PALETTE.length];

    slices += `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${color}" stroke="white" stroke-width="2" />`;

    legend += `<rect x="${width + 20}" y="${48 + i * 24}" width="12" height="12" fill="${color}" rx="2" /><text x="${width + 40}" y="${58 + i * 24}" font-size="12" fill="var(--text)">${escapeXml(slice.label)} ${Math.round((slice.value / total) * 100)}%</text>`;

    startAngle = endAngle;
  }

  return wrapSvg(slices + legend, spec.title, width + 160, height);
}

function renderTimeline(spec: Extract<ChartSpec, { type: "timeline" }>): string {
  const width = 720;
  const height = 160;
  const y = height / 2;
  const stepX = width / (spec.events.length + 1);

  let items = `<line x1="40" y1="${y}" x2="${width - 40}" y2="${y}" stroke="var(--primary)" stroke-width="4" />`;

  for (let i = 0; i < spec.events.length; i++) {
    const x = 40 + (i + 1) * stepX;
    const event = spec.events[i];
    items += `<circle cx="${x}" cy="${y}" r="8" fill="var(--primary)" />`;
    items += `<text x="${x}" y="${y - 24}" text-anchor="middle" font-size="12" font-weight="600" fill="var(--text)">${escapeXml(event.date)}</text>`;
    items += `<text x="${x}" y="${y + 32}" text-anchor="middle" font-size="12" fill="var(--text)">${escapeXml(event.label)}</text>`;
  }

  return wrapSvg(items, spec.title, width, height);
}

function renderProcess(spec: Extract<ChartSpec, { type: "process" }>): string {
  const width = 720;
  const height = 140;
  const boxW = width / spec.steps.length - 16;
  const boxH = 80;

  let items = "";
  for (let i = 0; i < spec.steps.length; i++) {
    const x = 8 + i * (boxW + 16);
    const y = 40;
    items += `<rect x="${x}" y="${y}" width="${boxW}" height="${boxH}" fill="var(--surface)" stroke="var(--border)" rx="8" />`;
    items += `<text x="${x + boxW / 2}" y="${y + 32}" text-anchor="middle" font-size="14" font-weight="600" fill="var(--text)">${escapeXml(spec.steps[i].label)}</text>`;
    if (spec.steps[i].description) {
      items += `<text x="${x + boxW / 2}" y="${y + 56}" text-anchor="middle" font-size="12" fill="var(--text-muted)">${escapeXml(spec.steps[i].description!)}</text>`;
    }
    if (i < spec.steps.length - 1) {
      items += `<path d="M ${x + boxW + 4} ${y + boxH / 2} L ${x + boxW + 12} ${y + boxH / 2} M ${x + boxW + 8} ${y + boxH / 2 - 4} L ${x + boxW + 12} ${y + boxH / 2} L ${x + boxW + 8} ${y + boxH / 2 + 4}" stroke="var(--primary)" stroke-width="2" fill="none" />`;
    }
  }

  return wrapSvg(items, spec.title, width, height);
}

function renderArchitecture(spec: Extract<ChartSpec, { type: "architecture" }>): string {
  const width = 720;
  const height = 400;

  let nodes = "";
  for (const node of spec.nodes) {
    if (node.shape === "circle") {
      nodes += `<circle cx="${node.x}" cy="${node.y}" r="40" fill="var(--surface)" stroke="var(--primary)" stroke-width="2" />`;
    } else {
      nodes += `<rect x="${node.x - 60}" y="${node.y - 30}" width="120" height="60" fill="var(--surface)" stroke="var(--primary)" stroke-width="2" rx="8" />`;
    }
    nodes += `<text x="${node.x}" y="${node.y + 5}" text-anchor="middle" font-size="12" fill="var(--text)">${escapeXml(node.label)}</text>`;
  }

  let edges = "";
  for (const edge of spec.edges) {
    const from = spec.nodes.find((n) => n.id === edge.from);
    const to = spec.nodes.find((n) => n.id === edge.to);
    if (!from || !to) continue;
    edges += `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="var(--border)" stroke-width="2" marker-end="url(#arrow)" />`;
  }

  const defs = `<defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="var(--border)" /></marker></defs>`;

  return wrapSvg(defs + edges + nodes, spec.title, width, height);
}
