# @quiz-mcp/web-components

Framework-agnostic `<quiz-player>` custom element. Wraps the Svelte 5 `Player`
from [`@quiz-mcp/ui`](../ui) in a Shadow DOM so it can be dropped into any page
— React, Vue, vanilla HTML, server-rendered templates — without leaking styles
or pulling in a Svelte runtime at the call site.

Tailwind 4 + DaisyUI 5 are compiled into the bundle and scoped to the shadow
tree. The element mirrors the outer page's `data-theme` automatically, so
DaisyUI theme switches on `<html>` propagate to the player.

## Install

The package is an internal workspace dependency (`"private": true`) — add it
via pnpm workspace protocol:

```jsonc
// package.json
{
  "dependencies": {
    "@quiz-mcp/web-components": "workspace:*"
  }
}
```

Registering the element has a side effect (it calls `customElements.define`),
so import the entry for its side effect:

```ts
import "@quiz-mcp/web-components";
```

For a no-bundler drop-in, use the IIFE build:

```html
<script src="/path/to/quiz-mcp-web-components.iife.js"></script>
```

## Quick start

```html
<quiz-player id="player" mode="cards"></quiz-player>

<script type="module">
  import "@quiz-mcp/web-components";

  const player = document.getElementById("player");

  // `quiz` is a complex object — set it as a property, not an attribute.
  player.quiz = {
    id: "demo",
    title: "Demo Quiz",
    questions: [
      { id: "q1", type: "short-text", title: "Your name?" },
    ],
  };

  player.addEventListener("quiz-answer", (e) => {
    console.log("answer:", e.detail);
  });

  player.addEventListener("quiz-finish", (e) => {
    console.log("final answers:", e.detail.answers);
  });

  player.addEventListener("quiz-validation-error", (e) => {
    console.warn("invalid:", e.detail.report);
  });
</script>
```

## Element API

### `<quiz-player>`

All inputs are exposed as observed attributes *and* DOM properties. Prefer
properties for anything that isn't a plain string — attributes are
stringified, so passing an object literal as an attribute won't work.

| Property     | Type                                        | Required | Default  | Description |
| ------------ | ------------------------------------------- | :------: | -------- | ----------- |
| `quiz`       | `Quiz`                                      | yes      | —        | Quiz definition from `@quiz-mcp/core`. |
| `mode`       | `"cards" \| "full"`                         | no       | `"full"` | Layout. `cards` renders one question at a time with next/back controls; `full` renders every question in a single scroll. |
| `answers`    | `Record<string, Answer>`                    | no       | —        | Pre-populated answers keyed by `question.id`. Useful for resuming a session. |
| `uploadFile` | `(file: File) => Promise<UploadedFile>`     | no       | —        | Hook for `file` questions. Must return an `UploadedFile`. Setting this only works as a property. |
| `i18n`       | `I18nDict`                                  | no       | `{}`     | Translation dictionary from `@quiz-mcp/ui/i18n`. Fallbacks are English. |

The types come from the workspace:

```ts
import type { Answer, Quiz, UploadedFile } from "@quiz-mcp/core";
import type { I18nDict } from "@quiz-mcp/ui/i18n";
```

### Events

Events bubble through the shadow boundary (`bubbles: true, composed: true`),
so you can listen on the element itself or on any ancestor.

| Event                    | `detail` shape                                         | When it fires |
| ------------------------ | ------------------------------------------------------ | ------------- |
| `quiz-answer`            | `Answer`                                               | Every time the user changes an answer. |
| `quiz-finish`            | `{ answers: Record<string, Answer> }`                  | User submits and all answers validate. |
| `quiz-validation-error`  | `{ answers: Record<string, Answer>, report: ValidateQuizResult }` | User submits but validation fails. The `report` is from `@quiz-mcp/core/validation`. |

Event types are augmented on `HTMLElementEventMap`, so `addEventListener`
is fully typed without casting:

```ts
player.addEventListener("quiz-finish", (e) => {
  //                                     ^-- CustomEvent<{ answers: Record<string, Answer> }>
  send(e.detail.answers);
});
```

### Methods

| Method                         | Description |
| ------------------------------ | ----------- |
| `focusQuestion(questionId)`    | Scrolls to and focuses the matching question. Useful when rendering a validation summary above the player — click on an issue, call `focusQuestion(id)`. |

```ts
document.getElementById("player").focusQuestion("q1");
```

## Theming

The player reads DaisyUI theme tokens at runtime. There are two equivalent
ways to set a theme:

**1. Let it follow the document theme (default).**

The element observes `document.documentElement` for `data-theme` changes and
mirrors the attribute onto itself. No code needed on your side:

```html
<html data-theme="dark">
  <quiz-player></quiz-player>
</html>
```

**2. Set the theme directly on the element.**

```html
<quiz-player data-theme="light"></quiz-player>
```

### Overriding tokens from the outside

Because the player lives in a shadow tree, plain stylesheets on the host page
can't reach it. To push custom DaisyUI tokens in, use `adoptedStyleSheets` on
the shadow root:

```ts
await customElements.whenDefined("quiz-player");

const sheet = new CSSStyleSheet();
// DaisyUI 5 declares defaults inside `@layer base`. !important is required
// to break out of the layer and win the cascade inside the shadow tree.
sheet.replaceSync(`
  :host, :host([data-theme="light"]) {
    --color-primary: oklch(0.6 0.2 250) !important;
    --color-primary-content: oklch(0.98 0 0) !important;
  }
`);

const player = document.querySelector("quiz-player");
player.shadowRoot.adoptedStyleSheets = [
  ...player.shadowRoot.adoptedStyleSheets,
  sheet,
];
```

See `packages/runner-ui/src/quiz-host.tsx` for a production example that
forwards a server-provided token map into the shadow tree this way.

## Framework integration

### React

React < 19 doesn't serialize object props to custom elements, so set them
imperatively via a ref:

```tsx
import { useEffect, useRef } from "react";
import "@quiz-mcp/web-components";
import type { Quiz } from "@quiz-mcp/core";

export function Quiz({ quiz }: { quiz: Quiz }) {
  const ref = useRef<HTMLElement & { quiz?: Quiz }>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.quiz = quiz;

    const onFinish = (e: Event) => {
      const { answers } = (e as CustomEvent).detail;
      // send to server …
    };
    el.addEventListener("quiz-finish", onFinish);
    return () => el.removeEventListener("quiz-finish", onFinish);
  }, [quiz]);

  return <quiz-player ref={ref} mode="cards" />;
}
```

For a working end-to-end example, see `packages/runner-ui/src/quiz-host.tsx`.

### Vanilla HTML (IIFE)

```html
<script src="/assets/quiz-mcp-web-components.iife.js"></script>
<quiz-player id="p"></quiz-player>
<script>
  document.getElementById("p").quiz = { /* … */ };
</script>
```

## Build

Vite library build — outputs ES and IIFE bundles from `src/index.ts`:

```bash
pnpm --filter @quiz-mcp/web-components build       # one-shot
pnpm --filter @quiz-mcp/web-components dev         # watch mode
pnpm --filter @quiz-mcp/web-components typecheck   # svelte-check
```

Produces:

- `dist/quiz-mcp-web-components.mjs` — ES module, the default export path
- `dist/quiz-mcp-web-components.iife.js` — IIFE bundle for `<script>` tags, exposed as `QuizMcpWebComponents`
- `dist/index.d.ts` — TypeScript types, including the `HTMLElementEventMap` augmentation

## Gotchas

- **Complex props must be set as properties, not attributes.** `quiz`, `answers`, `i18n`, and `uploadFile` are non-string values. Setting them via HTML attributes will either fail silently or coerce to `"[object Object]"`.
- **Register before use.** `customElements.whenDefined("quiz-player")` is your friend if you set properties from code that may run before the bundle has finished loading.
- **Events cross the shadow boundary.** Listeners on ancestors work, but `event.target` will be the `<quiz-player>` host, not the inner element that triggered the event. Use `event.detail`, not DOM traversal.
