<script lang="ts">
  import type {
    MultipleChoiceQuestion,
    MultipleChoiceAnswer,
  } from '@quiz-mcp/core';
  import AttachmentView from '../shared/AttachmentView.svelte';
  import { useI18n } from '../i18n-svelte.js';

  interface Props {
    question: MultipleChoiceQuestion;
    value?: MultipleChoiceAnswer;
    disabled?: boolean;
    onChange: (answer: MultipleChoiceAnswer) => void;
  }

  let { question, value, disabled = false, onChange }: Props = $props();

  const t = useI18n();
  const selected = $derived(new Set(value?.optionIds ?? []));

  const outOfRange = $derived.by(() => {
    const n = selected.size;
    if (question.minSelections !== undefined && n < question.minSelections) {
      return t('question.multiplechoice.min_hint', { min: question.minSelections });
    }
    if (question.maxSelections !== undefined && n > question.maxSelections) {
      return t('question.multiplechoice.max_hint', { max: question.maxSelections });
    }
    return null;
  });

  function toggle(optionId: string) {
    const next = new Set(selected);
    if (next.has(optionId)) next.delete(optionId);
    else next.add(optionId);
    onChange({
      _kind: 'multiple_choice',
      questionId: question.id,
      optionIds: [...next],
    });
  }
</script>

<div class="flex flex-col gap-2">
  <div
    class={question.mode === 'grid'
      ? 'grid grid-cols-2 gap-3 sm:grid-cols-3'
      : 'flex flex-col gap-2'}
  >
    {#each question.options as option (option.id)}
      {@const checked = selected.has(option.id)}
      <label
        class={[
          'label hover:bg-base-200 flex cursor-pointer items-start gap-3 rounded-box border p-3',
          checked ? 'border-primary bg-primary/5' : 'border-base-300',
        ]}
      >
        <input
          type="checkbox"
          class="checkbox checkbox-primary mt-0.5"
          {checked}
          {disabled}
          onchange={() => toggle(option.id)}
        />
        <span class="flex min-w-0 grow flex-col gap-2">
          <span class="label-text text-base-content">{option.label}</span>
          {#if option.attachment}
            <AttachmentView attachment={option.attachment} />
          {/if}
        </span>
      </label>
    {/each}
  </div>

  {#if question.minSelections !== undefined || question.maxSelections !== undefined}
    <div class="text-base-content/60 mt-2 text-xs">
      {#if question.minSelections !== undefined && question.maxSelections !== undefined}
        {t('question.multiplechoice.range_hint', { min: question.minSelections, max: question.maxSelections })}
      {:else if question.minSelections !== undefined}
        {t('question.multiplechoice.min_hint', { min: question.minSelections })}
      {:else}
        {t('question.multiplechoice.max_hint', { max: question.maxSelections ?? 0 })}
      {/if}
    </div>
  {/if}

  {#if outOfRange}
    <div role="alert" class="alert alert-warning alert-soft mt-2 py-2 text-sm">
      {outOfRange}
    </div>
  {/if}
</div>
