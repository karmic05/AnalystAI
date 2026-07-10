"use client";

import { useMemo, useState } from "react";
import type { ColumnType, Dataset } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TYPE_TONE: Record<ColumnType, "cyan" | "purple" | "green" | "amber"> = {
  number: "cyan",
  date: "green",
  boolean: "amber",
  string: "purple",
};

export function DataTable({ dataset }: { dataset: Dataset }) {
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const pages = Math.max(1, Math.ceil(dataset.rowCount / pageSize));
  const rows = useMemo(
    () => dataset.rows.slice(page * pageSize, page * pageSize + pageSize),
    [dataset, page],
  );

  return (
    <div className="panel overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="prompt font-mono text-xs text-muted">data preview</span>
        <span className="font-mono text-[11px] text-muted">
          showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, dataset.rowCount)} of {dataset.rowCount.toLocaleString()}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2/50">
              <th className="sticky left-0 z-10 bg-surface-2/80 px-3 py-2.5 font-mono text-[11px] text-muted backdrop-blur">#</th>
              {dataset.columns.map((c) => {
                const sch = dataset.schema.find((s) => s.name === c);
                return (
                  <th key={c} className="whitespace-nowrap px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-ink">{c}</span>
                      {sch && <Badge tone={TYPE_TONE[sch.type]}>{sch.type}</Badge>}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-surface-2/30">
                <td className="sticky left-0 z-10 bg-bg/80 px-3 py-2 font-mono text-[11px] text-muted backdrop-blur">
                  {page * pageSize + i + 1}
                </td>
                {dataset.columns.map((c) => {
                  const v = row[c];
                  const isNull = v === null || v === undefined || v === "";
                  return (
                    <td
                      key={c}
                      className={cn(
                        "whitespace-nowrap px-3 py-2 font-mono text-xs",
                        isNull ? "text-[var(--red)]/70 italic" : "text-ink",
                      )}
                    >
                      {isNull ? "null" : String(v)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="btn-neu rounded-lg px-3 py-1.5 text-xs text-muted disabled:opacity-30"
          >
            prev
          </button>
          <span className="font-mono text-[11px] text-muted">page {page + 1} / {pages}</span>
          <button
            onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
            disabled={page >= pages - 1}
            className="btn-neu rounded-lg px-3 py-1.5 text-xs text-muted disabled:opacity-30"
          >
            next
          </button>
        </div>
      )}
    </div>
  );
}
