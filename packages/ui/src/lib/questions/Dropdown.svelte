<script lang="ts">
  import type { DropdownQuestion, DropdownAnswer } from '@quiz-mcp/core';
  import { useI18n } from '../i18n-svelte.js';

  interface Props {
    question: DropdownQuestion;
    value?: DropdownAnswer;
    disabled?: boolean;
    onChange: (answer: DropdownAnswer) => void;
  }

  let { question, value, disabled = false, onChange }: Props = $props();

  const t = useI18n();
  const selections = $derived(value?.selections ?? []);
  const labelById = $derived(
    new Map(question.options.map((o) => [o.id, o.label] as const)),
  );

  let tagDraft = $state('');

  function emit(selections: string[]) {
    onChange({ _kind: 'dropdown', questionId: question.id, selections });
  }

  function onSingleChange(e: Event) {
    const v = (e.currentTarget as HTMLSelectElement).value;
    emit(v ? [v] : []);
  }

  function onMultiChange(e: Event) {
    const el = e.currentTarget as HTMLSelectElement;
    const picked: string[] = [];
    for (const opt of el.selectedOptions) picked.push(opt.value);
    emit(picked);
  }

  function toggleTag(v: string) {
    emit(selections.includes(v) ? selections.filter((s) => s !== v) : [...selections, v]);
  }

  function addTagDraft() {
    const v = tagDraft.trim();
    if (!v || selections.includes(v)) {
      tagDraft = '';
      return;
    }
    emit([...selections, v]);
    tagDraft = '';
  }

  function onTagKey(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTagDraft();
    }
  }
</script>

<div class="flex flex-col gap-1">
  {#if question.mode === 'single'}
    <select
      class="select select-bordered w-full"
      value={selections[0] ?? ''}
      {disabled}
      onchange={onSingleChange}
    >
      <option value="" disabled>{t('question.dropdown.placeholder')}</option>
      {#each question.options as option (option.id)}
        <option value={option.id}>{option.label}</option>
      {/each}
    </select>
  {:else if question.mode === 'multiple'}
    <select
      class="select select-bordered h-auto w-full"
      multiple
      size={Math.min(8, Math.max(3, question.options.length))}
      {disabled}
      onchange={onMultiChange}
    >
      {#each question.options as option (option.id)}
        <option value={option.id} selected={selections.includes(option.id)}>
          {option.label}
        </option>
      {/each}
    </select>
    <div class="text-base-content/60 mt-1 text-xs">{t('question.dropdown.multiselect_hint')}</div>
  {:else}
    <div class="flex flex-wrap gap-2">
      {#each question.options as option (option.id)}
        {@const active = selections.includes(option.id)}
        <button
          type="button"
          class="badge badge-lg cursor-pointer"
          class:badge-primary={active}
          class:badge-outline={!active}
          {disabled}
          onclick={() => toggleTag(option.id)}
        >
          {option.label}
        </button>
      {/each}
    </div>

    <div class="divider my-2"></div>

    <div class="flex flex-wrap items-center gap-2">
      {#each selections.filter((s) => !labelById.has(s)) as tag (tag)}
        <span class="badge badge-accent gap-1">
          {tag}
          <button
            type="button"
            class="btn btn-xs btn-circle btn-ghost"
            aria-label={t('button.remove_tag_aria')}
            onclick={() => toggleTag(tag)}
          >
            ✕
          </button>
        </span>
      {/each}

      <div class="join">
        <input
          type="text"
          class="input input-bordered input-sm join-item"
          placeholder={t('question.dropdown.custom_tag_placeholder')}
          bind:value={tagDraft}
          onkeydown={onTagKey}
          {disabled}
        />
        <button type="button" class="btn btn-sm btn-primary join-item" onclick={addTagDraft}>
          {t('button.add_tag')}
        </button>
      </div>
    </div>
  {/if}
</div>
