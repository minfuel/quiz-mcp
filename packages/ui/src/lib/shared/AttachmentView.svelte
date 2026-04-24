<script lang="ts">
  import type { Attachment } from '@quiz-mcp/core';

  interface Props {
    attachment: Attachment;
  }

  let { attachment }: Props = $props();
</script>

{#if attachment.type === 'image'}
  <img
    src={attachment.url}
    alt={attachment.alt ?? ''}
    class="h-auto w-full max-h-[70svh] rounded-box border border-base-300 bg-base-200 object-contain"
  />
{:else if attachment.type === 'video'}
  <!-- svelte-ignore a11y_media_has_caption -->
  <video
    controls
    src={attachment.url}
    class="h-auto w-full max-h-[70svh] rounded-box border border-base-300"
  ></video>
{:else if attachment.type === 'audio'}
  <audio controls src={attachment.url} class="w-full"></audio>
{:else if attachment.type === 'file'}
  <a
    href={attachment.url}
    target="_blank"
    rel="noopener noreferrer"
    class="link link-primary inline-flex items-center gap-2"
  >
    <span aria-hidden="true">📎</span>
    <span>{attachment.alt ?? attachment.url}</span>
  </a>
{:else if attachment.type === 'code'}
  <div class="mockup-code text-sm">
    <pre><code>{attachment.code}</code></pre>
  </div>
{/if}
