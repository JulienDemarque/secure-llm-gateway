import { beforeEach, describe, expect, it, vi } from "vitest";

const connectMock = vi.hoisted(() => vi.fn(async () => undefined));
const disconnectMock = vi.hoisted(() => vi.fn(async () => undefined));
const connectionState = vi.hoisted(() => ({ readyState: 0 }));

vi.mock("mongoose", () => ({
  default: {
    connect: connectMock,
    disconnect: disconnectMock,
    connection: connectionState,
  },
}));

async function loadModule() {
  vi.resetModules();
  return import("./mongoose.js");
}

describe("db/mongoose", () => {
  beforeEach(() => {
    connectMock.mockReset();
    disconnectMock.mockReset();
    connectionState.readyState = 0;
    delete process.env.MONGODB_URI;
  });

  it("does not connect when MONGODB_URI is missing", async () => {
    const db = await loadModule();

    await db.connectToMongoIfConfigured();

    expect(connectMock).not.toHaveBeenCalled();
    expect(db.getMongoHealthStatus()).toBe("not-configured");
  });

  it("connects once and reports health by readyState", async () => {
    process.env.MONGODB_URI = "mongodb://localhost:27017/test";
    const db = await loadModule();

    await db.connectToMongoIfConfigured();
    await db.connectToMongoIfConfigured();

    expect(connectMock).toHaveBeenCalledTimes(1);
    expect(connectMock).toHaveBeenCalledWith("mongodb://localhost:27017/test");

    connectionState.readyState = 1;
    expect(db.getMongoHealthStatus()).toBe("ready");
    connectionState.readyState = 2;
    expect(db.getMongoHealthStatus()).toBe("not-ready");
  });

  it("disconnects only after a successful connect", async () => {
    process.env.MONGODB_URI = "mongodb://localhost:27017/test";
    const db = await loadModule();

    await db.disconnectMongo();
    expect(disconnectMock).not.toHaveBeenCalled();

    await db.connectToMongoIfConfigured();
    await db.disconnectMongo();

    expect(disconnectMock).toHaveBeenCalledTimes(1);
  });
});
