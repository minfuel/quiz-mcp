import type { Quiz } from '@quiz-mcp/core';

export const MOCK_QUIZ: Quiz = {
  id: 'mock-quiz-1',
  title: 'Mock runner smoke quiz',
  description: 'Lorem ipsum dolor sit amet',
  questions: [
    {
      _kind: 'single_choice',
      id: 'q-sc-1',
      title: 'Favorite beverage',
      text: 'Pick your favorite beverage.',
      required: true,
      score: 1,
      mode: 'list',
      options: [
        { id: 'opt-tea', label: 'Tea' },
        { id: 'opt-coffee', label: 'Coffee' },
        { id: 'opt-water', label: 'Water' },
      ],
    },
    {
      _kind: 'short_text',
      id: 'q-st-1',
      title: 'Your name',
      text: 'What is your name?',
      required: true,
      score: 1,
      placeholder: 'Type your name',
      maxLength: 40,
    },
    {
      _kind: 'multiple_choice',
      id: 'q-mc-1',
      title: 'Work languages',
      text: 'Which languages do you use at work?',
      required: false,
      score: 1,
      mode: 'list',
      options: [
        { id: 'opt-ts', label: 'TypeScript' },
        { id: 'opt-go', label: 'Go' },
        { id: 'opt-py', label: 'Python' },
        { id: 'opt-rs', label: 'Rust' },
      ],
    },
  ],
};
