import { describe, expect, it } from "vitest";
import { getQuizFormatHandler } from "./get-quiz-format.js";

describe("get_quiz_format handler", () => {
  it("returns the Quiz JSON Schema as structuredContent", async () => {
    const result = await getQuizFormatHandler();

    expect(result.isError).toBeUndefined();
    expect(result.structuredContent).toBeDefined();

    const schema = result.structuredContent!.schema as Record<string, unknown>;
    expect(schema).toBeDefined();
    expect(typeof schema).toBe("object");
    expect(schema.type).toBe("object");
    expect(schema).toHaveProperty("properties.id");
    expect(schema).toHaveProperty("properties.title");
    expect(schema).toHaveProperty("properties.questions");
  });

  it("includes a pretty-printed JSON Schema in text content", async () => {
    const result = await getQuizFormatHandler();
    expect(result.content).toHaveLength(1);
    const block = result.content[0];
    expect(block.type).toBe("text");
    const text = (block as { type: "text"; text: string }).text;
    expect(text).toContain("\"type\": \"object\"");
    expect(() => JSON.parse(text)).not.toThrow();
  });
});
