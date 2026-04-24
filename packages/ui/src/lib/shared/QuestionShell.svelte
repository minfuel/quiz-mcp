<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { Attachment } from '@quiz-mcp/core';
  import AttachmentView from './AttachmentView.svelte';
  import { useI18n } from '../i18n-svelte.js';

  interface Props {
    title?: string;
    text: string;
    required?: boolean;
    score?: number;
    attachments?: Attachment[][];
    children: Snippet;
  }

  let { title, text, required = false, score, attachments, children }: Props = $props();
  const t = useI18n();
</script>

<fieldset class="fieldset rounded-box border border-base-300 bg-base-100 p-5">
  {#if title}
    <legend class="fieldset-legend text-base-content/80 px-2 text-sm font-medium">{title}</legend>
  {/if}

  <div class="flex items-start justify-between gap-3">
    <p class="text-base-content text-lg leading-snug">
      {text}
      {#if required}
        <span class="text-error" aria-label="required">{t('question.required_mark')}</span>
      {/if}
    </p>
    {#if typeof score === 'number'}
      <span class="badge badge-ghost badge-sm shrink-0">{score} pts</span>
    {/if}
  </div>

  {#if attachments && attachments.length > 0}
    <div class="mt-3 flex flex-col gap-3">
      {#each attachments as row, rowIdx (rowIdx)}
        <div class="flex flex-wrap gap-3">
          {#each row as att (att.id)}
            <div class="min-w-0 grow basis-40">
              <AttachmentView attachment={att} />
            </div>
          {/each}
        </div>
      {/each}
    </div>
  {/if}

  <div class="mt-4">
    {@render children()}
  </div>
</fieldset>
