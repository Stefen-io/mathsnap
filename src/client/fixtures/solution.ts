import type { SolutionStep } from '@/types/history'

export const MOCK_SOLUTION_STEPS: SolutionStep[] = [
  {
    index: 1,
    title: 'Chuyển vế',
    explanation: 'Chuyển +3 sang vế phải, đổi dấu thành -3',
    formula: '2x = 7 - 3',
    isAnswer: false,
  },
  {
    index: 2,
    title: 'Rút gọn',
    explanation: 'Không cần trung gian — tính trực tiếp',
    formula: undefined,
    isAnswer: false,
  },
  {
    index: 3,
    title: 'Kết quả',
    explanation: 'Chia cả hai vế cho 2',
    formula: 'x = 2',
    isAnswer: true,
  },
]
