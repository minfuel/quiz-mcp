<script lang="ts">
  import type {
    SingleChoiceQuestion,
    SingleChoiceAnswer,
  } from '@quiz-mcp/core';
  import AttachmentView from '../shared/AttachmentView.svelte';

  interface Props {
    question: SingleChoiceQuestion;
    value?: SingleChoiceAnswer;
    disabled?: boolean;
    onChange: (answer: SingleChoiceAnswer) => void;
  }

  let { question, value, disabled = false, onChange }: Props = $props();

  const groupName = $derived(`sc-${question.id}`);

  function select(optionId: string) {
    onChange({
      _kind: 'single_choice',
      questionId: question.id,
      optionId,
    });
  }
</script>

<div
  class={question.mode === 'grid'
    ? 'grid grid-cols-2 gap-3 sm:grid-cols-3'
    : 'flex flex-col gap-2'}
>
    {#each question.options as option (option.id)}
      {@const checked = value?.optionId === option.id}
      <label
        class={[
          'label hover:bg-base-200 flex cursor-pointer items-start gap-3 rounded-box border p-3',
          checked ? 'border-primary bg-primary/5' : 'border-base-300',
        ]}
      >
        <input
          type="radio"
          class="radio radio-primary mt-0.5"
          name={groupName}
          value={option.id}
          {checked}
          {disabled}
          onchange={() => select(option.id)}
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
