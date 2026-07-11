import { describe, it, expect } from "vitest";
import { chartToSvg } from "@/lib/charts";
import { ChartSpec } from "@/lib/schemas";

describe("chartToSvg", () => {
  it("renders a bar chart", () => {
    const spec: ChartSpec = {
      type: "bar",
      title: "Revenue",
      xAxis: { values: ["Q1", "Q2", "Q3"] },
      yAxis: { max: 100 },
      series: [{ label: "2024", data: [10, 50, 90] }],
    };
    const svg = chartToSvg(spec);
    expect(svg).toContain("<svg");
    expect(svg).toContain("Revenue");
    expect(svg).toContain("<rect");
  });

  it("renders a pie chart", () => {
    const spec: ChartSpec = {
      type: "pie",
      title: "Share",
      slices: [
        { label: "A", value: 30 },
        { label: "B", value: 70 },
      ],
    };
    const svg = chartToSvg(spec);
    expect(svg).toContain("<svg");
    expect(svg).toContain("<path");
  });

  it("renders a timeline", () => {
    const spec: ChartSpec = {
      type: "timeline",
      title: "History",
      events: [{ label: "Launch", date: "2020" }],
    };
    const svg = chartToSvg(spec);
    expect(svg).toContain("<svg");
    expect(svg).toContain("<circle");
  });
});
