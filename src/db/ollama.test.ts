import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getOllamaHealthStatus } from "./ollama.js";

describe("getOllamaHealthStatus", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    delete process.env.OLLAMA_HOST;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns ready when version endpoint is reachable", async () => {
    process.env.OLLAMA_HOST = "http://ollama:11434/";
    fetchMock.mockResolvedValue({ ok: true });

    const result = await getOllamaHealthStatus();

    expect(result).toBe("ready");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://ollama:11434/api/version",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("returns not-ready when endpoint responds non-2xx", async () => {
    fetchMock.mockResolvedValue({ ok: false });

    const result = await getOllamaHealthStatus();

    expect(result).toBe("not-ready");
  });

  it("returns not-ready when fetch throws", async () => {
    fetchMock.mockRejectedValue(new Error("connection-failed"));

    const result = await getOllamaHealthStatus();

    expect(result).toBe("not-ready");
  });
});
