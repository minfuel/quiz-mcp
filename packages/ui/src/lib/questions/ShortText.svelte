<script lang="ts">
  import type { ShortTextQuestion, ShortTextAnswer } from '@quiz-mcp/core';
  import { useI18n } from '../i18n-svelte.js';

  interface Props {
    question: ShortTextQuestion;
    value?: ShortTextAnswer;
    disabled?: boolean;
    onChange: (answer: ShortTextAnswer) => void;
  }

  let { question, value, disabled = false, onChange }: Props = $props();

  const t = useI18n();
  const text = $derived(value?.text ?? '');

  function handleInput(e: Event) {
    const next = (e.currentTarget as HTMLInputElement).value;
    onChange({
      _kind: 'short_text',
      questionId: question.id,
      text: next,
    });
  }
</script>

<div class="flex flex-col gap-1">
  <input
    type="text"
    class="input input-bordered w-full"
    placeholder={question.placeholder ?? ''}
    maxlength={question.maxLength}
    value={text}
    {disabled}
    oninput={handleInput}
  />
  {#if question.maxLength}
    <div class="text-base-content/60 text-right text-xs">
      {t('question.shorttext.character_count', { current: text.length, max: question.maxLength ?? 0 })}
    </div>
  {/if}
</div>
