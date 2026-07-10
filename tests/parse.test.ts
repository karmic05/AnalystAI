import { describe, it, expect } from "vitest";
import { parseText } from "@/lib/data/parse";

describe("parse", () => {
  it("parses CSV with header", () => {
    const res = parseText("a,b\n1,2\n3,4", "t.csv");
    expect(res.error).toBeUndefined();
    expect(res.dataset?.columns).toEqual(["a", "b"]);
    expect(res.dataset?.rowCount).toBe(2);
    expect(res.dataset?.schema[0].type).toBe("number");
  });

  it("parses JSON array of objects", () => {
    const res = parseText('[{"x":1,"y":"a"},{"x":2,"y":"b"}]', "d.json");
    expect(res.dataset?.columns).toEqual(["x", "y"]);
    expect(res.dataset?.rowCount).toBe(2);
    expect(res.dataset?.schema.find((c) => c.name === "x")?.type).toBe("number");
    expect(res.dataset?.schema.find((c) => c.name === "y")?.type).toBe("string");
  });

  it("parses JSON {columns, rows}", () => {
    const res = parseText('{"columns":["k","v"],"rows":[{"k":"a","v":1}]}', "d.json");
    expect(res.dataset?.columns).toEqual(["k", "v"]);
    expect(res.dataset?.rowCount).toBe(1);
  });

  it("errors on empty input", () => {
    expect(parseText("", "empty.csv").error).toBeTruthy();
    expect(parseText("   ", "blank.csv").error).toBeTruthy();
  });

  it("infers date column type", () => {
    const res = parseText("date,v\n2024-01-01,10\n2024-02-01,20", "d.csv");
    expect(res.dataset?.schema[0].type).toBe("date");
  });
});
