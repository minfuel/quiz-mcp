import { getContext, setContext } from "svelte";
import {
  makeTranslator,
  type I18nDict,
  type Translate,
  type I18nKey,
  type TranslateParams,
} from "./i18n.js";

const I18N_CONTEXT_KEY = Symbol("quiz-i18n");

/**
 * Call once in the root component's `<script>` block to provide an i18n
 * dictionary to all descendant components via Svelte context.
 *
 * Pass a getter (e.g. `() => dict`) so that reactive prop changes in the
 * calling component propagate naturally: each `t(...)` call re-reads the
 * current dictionary via `dictGetter()`.
 */
export function provideI18n(dictGetter: () => I18nDict): void {
  setContext(I18N_CONTEXT_KEY, dictGetter);
}

/**
 * Call once per component in its `<script>` block to obtain a `t` function.
 * Falls back to an empty-dict translator (shows DEFAULT_I18N values) when no
 * provider is present, so components remain usable in isolation.
 */
export function useI18n(): Translate {
  const getter = getContext<(() => I18nDict) | undefined>(I18N_CONTEXT_KEY);
  if (!getter) return makeTranslator({});
  return ((key: I18nKey, params?: TranslateParams) =>
    makeTranslator(getter())(key, params)) as Translate;
}
