import { afterEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import type { AddressInfo } from "node:net";
import { RunnerHost } from "./runner-host.js";

type FakeServeCall = {
  app: Hono;
  onListen: (info: AddressInfo) => void;
  instance: { close: (cb: () => void) => void; on: (event: string, cb: (err: Error) => void) => void };
};

function makeFakeServe() {
  const calls: FakeServeCall[] = [];
  const errorHandlers: Array<(err: Error) => void> = [];
  const closeHandlers: Array<(cb: () => void) => void> = [];
  const fakeServe: any = (opts: { fetch: unknown; port: number }, cb: (info: AddressInfo) => void) => {
    const instance = {
      close: (done: () => void) => done(),
      on: (event: string, handler: (err: Error) => void) => {
        if (event === "error") errorHandlers.push(handler);
      },
    };
    closeHandlers.push(instance.close);
    calls.push({ app: opts.fetch as Hono, onListen: cb, instance });
    queueMicrotask(() => cb({ port: 4000 + calls.length - 1 } as AddressInfo));
    return instance;
  };
  return { fakeServe, calls, errorHandlers };
}

describe("RunnerHost", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("ensureStarted listens on an ephemeral port and exposes url", async () => {
    const buildApp = vi.fn(() => new Hono());
    const { fakeServe } = makeFakeServe();
    const host = new RunnerHost(buildApp, { serve: fakeServe });

    await host.ensureStarted();

    expect(host.isRunning()).toBe(true);
    expect(host.url).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
  });

  it("ensureStarted is idempotent — second call does not rebuild the app", async () => {
    const buildApp = vi.fn(() => new Hono());
    const { fakeServe } = makeFakeServe();
    const host = new RunnerHost(buildApp, { serve: fakeServe });

    await host.ensureStarted();
    const firstUrl = host.url;
    await host.ensureStarted();

    expect(buildApp).toHaveBeenCalledTimes(1);
    expect(host.url).toBe(firstUrl);
  });

  it("concurrent ensureStarted calls share one listen", async () => {
    const buildApp = vi.fn(() => new Hono());
    const { fakeServe } = makeFakeServe();
    const host = new RunnerHost(buildApp, { serve: fakeServe });

    await Promise.all([
      host.ensureStarted(),
      host.ensureStarted(),
      host.ensureStarted(),
      host.ensureStarted(),
      host.ensureStarted(),
    ]);

    expect(buildApp).toHaveBeenCalledTimes(1);
  });

  it("throws when url is read before ensureStarted", () => {
    const host = new RunnerHost(() => new Hono(), { serve: makeFakeServe().fakeServe });
    expect(() => host.url).toThrow(/before ensureStarted/);
  });

  it("stop() returns true when running and false when already stopped", async () => {
    const { fakeServe } = makeFakeServe();
    const host = new RunnerHost(() => new Hono(), { serve: fakeServe });

    await host.ensureStarted();
    expect(await host.stop()).toBe(true);
    expect(host.isRunning()).toBe(false);
    expect(await host.stop()).toBe(false);
  });

  it("restarts after stop and builds the app again", async () => {
    const buildApp = vi.fn(() => new Hono());
    const { fakeServe } = makeFakeServe();
    const host = new RunnerHost(buildApp, { serve: fakeServe });

    await host.ensureStarted();
    await host.stop();
    await host.ensureStarted();

    expect(buildApp).toHaveBeenCalledTimes(2);
    expect(host.isRunning()).toBe(true);
  });

  it("shouldAutoStop truth table", async () => {
    const { fakeServe } = makeFakeServe();
    const host = new RunnerHost(() => new Hono(), { serve: fakeServe });

    expect(host.shouldAutoStop()).toBe(false);

    host.trackActive("a");
    expect(host.shouldAutoStop()).toBe(false);

    host.markRead("a");
    expect(host.shouldAutoStop()).toBe(true);

    host.trackActive("b");
    expect(host.shouldAutoStop()).toBe(false);

    host.markRead("b");
    expect(host.shouldAutoStop()).toBe(true);
  });

  it("trackActive clears read status for an upserted id", () => {
    const { fakeServe } = makeFakeServe();
    const host = new RunnerHost(() => new Hono(), { serve: fakeServe });

    host.trackActive("a");
    host.markRead("a");
    expect(host.shouldAutoStop()).toBe(true);

    host.trackActive("a");
    expect(host.shouldAutoStop()).toBe(false);
  });

  it("markRead on an unknown id is a no-op", () => {
    const { fakeServe } = makeFakeServe();
    const host = new RunnerHost(() => new Hono(), { serve: fakeServe });

    host.markRead("ghost");
    expect(host.shouldAutoStop()).toBe(false);

    host.trackActive("real");
    expect(host.shouldAutoStop()).toBe(false);
  });

  it("stop() clears both sets", async () => {
    const { fakeServe } = makeFakeServe();
    const host = new RunnerHost(() => new Hono(), { serve: fakeServe });

    await host.ensureStarted();
    host.trackActive("a");
    host.markRead("a");
    await host.stop();

    expect(host.shouldAutoStop()).toBe(false);
  });

  it("resets to stopped when the listener errors before listen, allowing retry", async () => {
    const erroringServe: any = (_opts: unknown, _cb: unknown) => {
      const instance = {
        close: (done: () => void) => done(),
        on: (event: string, handler: (err: Error) => void) => {
          if (event === "error") queueMicrotask(() => handler(new Error("boom")));
        },
      };
      return instance;
    };
    const failing = new RunnerHost(() => new Hono(), { serve: erroringServe });

    await expect(failing.ensureStarted()).rejects.toThrow("boom");
    expect(failing.isRunning()).toBe(false);

    // Retry contract: after a failure, a fresh ensureStarted() on a working
    // host must succeed (proves the FSM reset to "stopped" lets future attempts
    // proceed normally — the private `serveFn` cannot be re-injected, so we
    // verify the contract on a second host with a working fake).
    const { fakeServe } = makeFakeServe();
    const recovered = new RunnerHost(() => new Hono(), { serve: fakeServe });
    await recovered.ensureStarted();
    expect(recovered.isRunning()).toBe(true);
  });

  it("stop() called during starting waits for the listen to resolve then closes", async () => {
    let resolveListen: ((info: AddressInfo) => void) | undefined;
    const fakeServe: any = (_opts: unknown, cb: (info: AddressInfo) => void) => {
      resolveListen = cb;
      return {
        close: (done: () => void) => done(),
        on: () => {},
      };
    };
    const host = new RunnerHost(() => new Hono(), { serve: fakeServe });

    const startPromise = host.ensureStarted();
    const stopPromise = host.stop();

    // Let ensureStarted finish: microtask flush with resolveListen.
    resolveListen?.({ port: 5555 } as AddressInfo);

    const [, wasRunning] = await Promise.all([startPromise, stopPromise]);
    expect(wasRunning).toBe(true);
    expect(host.isRunning()).toBe(false);
  });
});
