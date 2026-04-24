import { z } from 'zod';
import { IdSchema } from '../shared/primitives.js';
import type { UploadQuestion } from '../questions/upload.js';
import type { UploadAnswer } from '../answers/upload.js';
import type { Grader } from './types.js';

/**
 * Upload не поддаётся полноценному авто-грейдингу: содержимое файла
 * обычно проверяет человек. Ключ задаёт только формальные требования
 * (минимальное число файлов). Результат маркируется флагом
 * `needsManualReview: true`.
 */
export const UploadKeySchema = z.object({
  _kind: z.literal('upload'),
  questionId: IdSchema,
  requiredCount: z.number().int().min(0).default(1),
});
export type UploadKey = z.infer<typeof UploadKeySchema>;

export const gradeUpload: Grader<UploadQuestion, UploadAnswer, UploadKey> =
  ({ answer, key }) => {
    const meetsCount = answer.files.length >= key.requiredCount;
    return {
      questionId: answer.questionId,
      correct: meetsCount,
      score: meetsCount ? 1 : 0,
      details: {
        needsManualReview: true,
        submittedCount: answer.files.length,
        requiredCount: key.requiredCount,
      },
    };
  };
