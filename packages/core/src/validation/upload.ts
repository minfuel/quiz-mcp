import { z } from 'zod';
import { UploadAnswerSchema } from '../answers/upload.js';
import type { UploadQuestion } from '../questions/upload.js';
import type { FileKind } from '../questions/upload.js';
import { raiseIssue } from './issue.js';

function matchesFileKind(mimeType: string, kind: FileKind): boolean {
  switch (kind) {
    case 'any':
      return true;
    case 'image':
      return mimeType.startsWith('image/');
    case 'video':
      return mimeType.startsWith('video/');
    case 'audio':
      return mimeType.startsWith('audio/');
    case 'pdf':
      return mimeType === 'application/pdf';
    case 'csv':
      return mimeType === 'text/csv' || mimeType === 'application/csv';
    case 'docx':
      return mimeType.includes('wordprocessingml');
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

export function buildUploadAnswerSchema(q: UploadQuestion) {
  return UploadAnswerSchema.extend({
    questionId: z.literal(q.id),
  }).superRefine((ans, ctx) => {
    const files = ans.files;

    if (q.required && files.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: raiseIssue('upload_missing'),
        path: ['files'],
      });
    }
    if (q.maxFiles != null && files.length > q.maxFiles) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: raiseIssue('max_files', { max: q.maxFiles }),
        path: ['files'],
      });
    }

    files.forEach((f, i) => {
      if (q.maxSizeBytes != null && f.sizeBytes > q.maxSizeBytes) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: raiseIssue('file_too_large', { max: q.maxSizeBytes }),
          path: ['files', i, 'sizeBytes'],
        });
      }
      if (!q.accept.some((k) => matchesFileKind(f.mimeType, k))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: raiseIssue('invalid_file_type', { mimeType: f.mimeType }),
          path: ['files', i, 'mimeType'],
        });
      }
    });
  });
}
