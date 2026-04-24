<script lang="ts">
  import type { ScaleQuestion, ScaleAnswer } from '@quiz-mcp/core';

  interface Props {
    question: ScaleQuestion;
    value?: ScaleAnswer;
    disabled?: boolean;
    onChange: (answer: ScaleAnswer) => void;
  }

  let { question, value, disabled = false, onChange }: Props = $props();

  const current = $derived(value?.value ?? question.min);

  /** Показываем тики, только если их не слишком много — иначе превращаются в шум. */
  const ticks = $derived.by<number[] | null>(() => {
    const count = Math.floor((question.max - question.min) / question.step) + 1;
    if (count > 21) return null;
    const out: number[] = [];
    for (let v = question.min; v <= question.max; v += question.step) {
      out.push(Number(v.toFixed(6)));
    }
    return out;
  });

  function handleInput(e: Event) {
    const next = Number((e.currentTarget as HTMLInputElement).value);
    onChange({
      _kind: 'scale',
      questionId: question.id,
      value: next,
    });
  }
</script>

<div class="flex flex-col gap-2">
  <div class="flex items-center gap-3">
    <span class="text-base-content/70 shrink-0 text-sm">
      {question.minLabel ?? question.min}
    </span>

    <div class="flex grow flex-col">
      <input
        type="range"
        class="range range-primary w-full"
        min={question.min}
        max={question.max}
        step={question.step}
        value={current}
        {disabled}
        oninput={handleInput}
      />
      {#if ticks}
        <div class="mt-1 flex w-full justify-between px-2 text-xs">
          {#each ticks as tick (tick)}
            <span class="text-base-content/40">|</span>
          {/each}
        </div>
      {/if}
    </div>

    <span class="text-base-content/70 shrink-0 text-sm">
      {question.maxLabel ?? question.max}
    </span>

    <span class="badge badge-primary badge-lg shrink-0 tabular-nums">{current}</span>
  </div>
</div>
