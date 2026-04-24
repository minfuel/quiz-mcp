import { z } from 'zod';
import { IdSchema } from '../shared/primitives.js';

export const UploadedFileSchema = z.object({
  url: z.string().url(),
  name: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().min(0),
});
export type UploadedFile = z.infer<typeof UploadedFileSchema>;

export const UploadAnswerSchema = z.object({
  _kind: z.literal('upload'),
  questionId: IdSchema,
  files: z.array(UploadedFileSchema),
});
export type UploadAnswer = z.infer<typeof UploadAnswerSchema>;
