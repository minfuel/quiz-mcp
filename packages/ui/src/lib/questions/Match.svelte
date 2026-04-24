<script lang="ts">
  import type { MatchQuestion, MatchAnswer, MatchPair } from '@quiz-mcp/core';
  import AttachmentView from '../shared/AttachmentView.svelte';
  import { useI18n } from '../i18n-svelte.js';

  interface Props {
    question: MatchQuestion;
    value?: MatchAnswer;
    disabled?: boolean;
    onChange: (answer: MatchAnswer) => void;
  }

  let { question, value, disabled = false, onChange }: Props = $props();

  const t = useI18n();
  const leftItems = $derived(question.pairs[0]);
  const rightItems = $derived(question.pairs[1]);
  const currentMatches = $derived<MatchPair[]>(value?.matches ?? []);

  /** Быстрый lookup: leftId → rightId (если у этого левого уже выбран right). */
  const rightByLeft = $derived(
    new Map(currentMatches.map((p) => [p.leftId, p.rightId] as const)),
  );

  // Политика: строгое 1-к-1 — каждый rightId используется не более одного раза.
  function setMatch(leftId: string, rightId: string) {
    const cleared = currentMatches.filter(
      (p) => p.leftId !== leftId && p.rightId !== rightId,
    );
    const next = rightId ? [...cleared, { leftId, rightId }] : cleared;
    emit(next);
  }

  function emit(matches: MatchPair[]) {
    onChange({
      _kind: 'match',
      questionId: question.id,
      matches,
    });
  }
</script>

<div class="flex flex-col gap-2">
    {#each leftItems as left (left.id)}
      {@const selectedRight = rightByLeft.get(left.id) ?? ''}
      <div
        class="bg-base-100 grid grid-cols-1 items-center gap-3 rounded-box border border-base-300 p-3 sm:grid-cols-[1fr_auto_1fr]"
      >
        <div class="flex min-w-0 flex-col gap-2">
          {#if left.text}
            <span class="text-base-content">{left.text}</span>
          {/if}
          {#if left.attachments}
            <div class="flex flex-wrap gap-2">
              {#each left.attachments as att (att.id)}
                <AttachmentView attachment={att} />
              {/each}
            </div>
          {/if}
        </div>

        <div class="text-base-content/40 hidden justify-center sm:flex" aria-hidden="true">→</div>

        <select
          class="select select-bordered w-full"
          value={selectedRight}
          {disabled}
          onchange={(e) =>
            setMatch(left.id, (e.currentTarget as HTMLSelectElement).value)}
        >
          <option value="">{t('question.match.unset_label')}</option>
          {#each rightItems as right (right.id)}
            <option value={right.id}>{right.text ?? right.id}</option>
          {/each}
        </select>
      </div>
    {/each}
</div>
