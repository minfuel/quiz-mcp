<script lang="ts">
  import type { SortingQuestion, SortingAnswer } from '@quiz-mcp/core';
  import AttachmentView from '../shared/AttachmentView.svelte';
  import { useI18n } from '../i18n-svelte.js';

  interface Props {
    question: SortingQuestion;
    value?: SortingAnswer;
    disabled?: boolean;
    onChange: (answer: SortingAnswer) => void;
  }

  let { question, value, disabled = false, onChange }: Props = $props();

  const t = useI18n();

  /**
   * Текущий порядок id'шников. Если ответа ещё нет — берём порядок из вопроса.
   * Если ответ есть, но не содержит всех id (например, вопрос изменился) —
   * дополняем отсутствующими в их оригинальном порядке.
   */
  const orderedIds = $derived.by<string[]>(() => {
    const orig = question.items.map((it) => it.id);
    const saved = value?.orderedIds ?? [];
    const savedFiltered = saved.filter((id) => orig.includes(id));
    const missing = orig.filter((id) => !savedFiltered.includes(id));
    return [...savedFiltered, ...missing];
  });

  const itemById = $derived(new Map(question.items.map((it) => [it.id, it] as const)));

  function emit(next: string[]) {
    onChange({
      _kind: 'sorting',
      questionId: question.id,
      orderedIds: next,
    });
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= orderedIds.length) return;
    const next = [...orderedIds];
    [next[index], next[target]] = [next[target], next[index]];
    emit(next);
  }
</script>

<ol class="flex flex-col gap-2">
    {#each orderedIds as id, i (id)}
      {@const item = itemById.get(id)}
      {#if item}
        <li
          class="bg-base-100 flex items-center gap-3 rounded-box border border-base-300 p-3"
        >
          <span class="badge badge-neutral badge-lg shrink-0">{i + 1}</span>

          <div class="flex min-w-0 grow flex-col gap-2">
            {#if item.text}
              <span class="text-base-content">{item.text}</span>
            {/if}
            {#if item.attachments}
              <div class="flex flex-wrap gap-2">
                {#each item.attachments as att (att.id)}
                  <AttachmentView attachment={att} />
                {/each}
              </div>
            {/if}
          </div>

          <div class="join shrink-0">
            <button
              type="button"
              class="btn btn-sm join-item"
              aria-label={t('button.move_up_aria')}
              disabled={disabled || i === 0}
              onclick={() => move(i, -1)}
            >
              ↑
            </button>
            <button
              type="button"
              class="btn btn-sm join-item"
              aria-label={t('button.move_down_aria')}
              disabled={disabled || i === orderedIds.length - 1}
              onclick={() => move(i, 1)}
            >
              ↓
            </button>
          </div>
        </li>
      {/if}
    {/each}
</ol>
