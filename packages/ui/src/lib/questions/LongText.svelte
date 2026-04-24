<script lang="ts">
  import type { LongTextQuestion, LongTextAnswer } from '@quiz-mcp/core';
  import { useI18n } from '../i18n-svelte.js';

  interface Props {
    question: LongTextQuestion;
    value?: LongTextAnswer;
    disabled?: boolean;
    onChange: (answer: LongTextAnswer) => void;
  }

  let { question, value, disabled = false, onChange }: Props = $props();

  const t = useI18n();
  const text = $derived(value?.text ?? '');

  const tooShort = $derived(
    question.minLength !== undefined && text.length > 0 && text.length < question.minLength,
  );

  function handleInput(e: Event) {
    const next = (e.currentTarget as HTMLTextAreaElement).value;
    onChange({
      _kind: 'long_text',
      questionId: question.id,
      text: next,
    });
  }
</script>

<div class="flex flex-col gap-1">
  <textarea
    class="textarea textarea-bordered w-full"
    rows={question.rows ?? 5}
    placeholder={question.placeholder ?? ''}
    maxlength={question.maxLength}
    value={text}
    {disabled}
    oninput={handleInput}
  ></textarea>

  <div class="text-base-content/60 flex justify-between text-xs">
    <span>
      {#if tooShort}
        <span class="text-warning">{t('question.longtext.min_hint', { min: question.minLength ?? 0 })}</span>
      {:else if question.minLength}
        {t('question.longtext.min_label', { min: question.minLength })}
      {/if}
    </span>
    {#if question.maxLength}
      <span>{t('question.longtext.character_count', { current: text.length, max: question.maxLength })}</span>
    {:else}
      <span>{t('question.longtext.character_count_no_max', { current: text.length })}</span>
    {/if}
  </div>
</div>
