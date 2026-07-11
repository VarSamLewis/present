export type ExtractedBlock = {
  kind: "heading" | "paragraph" | "table" | "list" | "sheet";
  text: string;
  location?: string;
};

export type ParsedDocument = {
  blocks: ExtractedBlock[];
};
