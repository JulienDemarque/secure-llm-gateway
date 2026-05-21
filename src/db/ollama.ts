const DEFAULT_OLLAMA_HOST = "http://127.0.0.1:11434";
const OLLAMA_HEALTH_TIMEOUT_MS = 1500;

/** Resolves Ollama host for detector/runtime health checks. */
function resolveOllamaHost(): string {
  return process.env.OLLAMA_HOST ?? DEFAULT_OLLAMA_HOST;
}

/** Performs a lightweight reachability probe against Ollama API. */
export async function getOllamaHealthStatus(): Promise<"ready" | "not-ready"> {
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), OLLAMA_HEALTH_TIMEOUT_MS);
  const host = resolveOllamaHost().replace(/\/$/, "");

  try {
    const response = await fetch(`${host}/api/version`, {
      method: "GET",
      signal: abortController.signal
    });
    return response.ok ? "ready" : "not-ready";
  } catch {
    return "not-ready";
  } finally {
    clearTimeout(timeout);
  }
}
