<script lang="ts">
  import type {
    UploadQuestion,
    UploadAnswer,
    UploadedFile,
    FileKind,
  } from '@quiz-mcp/core';
  import { useI18n } from '../i18n-svelte.js';

  interface Props {
    question: UploadQuestion;
    value?: UploadAnswer;
    disabled?: boolean;
    onChange: (answer: UploadAnswer) => void;
    /**
     * Если не передан — используется локальный blob URL как fallback.
     * В проде обычно задают, чтобы загружать на сервер и вернуть публичный URL.
     */
    uploadFile?: (file: File) => Promise<UploadedFile>;
  }

  let { question, value, disabled = false, onChange, uploadFile }: Props = $props();

  const t = useI18n();
  const files = $derived(value?.files ?? []);
  let busy = $state(false);
  let err = $state<string | null>(null);

  const acceptAttr = $derived(buildAcceptAttr(question.accept));

  function buildAcceptAttr(kinds: FileKind[]): string | undefined {
    if (kinds.includes('any')) return undefined;
    const map: Record<Exclude<FileKind, 'any'>, string> = {
      image: 'image/*',
      video: 'video/*',
      audio: 'audio/*',
      pdf: 'application/pdf',
      docx: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      csv: '.csv,text/csv',
    };
    return kinds.map((k) => map[k as Exclude<FileKind, 'any'>]).join(',');
  }

  function humanSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  async function onPick(e: Event) {
    const el = e.currentTarget as HTMLInputElement;
    const picked = el.files ? [...el.files] : [];
    el.value = '';
    if (picked.length === 0) return;

    const remaining = question.maxFiles
      ? Math.max(0, question.maxFiles - files.length)
      : picked.length;
    const take = picked.slice(0, remaining);

    if (question.maxSizeBytes) {
      const tooBig = take.find((f) => f.size > question.maxSizeBytes!);
      if (tooBig) {
        err = t('validation.issue.file_too_large_named', {
          name: tooBig.name,
          size: humanSize(question.maxSizeBytes),
        });
        return;
      }
    }
    err = null;

    busy = true;
    try {
      const uploaded = await Promise.all(
        take.map(async (f): Promise<UploadedFile> => {
          if (uploadFile) return await uploadFile(f);
          return {
            url: URL.createObjectURL(f),
            name: f.name,
            mimeType: f.type || 'application/octet-stream',
            sizeBytes: f.size,
          };
        }),
      );
      onChange({
        _kind: 'upload',
        questionId: question.id,
        files: [...files, ...uploaded],
      });
    } catch (e) {
      err = e instanceof Error ? e.message : t('question.upload.upload_failed');
    } finally {
      busy = false;
    }
  }

  function removeAt(i: number) {
    const next = files.filter((_, idx) => idx !== i);
    onChange({ _kind: 'upload', questionId: question.id, files: next });
  }
</script>

<div class="flex flex-col gap-1">
  <input
    type="file"
    class="file-input file-input-bordered w-full"
    multiple={question.maxFiles !== 1}
    accept={acceptAttr}
    disabled={disabled || busy || (question.maxFiles !== undefined && files.length >= question.maxFiles)}
    onchange={onPick}
  />

  <div class="text-base-content/60 mt-1 flex flex-wrap gap-x-3 text-xs">
    <span>{t('question.upload.accepts_label', { kinds: question.accept.join(', ') })}</span>
    {#if question.maxFiles}
      <span>{t('question.upload.max_files_label', { max: question.maxFiles })}</span>
    {/if}
    {#if question.maxSizeBytes}
      <span>{t('question.upload.max_size_label', { size: humanSize(question.maxSizeBytes) })}</span>
    {/if}
  </div>

  {#if busy}
    <div class="mt-2 flex items-center gap-2 text-sm">
      <span class="loading loading-spinner loading-sm"></span> {t('question.upload.uploading')}
    </div>
  {/if}

  {#if err}
    <div role="alert" class="alert alert-error alert-soft mt-2 py-2 text-sm">{err}</div>
  {/if}

  {#if files.length > 0}
    <ul class="mt-3 flex flex-col gap-2">
      {#each files as f, i (f.url + i)}
        <li class="flex items-center gap-3 rounded-box border border-base-300 bg-base-200 px-3 py-2">
          <span class="grow truncate">
            <span class="font-medium">{f.name}</span>
            <span class="text-base-content/60 ml-2 text-xs">
              {f.mimeType} · {humanSize(f.sizeBytes)}
            </span>
          </span>
          <a href={f.url} target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-xs">
            {t('button.open_file')}
          </a>
          <button
            type="button"
            class="btn btn-ghost btn-xs text-error"
            {disabled}
            onclick={() => removeAt(i)}
          >
            {t('button.remove_file')}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
