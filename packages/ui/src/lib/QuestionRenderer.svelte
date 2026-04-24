<script lang="ts">
  import type { Question, Answer, UploadedFile } from '@quiz-mcp/core';
  import SingleChoice from './questions/SingleChoice.svelte';
  import MultipleChoice from './questions/MultipleChoice.svelte';
  import ShortText from './questions/ShortText.svelte';
  import LongText from './questions/LongText.svelte';
  import Dropdown from './questions/Dropdown.svelte';
  import FillGaps from './questions/FillGaps.svelte';
  import Match from './questions/Match.svelte';
  import Scale from './questions/Scale.svelte';
  import Sorting from './questions/Sorting.svelte';
  import Upload from './questions/Upload.svelte';

  interface Props {
    question: Question;
    value?: Answer;
    disabled?: boolean;
    onChange: (answer: Answer) => void;
    uploadFile?: (file: File) => Promise<UploadedFile>;
  }

  let { question, value, disabled = false, onChange, uploadFile }: Props = $props();
</script>

{#if question._kind === 'single_choice'}
  <SingleChoice
    {question}
    value={value?._kind === 'single_choice' ? value : undefined}
    {disabled}
    {onChange}
  />
{:else if question._kind === 'multiple_choice'}
  <MultipleChoice
    {question}
    value={value?._kind === 'multiple_choice' ? value : undefined}
    {disabled}
    {onChange}
  />
{:else if question._kind === 'short_text'}
  <ShortText
    {question}
    value={value?._kind === 'short_text' ? value : undefined}
    {disabled}
    {onChange}
  />
{:else if question._kind === 'long_text'}
  <LongText
    {question}
    value={value?._kind === 'long_text' ? value : undefined}
    {disabled}
    {onChange}
  />
{:else if question._kind === 'dropdown'}
  <Dropdown
    {question}
    value={value?._kind === 'dropdown' ? value : undefined}
    {disabled}
    {onChange}
  />
{:else if question._kind === 'fill_gaps'}
  <FillGaps
    {question}
    value={value?._kind === 'fill_gaps' ? value : undefined}
    {disabled}
    {onChange}
  />
{:else if question._kind === 'match'}
  <Match
    {question}
    value={value?._kind === 'match' ? value : undefined}
    {disabled}
    {onChange}
  />
{:else if question._kind === 'scale'}
  <Scale
    {question}
    value={value?._kind === 'scale' ? value : undefined}
    {disabled}
    {onChange}
  />
{:else if question._kind === 'sorting'}
  <Sorting
    {question}
    value={value?._kind === 'sorting' ? value : undefined}
    {disabled}
    {onChange}
  />
{:else if question._kind === 'upload'}
  <Upload
    {question}
    value={value?._kind === 'upload' ? value : undefined}
    {disabled}
    {onChange}
    {uploadFile}
  />
{/if}
