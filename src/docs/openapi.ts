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
                        role: { type: "string" },
                        content: { type: "string" }
                      }
                    }
                  },
                  max_tokens: {
                    type: "integer",
                    minimum: 1
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Provider completion response" },
          "502": { description: "Provider request failed" },
          "503": { description: "Provider missing key/not ready" },
          "401": { description: "Missing or invalid API key" },
          "400": { description: "Invalid request payload" },
          "429": { description: "Rate limit exceeded" }
        }
      }
    },
    "/v1/audit": {
      get: {
        summary: "Retrieve audit entries (admin only)",
        security: [{ ApiKeyAuth: [] }],
        responses: {
          "501": { description: "Not implemented yet" },
          "401": { description: "Missing or invalid API key" },
          "403": { description: "Admin role required" },
          "429": { description: "Rate limit exceeded" }
        }
      }
    }
  }
} as const;
