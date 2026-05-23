import { beforeEach, describe, expect, it, vi } from "vitest";

type MockRedisClient = {
  isOpen: boolean;
  connect: ReturnType<typeof vi.fn>;
  quit: ReturnType<typeof vi.fn>;
};

const createClientMock = vi.hoisted(() => vi.fn());
const mockClientRef = vi.hoisted<{ current: MockRedisClient | null }>(() => ({
  current: null,
}));

vi.mock("redis", () => ({
  createClient: createClientMock,
}));

function makeClient(initialOpen = false): MockRedisClient {
  return {
    isOpen: initialOpen,
    connect: vi.fn(async function connect(this: MockRedisClient) {
      this.isOpen = true;
    }),
    quit: vi.fn(async function quit(this: MockRedisClient) {
      this.isOpen = false;
    }),
  };
}

async function loadModule() {
  vi.resetModules();
  return import("./redis.js");
}

describe("db/redis", () => {
  beforeEach(() => {
    createClientMock.mockReset();
    mockClientRef.current = makeClient(false);
    createClientMock.mockImplementation(() => mockClientRef.current);
    delete process.env.REDIS_URL;
  });

  it("returns not-configured status without REDIS_URL", async () => {
    const db = await loadModule();

    expect(db.getRedisClient()).toBeNull();
    expect(db.getRedisHealthStatus()).toBe("not-configured");
  });

  it("connects once and reports ready status", async () => {
    process.env.REDIS_URL = "redis://localhost:6379";
    const db = await loadModule();

    await db.connectToRedisIfConfigured();
    await db.connectToRedisIfConfigured();

    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(createClientMock).toHaveBeenCalledWith({
      url: "redis://localhost:6379",
    });
    expect(mockClientRef.current?.connect).toHaveBeenCalledTimes(1);
    expect(db.getRedisHealthStatus()).toBe("ready");
  });

  it("reports not-ready when configured client is closed", async () => {
    process.env.REDIS_URL = "redis://localhost:6379";
    mockClientRef.current = makeClient(false);
    createClientMock.mockImplementation(() => mockClientRef.current);
    const db = await loadModule();

    expect(db.getRedisHealthStatus()).toBe("not-ready");
  });

  it("disconnects only after connection occurred", async () => {
    process.env.REDIS_URL = "redis://localhost:6379";
    const db = await loadModule();

    await db.disconnectRedis();
    expect(mockClientRef.current?.quit).not.toHaveBeenCalled();

    await db.connectToRedisIfConfigured();
    await db.disconnectRedis();
    expect(mockClientRef.current?.quit).toHaveBeenCalledTimes(1);
  });
});
