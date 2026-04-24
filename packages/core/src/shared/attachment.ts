import { z } from 'zod';
import { IdSchema } from './primitives.js';

export const FileAttachmentSchema = z.object({
  id: IdSchema,
  type: z.enum(['video', 'audio', 'image', 'file']),
  url: z.string().url(),
  alt: z.string().optional(),
});
export type FileAttachment = z.infer<typeof FileAttachmentSchema>;

export const CodeAttachmentSchema = z.object({
  id: IdSchema,
  type: z.literal('code'),
  language: z.string(),
  code: z.string(),
});
export type CodeAttachment = z.infer<typeof CodeAttachmentSchema>;

export const AttachmentSchema = z.discriminatedUnion('type', [
  FileAttachmentSchema,
  CodeAttachmentSchema,
]);
export type Attachment = z.infer<typeof AttachmentSchema>;
