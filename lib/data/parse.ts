/* ============================================================
   Data ingestion — CSV (PapaParse) + JSON + raw paste.
   Returns a normalized row array. Type inference happens in schema.ts.
   ============================================================ */

import Papa from "papaparse";
import type { Dataset } from "@/lib/types";
import { inferSchema } from "./schema";
import { uid } from "@/lib/utils";

export interface ParseResult {
  dataset?: Dataset;
  error?: string;
}

/** Parse arbitrary text content by detected format. */
export function parseText(raw: string, name: string): ParseResult {
  const trimmed = raw.trim();
  if (!trimmed) return { error: "File is empty." };

  let rows: Record<string, unknown>[] = [];
  let columns: string[] = [];

  if (looksLikeJson(trimmed)) {
    const json = safeJson(trimmed);
    if (!json) return { error: "Could not parse JSON." };
    if (Array.isArray(json)) {
      if (!json.length) return { error: "JSON array is empty." };
      if (Array.isArray(json[0])) {
        // array-of-arrays → treat first row as header
        const header = (json[0] as unknown[]).map(String);
        columns = header;
        rows = (json.slice(1) as unknown[][]).map((r) =>
          Object.fromEntries(header.map((h, i) => [h, r[i] ?? null])),
        );
      } else if (typeof json[0] === "object" && json[0] !== null) {
        columns = Object.keys(json[0] as Record<string, unknown>);
        rows = json as Record<string, unknown>[];
      } else {
        return { error: "Unsupported JSON shape — expected array of objects." };
      }
    } else if (typeof json === "object") {
      // single object: try { columns, rows } or wrap
      const obj = json as Record<string, unknown>;
      if (Array.isArray(obj.rows) && Array.isArray(obj.columns)) {
        columns = (obj.columns as string[]).map(String);
        rows = obj.rows as Record<string, unknown>[];
      } else {
        return { error: "Unsupported JSON shape — expected an array of records." };
      }
    } else {
      return { error: "Unsupported JSON shape." };
    }
  } else {
    // CSV / TSV
    const parsed = Papa.parse<Record<string, unknown>>(trimmed, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim(),
    });
    if (parsed.errors.length && !parsed.data.length) {
      return { error: parsed.errors[0]?.message ?? "CSV parse error." };
    }
    rows = parsed.data;
    columns = parsed.meta.fields ?? [];
  }

  if (!rows.length || !columns.length) return { error: "No rows or columns detected." };

  const schema = inferSchema(columns, rows);
  const dataset: Dataset = {
    id: uid("ds"),
    name,
    columns,
    rows,
    schema,
    rowCount: rows.length,
    createdAt: new Date().toISOString(),
  };
  return { dataset };
}

function looksLikeJson(s: string): boolean {
  return s[0] === "{" || s[0] === "[";
}

function safeJson(s: string): unknown | null {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

/** Browser-side: read a File object to text, then parse. */
export function parseFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = typeof reader.result === "string" ? reader.result : "";
      resolve(parseText(raw, file.name));
    };
    reader.onerror = () => resolve({ error: "Failed to read file." });
    reader.readAsText(file);
  });
}
