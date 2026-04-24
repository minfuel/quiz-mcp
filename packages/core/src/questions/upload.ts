import { z } from 'zod';
import { BaseQuestionFields } from './_base.js';

export const FileKindSchema = z.enum([
  'image',
  'video',
  'audio',
  'pdf',
  'docx',
  'csv',
  'any',
]);
export type FileKind = z.infer<typeof FileKindSchema>;

export const UploadQuestionSchema = z.object({
  _kind: z.literal('upload'),
  ...BaseQuestionFields,
  accept: z.array(FileKindSchema).min(1),
  maxFiles: z.number().int().min(1).optional(),
  maxSizeBytes: z.number().int().min(1).optional(),
});
export type UploadQuestion = z.infer<typeof UploadQuestionSchema>;
