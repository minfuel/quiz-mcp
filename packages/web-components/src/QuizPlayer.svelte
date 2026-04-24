<svelte:options
  customElement={{
    tag: 'quiz-player',
    shadow: 'open',
    props: {
      quiz: { type: 'Object' },
      mode: { type: 'String' },
      answers: { type: 'Object' },
      i18n: { type: 'Object' },
    },
  }}
/>

<script lang="ts">
  import type { Answer, Quiz, UploadedFile } from '@quiz-mcp/core';
  import { validateQuiz } from '@quiz-mcp/core/validation';
  import { Player } from '@quiz-mcp/ui';
  import { provideI18n, useI18n } from '@quiz-mcp/ui/i18n-svelte';
  import type { I18nDict } from '@quiz-mcp/ui/i18n';
  import shadowStyles from './shadow.css?inline';
  import type {
    QuizFinishEventDetail,
    QuizValidationErrorEventDetail,
  } from './types';

  type Mode = 'cards' | 'full';

  interface Props {
    quiz: Quiz;
    mode?: Mode;
    answers?: Record<string, Answer>;
    uploadFile?: (file: File) => Promise<UploadedFile>;
    i18n?: I18nDict;
  }

  let {
    quiz,
    mode = 'full',
    answers,
    uploadFile,
    i18n,
  }: Props = $props();

  provideI18n(() => i18n ?? {});
  const t = useI18n();

  let playerRef = $state<
    { focusQuestion: (questionId: string) => void } | undefined
  >();

  const hostEl = $host() as HTMLElement & {
    focusQuestion?: (questionId: string) => void;
  };

  // DaisyUI compiles theme tokens against `:root` and theme variants against
  // `[data-theme="..."]`. Neither matches inside a shadow tree by default:
  // `:root` does not target the shadow host, and bare attribute selectors
  // don't reach the host either. Rewrite both to `:host` forms so outer theme
  // choices (mirrored onto the host in the $effect below) actually apply.
  const scopedShadowStyles = shadowStyles
    .replace(/:root/g, ':host')
    .replace(/\[data-theme=["']?([^"'\]]+)["']?\]/g, ':host([data-theme="$1"])');

  function handleAnswer(a: Answer) {
    hostEl.dispatchEvent(
      new CustomEvent<Answer>('quiz-answer', {
        detail: a,
        bubbles: true,
        composed: true,
      }),
    );
  }

  function handleFinish(final: Record<string, Answer>) {
    const report = validateQuiz(quiz, final);
    if (report.ok) {
      hostEl.dispatchEvent(
        new CustomEvent<QuizFinishEventDetail>('quiz-finish', {
          detail: { answers: final },
          bubbles: true,
          composed: true,
        }),
      );
    } else {
      hostEl.dispatchEvent(
        new CustomEvent<QuizValidationErrorEventDetail>('quiz-validation-error', {
          detail: { answers: final, report },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  $effect(() => {
    hostEl.focusQuestion = (questionId: string) => {
      playerRef?.focusQuestion(questionId);
    };
    return () => {
      delete hostEl.focusQuestion;
    };
  });

  $effect(() => {
    const rootEl = document.documentElement;
    const sync = () => {
      const theme = rootEl.getAttribute('data-theme');
      if (theme) hostEl.setAttribute('data-theme', theme);
      else hostEl.removeAttribute('data-theme');
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(rootEl, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  });
</script>

{@html `<style>${scopedShadowStyles}</style>`}

{#snippet prevSnippet({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
})}
  <span
    class="contents"
    data-disabled={disabled ? '' : null}
    onclick={disabled ? undefined : onClick}
    onkeydown={(e) => {
      if (!disabled && (e.key === 'Enter' || e.key === ' ')) onClick();
    }}
    role="presentation"
  >
    <button class="btn" {disabled}>{t('button.back')}</button>
  </span>
{/snippet}

{#snippet nextSnippet({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
})}
  <span
    class="contents"
    data-disabled={disabled ? '' : null}
    onclick={disabled ? undefined : onClick}
    onkeydown={(e) => {
      if (!disabled && (e.key === 'Enter' || e.key === ' ')) onClick();
    }}
    role="presentation"
  >
    <button class="btn btn-primary" {disabled}>{t('button.next')}</button>
  </span>
{/snippet}

{#snippet completeSnippet({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
})}
  <span
    class="contents"
    data-disabled={disabled ? '' : null}
    onclick={disabled ? undefined : onClick}
    onkeydown={(e) => {
      if (!disabled && (e.key === 'Enter' || e.key === ' ')) onClick();
    }}
    role="presentation"
  >
    <button class="btn btn-primary" {disabled}>{t('button.complete')}</button>
  </span>
{/snippet}

<Player
  bind:this={playerRef}
  {quiz}
  {mode}
  {answers}
  {uploadFile}
  onAnswer={handleAnswer}
  onFinish={handleFinish}
  prev={prevSnippet}
  next={nextSnippet}
  complete={completeSnippet}
/>
