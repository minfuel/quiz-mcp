#!/usr/bin/env node
import { run } from "./run.js";

run({
  argv: process.argv.slice(2),
  stdin: process.stdin,
  isStdinTty: Boolean(process.stdin.isTTY),
}).then((code) => process.exit(code));
