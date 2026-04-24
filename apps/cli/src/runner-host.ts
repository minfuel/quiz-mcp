import { serve as defaultServe } from "@hono/node-server";
import type { Hono } from "hono";
import type { AddressInfo } from "node:net";

type ServeInstance = {
  close(cb: () => void): void;
  on(event: "error", handler: (err: Error) => void): void;
};

type ServeFn = (
  options: { fetch: Hono["fetch"]; port: number },
  onListen: (info: AddressInfo) => void,
) => ServeInstance;

type State =
  | { kind: "stopped" }
  | { kind: "starting"; pending: Promise<void> }
  | { kind: "running"; server: ServeInstance; url: string };

export type RunnerHostDeps = {
  serve?: ServeFn;
};

export class RunnerHost {
  private state: State = { kind: "stopped" };
  private active = new Set<string>();
  private read = new Set<string>();
  private readonly serveFn: ServeFn;

  constructor(
    private readonly buildApp: () => Hono,
    deps: RunnerHostDeps = {},
  ) {
    this.serveFn = deps.serve ?? (defaultServe as unknown as ServeFn);
  }

  async ensureStarted(): Promise<void> {
    if (this.state.kind === "running") return;
    if (this.state.kind === "starting") return this.state.pending;

    const app = this.buildApp();
    const pending = new Promise<void>((resolve, reject) => {
      const server = this.serveFn({ fetch: app.fetch, port: 0 }, (info) => {
        this.state = {
          kind: "running",
          server,
          url: `http://127.0.0.1:${info.port}`,
        };
        resolve();
      });
      server.on("error", (err) => {
        this.state = { kind: "stopped" };
        reject(err);
      });
    });
    this.state = { kind: "starting", pending };
    await pending;
  }

  get url(): string {
    if (this.state.kind !== "running") {
      throw new Error("RunnerHost.url accessed before ensureStarted()");
    }
    return this.state.url;
  }

  isRunning(): boolean {
    return this.state.kind === "running";
  }

  trackActive(quizId: string): void {
    this.active.add(quizId);
    this.read.delete(quizId);
  }

  markRead(quizId: string): void {
    if (this.active.has(quizId)) this.read.add(quizId);
  }

  shouldAutoStop(): boolean {
    if (this.active.size === 0) return false;
    for (const id of this.active) if (!this.read.has(id)) return false;
    return true;
  }

  async stop(): Promise<boolean> {
    if (this.state.kind === "stopped") return false;
    if (this.state.kind === "starting") {
      await this.state.pending.catch(() => {});
      // After the await, this.state has mutated: it is either "running" (success)
      // or "stopped" (error path). Cast to the full union so TS does not narrow
      // using the pre-await branch guard.
      const afterSettle = this.state as State;
      if (afterSettle.kind !== "running") return false;
    }
    // At this point state is "running" — cast to extract server.
    const { server } = this.state as Extract<State, { kind: "running" }>;
    await new Promise<void>((resolve) => server.close(() => resolve()));
    this.state = { kind: "stopped" };
    this.active.clear();
    this.read.clear();
    return true;
  }
}
