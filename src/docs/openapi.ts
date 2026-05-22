/** Minimal OpenAPI 3.0 document for manual API testing via Swagger UI. */
export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "SecureLLM Gateway API",
    version: "0.1.0",
    description: "Challenge API surface for health, chat proxy, and audit retrieval."
  },
  servers: [
    {
      url: "http://localhost:3000"
    }
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "x-api-key"
      }
    }
  },
  paths: {
    "/healthz": {
      get: {
        summary: "Liveness and dependency readiness",
        responses: {
          "200": {
            description: "Health response"
          }
        }
      }
    },
    "/v1/chat": {
      post: {
        summary: "Chat proxy through security pipeline",
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["model", "messages"],
                properties: {
                  model: {
                    type: "string",
                    enum: ["claude-3-5-sonnet", "gpt-4o"]
                  },
                  messages: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["role", "content"],
                      properties: {
                        role: {
                          type: "string",
                          enum: ["system", "user", "assistant"]
                        },
                        content: {
                          type: "string",
                          minLength: 1
                        }
                      }
                    }
                  },
                  max_tokens: {
                    type: "integer",
                    minimum: 1
                  }
                },
                example: {
                  model: "gpt-4o",
                  messages: [
                    {
                      role: "system",
                      content: "You are a concise and helpful assistant."
                    },
                    {
                      role: "user",
                      content: "How are you today?"
                    }
                  ],
                  max_tokens: 256
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Provider completion response" },
          "502": { description: "Detector or provider request failed" },
          "500": { description: "PII redaction failed or unavailable" },
          "503": { description: "Provider missing key/not ready" },
          "401": { description: "Missing or invalid API key" },
          "400": { description: "Invalid payload, prompt-injection block, or outbound output-validation block" },
          "429": { description: "Rate limit exceeded" }
        }
      }
    },
    "/v1/audit": {
      get: {
        summary: "Retrieve audit entries (admin only)",
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          {
            name: "since",
            in: "query",
            required: false,
            schema: { type: "string", format: "date-time" },
            description: "Optional lower-bound timestamp (ISO-8601)."
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, maximum: 500, default: 100 },
            description: "Maximum number of entries to return."
          },
          {
            name: "includeOriginal",
            in: "query",
            required: false,
            schema: { type: "boolean", default: false },
            description:
              "When true, include best-effort reconstructed original request payload from encrypted redaction tokens."
          }
        ],
        responses: {
          "200": { description: "Audit entries" },
          "400": { description: "Invalid query parameters" },
          "401": { description: "Missing or invalid API key" },
          "403": { description: "Admin role required" },
          "429": { description: "Rate limit exceeded" }
        }
      }
    }
  }
} as const;
