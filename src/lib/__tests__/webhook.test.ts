/**
 * Unit tests for src/lib/webhook.ts
 */
/// <reference types="jest" />

import {
  resolveN8nWebhookUrl,
  triggerN8nWebhook,
  maskUrlForLog,
  validateWebhookUrl,
  isRetriableTriggerResult,
  type EnvMode,
} from "../webhook";

const originalEnv = process.env;

function mockResponse(init: { status: number; body?: string; contentType?: string }) {
  const { status, body = "", contentType = "application/json" } = init;
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => (name.toLowerCase() === "content-type" ? contentType : null) },
    text: () => Promise.resolve(body),
    json: () => {
      try {
        return Promise.resolve(body ? JSON.parse(body) : {});
      } catch {
        return Promise.reject(new SyntaxError("Invalid JSON"));
      }
    },
  } as unknown as Response;
}

describe("resolveN8nWebhookUrl", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    process.env = { ...originalEnv };
    delete process.env.N8N_WEBHOOK_PROD;
    delete process.env.N8N_WEBHOOK_TEST;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns prod URL from env when envMode is prod", () => {
    process.env.N8N_WEBHOOK_PROD = "https://n8n.example.com/webhook/prod";
    const result = resolveN8nWebhookUrl("prod");
    expect(result.url).toBe("https://n8n.example.com/webhook/prod");
    expect(result.error).toBeUndefined();
  });

  it("returns error if prod URL missing when envMode is prod", () => {
    const result = resolveN8nWebhookUrl("prod");
    expect(result.url).toBeNull();
    expect(result.error).toContain("Production webhook not configured");
    expect(result.error).toContain("N8N_WEBHOOK_PROD");
  });

  it("returns test URL from env when envMode is test", () => {
    process.env.N8N_WEBHOOK_TEST = "http://localhost:5678/webhook-test/eco";
    const result = resolveN8nWebhookUrl("test");
    expect(result.url).toBe("http://localhost:5678/webhook-test/eco");
    expect(result.error).toBeUndefined();
  });

  it("falls back to client test URL if env test URL missing", () => {
    const clientUrl = "http://localhost:5678/webhook-test/client";
    const warnSpy = jest.spyOn(console, "warn").mockImplementation();
    const result = resolveN8nWebhookUrl("test", clientUrl);
    expect(result.url).toBe(clientUrl);
    expect(result.error).toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("prefers env test URL over client URL when both set", () => {
    process.env.N8N_WEBHOOK_TEST = "http://env-test.example.com/hook";
    const result = resolveN8nWebhookUrl("test", "http://client.example.com/hook");
    expect(result.url).toBe("http://env-test.example.com/hook");
  });

  it("returns null url when test mode and no env or client URL", () => {
    const result = resolveN8nWebhookUrl("test");
    expect(result.url).toBeNull();
    expect(result.error).toBeUndefined();
  });
});

describe("triggerN8nWebhook", () => {
  const validUrl = "http://localhost:5678/webhook-test/eco-action";
  const payload = { action: "test", details: "unit test" };
  const envMode: EnvMode = "test";

  beforeEach(() => {
    jest.restoreAllMocks();
    globalThis.fetch = jest.fn();
  });

  it("returns ok: true when POST succeeds with 2xx", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue(mockResponse({ status: 200 }));
    const result = await triggerN8nWebhook(validUrl, payload, envMode);
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.detail).toBeUndefined();
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect((globalThis.fetch as jest.Mock).mock.calls[0][0]).toBe(validUrl);
    expect((globalThis.fetch as jest.Mock).mock.calls[0][1].method).toBe("POST");
  });

  it("returns ok: false with detail when response is non-2xx", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue(
      mockResponse({ status: 404, body: "Not Found" })
    );
    const result = await triggerN8nWebhook(validUrl, payload, envMode);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(404);
    expect(result.detail).toContain("Not Found");
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("returns ok: false with validation error when URL is invalid", async () => {
    const result = await triggerN8nWebhook("", payload, envMode);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(0);
    expect(result.detail).toContain("empty");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("on timeout, abort is triggered and returns appropriate error", async () => {
    const abortError = new Error("The operation was aborted");
    abortError.name = "AbortError";
    (globalThis.fetch as jest.Mock).mockRejectedValue(abortError);
    const result = await triggerN8nWebhook(validUrl, payload, envMode);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(0);
    expect(result.detail).toContain("did not respond in time");
    expect(result.detail).toContain("Immediately");
  });

  it("retry logic triggers second attempt on network failure", async () => {
    (globalThis.fetch as jest.Mock)
      .mockRejectedValueOnce(new Error("ECONNREFUSED"))
      .mockResolvedValueOnce(mockResponse({ status: 200 }));
    const result = await triggerN8nWebhook(validUrl, payload, envMode);
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  }, 10_000);

  it("retry logic triggers second attempt on 5xx", async () => {
    (globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce(mockResponse({ status: 503, body: "Unavailable" }))
      .mockResolvedValueOnce(mockResponse({ status: 200 }));
    const result = await triggerN8nWebhook(validUrl, payload, envMode);
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  }, 10_000);

  it("no retry on 4xx", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue(
      mockResponse({ status: 404, body: "Not Found" })
    );
    const result = await triggerN8nWebhook(validUrl, payload, envMode);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(404);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});

describe("maskUrlForLog", () => {
  it("masks path and keeps protocol and host", () => {
    expect(maskUrlForLog("https://n8n.example.com/webhook/secret-path")).toBe("https://n8n.example.com/***");
    expect(maskUrlForLog("http://localhost:5678/webhook-test/eco")).toBe("http://localhost:5678/***");
  });

  it("returns [invalid-url] for invalid URL", () => {
    expect(maskUrlForLog("not-a-url")).toBe("[invalid-url]");
  });
});

describe("validateWebhookUrl", () => {
  it("accepts http and https URLs", () => {
    expect(validateWebhookUrl("http://localhost:5678/hook").valid).toBe(true);
    expect(validateWebhookUrl("https://n8n.example.com/hook").valid).toBe(true);
  });

  it("rejects empty URL", () => {
    const r = validateWebhookUrl("");
    expect(r.valid).toBe(false);
    expect(r.error).toContain("empty");
  });

  it("rejects non-http(s) protocol", () => {
    const r = validateWebhookUrl("ftp://host/path");
    expect(r.valid).toBe(false);
    expect(r.error).toContain("http");
  });
});

describe("isRetriableTriggerResult", () => {
  it("returns true for status 0", () => {
    expect(isRetriableTriggerResult({ ok: false, status: 0 })).toBe(true);
  });

  it("returns true for 5xx", () => {
    expect(isRetriableTriggerResult({ ok: false, status: 500 })).toBe(true);
    expect(isRetriableTriggerResult({ ok: false, status: 503 })).toBe(true);
  });

  it("returns false for 4xx and 2xx", () => {
    expect(isRetriableTriggerResult({ ok: false, status: 404 })).toBe(false);
    expect(isRetriableTriggerResult({ ok: true, status: 200 })).toBe(false);
  });
});
