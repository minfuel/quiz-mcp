<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { Quiz, Answer, UploadedFile } from '@quiz-mcp/core';
  import QuestionRenderer from './QuestionRenderer.svelte';
  import QuestionShell from './shared/QuestionShell.svelte';
  import { useI18n } from './i18n-svelte.js';

  type Mode = 'cards' | 'full';

  interface NavSnippetProps {
    onClick: () => void;
    disabled: boolean;
  }

  interface Props {
    quiz: Quiz;
    mode?: Mode;
    answers?: Record<string, Answer>;
    uploadFile?: (file: File) => Promise<UploadedFile>;
    onAnswer: (answer: Answer) => void;
    onFinish: (answers: Record<string, Answer>) => void;
    prev?: Snippet<[NavSnippetProps]>;
    next?: Snippet<[NavSnippetProps]>;
    complete?: Snippet<[NavSnippetProps]>;
  }

  let {
    quiz,
    mode = 'full',
    answers: externalAnswers,
    uploadFile,
    onAnswer,
    onFinish,
    prev,
    next,
    complete,
  }: Props = $props();

  const t = useI18n();

  let internalAnswers = $state<Record<string, Answer>>({});
  const answers = $derived(externalAnswers ?? internalAnswers);

  let currentIndex = $state(0);
  const currentQuestion = $derived(quiz.questions[currentIndex]);
  const isFirst = $derived(currentIndex === 0);
  const isLast = $derived(currentIndex === quiz.questions.length - 1);

  let fullContainer = $state<HTMLElement | undefined>();

  function handleChange(a: Answer) {
    if (!externalAnswers) {
      internalAnswers = { ...internalAnswers, [a.questionId]: a };
    }
    onAnswer(a);
  }

  function goPrev() {
    if (isFirst) return;
    currentIndex -= 1;
  }
  function goNext() {
    if (isLast) return;
    currentIndex += 1;
  }
  function finish() {
    onFinish(answers);
  }

  export function focusQuestion(questionId: string): void {
    const idx = quiz.questions.findIndex((q) => q.id === questionId);
    if (idx === -1) return;

    if (mode === 'cards') {
      currentIndex = idx;
      return;
    }

    const el = fullContainer?.querySelector<HTMLElement>(
      `[data-question-id="${CSS.escape(questionId)}"]`,
    );
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
</script>

{#if mode === 'full'}
  <div bind:this={fullContainer} class="flex flex-col gap-5">
    {#each quiz.questions as q (q.id)}
      <div data-question-id={q.id}>
        <QuestionShell
          title={q.title}
          text={q.text}
          required={q.required}
          score={q.score}
          attachments={q.attachments}
        >
          <QuestionRenderer
            question={q}
            value={answers[q.id]}
            onChange={handleChange}
            {uploadFile}
          />
        </QuestionShell>
      </div>
    {/each}
    <div class="flex justify-end">
      {#if complete}
        {@render complete({ onClick: finish, disabled: false })}
      {:else}
        <button class="btn btn-primary" onclick={finish}>{t('button.complete')}</button>
      {/if}
    </div>
  </div>
{:else if currentQuestion}
  <div class="flex flex-col gap-5">
    <div data-question-id={currentQuestion.id}>
      <QuestionShell
        title={currentQuestion.title}
        text={currentQuestion.text}
        required={currentQuestion.required}
        score={currentQuestion.score}
        attachments={currentQuestion.attachments}
      >
        <QuestionRenderer
          question={currentQuestion}
          value={answers[currentQuestion.id]}
          onChange={handleChange}
          {uploadFile}
        />
      </QuestionShell>
    </div>
    <div class="flex justify-between gap-2">
      {#if prev}
        {@render prev({ onClick: goPrev, disabled: isFirst })}
      {:else}
        <button class="btn" onclick={goPrev} disabled={isFirst}>{t('button.back')}</button>
      {/if}

      {#if isLast}
        {#if complete}
          {@render complete({ onClick: finish, disabled: false })}
        {:else}
          <button class="btn btn-primary" onclick={finish}>{t('button.complete')}</button>
        {/if}
      {:else if next}
        {@render next({ onClick: goNext, disabled: false })}
      {:else}
        <button class="btn btn-primary" onclick={goNext}>{t('button.next')}</button>
      {/if}
    </div>
  </div>
{/if}
