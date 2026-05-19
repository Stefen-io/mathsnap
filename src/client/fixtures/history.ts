import type { HistoryItem } from '@/types/history';

export const MOCK_HISTORY: HistoryItem[] = [
  {
    id: 'a1b2c3d4-e5f6-4abc-8def-000000000001',
    deviceId: '00000000-0000-4000-8000-000000000001',
    latex: '2x + 3 = 7',
    language: 'vi',
    createdAt: '2026-05-01T08:00:00.000Z',
    isBookmarked: true,
    solutionSteps: [
      { index: 1, title: 'Chuyển vế', explanation: 'Chuyển +3 sang vế phải, đổi dấu thành -3', formula: '2x = 7 - 3', isAnswer: false },
      { index: 2, title: 'Rút gọn', explanation: 'Tính 7 - 3 = 4', formula: '2x = 4', isAnswer: false },
      { index: 3, title: 'Kết quả', explanation: 'Chia cả hai vế cho 2', formula: 'x = 2', isAnswer: true },
    ],
  },
  {
    id: 'a1b2c3d4-e5f6-4abc-8def-000000000002',
    deviceId: '00000000-0000-4000-8000-000000000001',
    latex: 'x^2 - 5x + 6 = 0',
    language: 'vi',
    createdAt: '2026-05-02T09:30:00.000Z',
    isBookmarked: false,
    solutionSteps: [
      { index: 1, title: 'Nhận dạng', explanation: 'Đây là phương trình bậc 2 dạng ax² + bx + c = 0 với a=1, b=-5, c=6', formula: undefined, isAnswer: false },
      { index: 2, title: 'Tính delta', explanation: 'Δ = b² - 4ac = 25 - 24 = 1', formula: '\\Delta = 1', isAnswer: false },
      { index: 3, title: 'Nghiệm 1', explanation: 'x₁ = (-b + √Δ) / 2a = (5 + 1) / 2 = 3', formula: 'x_1 = 3', isAnswer: false },
      { index: 4, title: 'Nghiệm 2', explanation: 'x₂ = (-b - √Δ) / 2a = (5 - 1) / 2 = 2', formula: 'x_2 = 2', isAnswer: false },
      { index: 5, title: 'Kết luận', explanation: 'Phương trình có hai nghiệm phân biệt', formula: 'x_1 = 3, x_2 = 2', isAnswer: true },
    ],
  },
  {
    id: 'a1b2c3d4-e5f6-4abc-8def-000000000003',
    deviceId: '00000000-0000-4000-8000-000000000001',
    latex: '\\int_0^1 x^2 \\, dx',
    language: 'vi',
    createdAt: '2026-05-03T14:00:00.000Z',
    isBookmarked: false,
    solutionSteps: [
      { index: 1, title: 'Tích phân bất định', explanation: 'Áp dụng công thức ∫xⁿ dx = xⁿ⁺¹/(n+1)', formula: '\\frac{x^3}{3}', isAnswer: false },
      { index: 2, title: 'Kết quả', explanation: 'Tính tại cận trên và cận dưới: F(1) - F(0) = 1/3 - 0', formula: '\\frac{1}{3}', isAnswer: true },
    ],
  },
  {
    id: 'a1b2c3d4-e5f6-4abc-8def-000000000004',
    deviceId: '00000000-0000-4000-8000-000000000001',
    latex: '3x - 2 = 10',
    language: 'en',
    createdAt: '2026-05-04T11:00:00.000Z',
    isBookmarked: false,
    solutionSteps: [
      { index: 1, title: 'Add 2 to both sides', explanation: 'Adding 2 to both sides isolates the term with x', formula: '3x = 12', isAnswer: false },
      { index: 2, title: 'Divide both sides by 3', explanation: 'Dividing both sides by 3 gives us the value of x', formula: 'x = 4', isAnswer: true },
    ],
  },
  {
    id: 'a1b2c3d4-e5f6-4abc-8def-000000000005',
    deviceId: '00000000-0000-4000-8000-000000000001',
    latex: '\\frac{d}{dx}(x^3)',
    language: 'vi',
    createdAt: '2026-05-05T16:45:00.000Z',
    isBookmarked: false,
    solutionSteps: [
      { index: 1, title: 'Quy tắc lũy thừa', explanation: 'Áp dụng d/dx(xⁿ) = n·xⁿ⁻¹ với n = 3', formula: undefined, isAnswer: false },
      { index: 2, title: 'Kết quả', explanation: 'Đạo hàm của x³ là 3x²', formula: '3x^2', isAnswer: true },
    ],
  },
];
