export type Lang = 'vi' | 'en'

const vi = {
  // Nav
  navHome: 'Trang chủ',
  navHistory: 'Lịch sử',
  navBookmarks: 'Bookmark',
  navSettings: 'Cài đặt',
  // Home
  homeSubtitle: 'Chụp ảnh bài toán, nhận lời giải từng bước',
  homeCapture: 'Chụp ảnh',
  homeUpload: 'Tải lên',
  homeManual: 'Nhập LaTeX',
  homeToastFileTooLarge: 'Ảnh không được vượt quá 2MB.',
  // History
  historyTitle: 'Lịch sử',
  historyEmpty: 'Chưa có bài giải nào',
  historyEmptyCta: 'Chụp bài toán đầu tiên →',
  historyAriaDelete: 'Xóa',
  historyAriaSave: 'Lưu',
  historyAriaUnsave: 'Bỏ lưu',
  historyToastDeleteError: 'Không thể xóa bài toán. Vui lòng thử lại.',
  // Bookmarks
  bookmarksTitle: 'Bookmark',
  bookmarksEmpty: 'Chưa có bài nào được lưu',
  bookmarksAriaUnsave: 'Bỏ lưu',
  // History detail
  detailTitle: 'Lời giải',
  detailAriaBack: 'Quay lại',
  detailAriaBookmark: 'Đánh dấu',
  detailNewProblem: 'Bài mới',
  // Manual input
  manualTitle: 'Nhập công thức',
  manualAriaBack: 'Quay lại',
  manualPreviewPlaceholder: 'Bắt đầu nhập để xem preview',
  manualInputPlaceholder: 'Nhập công thức LaTeX...',
  manualSubmit: 'Xác nhận',
  // OCR
  ocrLoading: 'Đang nhận dạng công thức...',
  ocrErrorNoFormula: 'Không nhận diện được công thức trong ảnh.',
  ocrErrorTimeout: 'Nhận dạng quá lâu, vui lòng thử lại hoặc nhập thủ công.',
  ocrErrorGeneric: 'Có lỗi xảy ra. Vui lòng thử lại.',
  ocrRetry: 'Thử lại',
  ocrManual: 'Nhập thủ công',
  ocrRecapture: 'Chụp lại',
  ocrImageAlt: 'Ảnh đã chụp',
  ocrCheckFormula: 'Kiểm tra công thức đã chính xác chưa?',
  ocrLowConfidence: 'Độ chính xác thấp — kiểm tra lại',
  ocrSolve: 'Giải bài này',
  // Camera
  cameraAriaShutter: 'Chụp ảnh',
  cameraAriaFlip: 'Xoay camera',
  // Crop
  cropCancel: 'Hủy',
  cropConfirm: 'Xác nhận',
  // Settings
  settingsTitle: 'Cài đặt',
  settingsLangLabel: 'Ngôn ngữ',
  settingsAriaLangToggle: 'Ngôn ngữ',
  settingsInfoSection: 'Thông tin',
  settingsVersion: 'Phiên bản',
  settingsReplayOnboarding: 'Xem lại hướng dẫn',
  settingsContactSupport: 'Liên hệ hỗ trợ',
  settingsTerms: 'Điều khoản sử dụng',
  // Step card
  stepAnswer: 'Đáp án',
  stepLabel: 'Bước',
  // Solve
  solveLoading: 'Đang phân tích bài toán',
  solveErrorGeneric: 'Không thể tạo lời giải. Vui lòng thử lại.',
  solveOtherProblem: 'Nhập bài toán khác',
  solveRetry: 'Thử lại',
  solveTitle: 'Lời giải',
  solveAriaBack: 'Quay lại',
  solveAriaBookmark: 'Đánh dấu',
  solveNewProblem: 'Bài mới',
  solveToastError: 'Không thể tạo lời giải.',
  // Onboarding
  onboardingSkip: 'Bỏ qua',
  onboardingNext: 'Tiếp',
  onboardingStart: 'Bắt đầu',
  onboardingStep1Title: 'Chụp ảnh bài toán',
  onboardingStep1Desc: 'Chụp hoặc tải ảnh bài toán toán học bất kỳ — phương trình, hệ phương trình, hay tích phân.',
  onboardingStep2Title: 'Nhận diện công thức',
  onboardingStep2Desc: 'AI tự động đọc và nhận diện công thức từ ảnh của bạn với độ chính xác cao.',
  onboardingStep3Title: 'Xem lời giải từng bước',
  onboardingStep3Desc: 'Nhận lời giải chi tiết từng bước, kèm công thức và giải thích rõ ràng.',
}

// typeof vi enforces that `en` has exactly the same keys — TypeScript errors on any missing key
const en: typeof vi = {
  // Nav
  navHome: 'Home',
  navHistory: 'History',
  navBookmarks: 'Bookmarks',
  navSettings: 'Settings',
  // Home
  homeSubtitle: 'Snap a problem, get step-by-step solutions',
  homeCapture: 'Take Photo',
  homeUpload: 'Upload',
  homeManual: 'Enter LaTeX',
  homeToastFileTooLarge: 'Image must not exceed 2MB.',
  // History
  historyTitle: 'History',
  historyEmpty: 'No solutions yet',
  historyEmptyCta: 'Snap your first problem →',
  historyAriaDelete: 'Delete',
  historyAriaSave: 'Save',
  historyAriaUnsave: 'Unsave',
  historyToastDeleteError: 'Failed to delete. Please try again.',
  // Bookmarks
  bookmarksTitle: 'Bookmarks',
  bookmarksEmpty: 'No bookmarks yet',
  bookmarksAriaUnsave: 'Remove bookmark',
  // History detail
  detailTitle: 'Solution',
  detailAriaBack: 'Go back',
  detailAriaBookmark: 'Bookmark',
  detailNewProblem: 'New problem',
  // Manual input
  manualTitle: 'Enter Formula',
  manualAriaBack: 'Go back',
  manualPreviewPlaceholder: 'Start typing to see preview',
  manualInputPlaceholder: 'Enter LaTeX formula...',
  manualSubmit: 'Confirm',
  // OCR
  ocrLoading: 'Recognising formula...',
  ocrErrorNoFormula: 'No formula detected in the image.',
  ocrErrorTimeout: 'Recognition timed out. Please retry or enter manually.',
  ocrErrorGeneric: 'An error occurred. Please try again.',
  ocrRetry: 'Retry',
  ocrManual: 'Enter manually',
  ocrRecapture: 'Retake',
  ocrImageAlt: 'Captured image',
  ocrCheckFormula: 'Is the formula correct?',
  ocrLowConfidence: 'Low confidence — please verify',
  ocrSolve: 'Solve this',
  // Camera
  cameraAriaShutter: 'Take photo',
  cameraAriaFlip: 'Flip camera',
  // Crop
  cropCancel: 'Cancel',
  cropConfirm: 'Confirm',
  // Settings
  settingsTitle: 'Settings',
  settingsLangLabel: 'Language',
  settingsAriaLangToggle: 'Language',
  settingsInfoSection: 'Information',
  settingsVersion: 'Version',
  settingsReplayOnboarding: 'View tutorial',
  settingsContactSupport: 'Contact support',
  settingsTerms: 'Terms of use',
  // Step card
  stepAnswer: 'Answer',
  stepLabel: 'Step',
  // Solve
  solveLoading: 'Analysing problem',
  solveErrorGeneric: 'Unable to generate solution. Please try again.',
  solveOtherProblem: 'Try another problem',
  solveRetry: 'Retry',
  solveTitle: 'Solution',
  solveAriaBack: 'Go back',
  solveAriaBookmark: 'Bookmark',
  solveNewProblem: 'New problem',
  solveToastError: 'Unable to generate solution.',
  // Onboarding
  onboardingSkip: 'Skip',
  onboardingNext: 'Next',
  onboardingStart: 'Get started',
  onboardingStep1Title: 'Snap a Problem',
  onboardingStep1Desc: 'Take or upload a photo of any math problem — equations, systems, or integrals.',
  onboardingStep2Title: 'Recognise the Formula',
  onboardingStep2Desc: 'AI automatically reads and recognises the formula from your photo with high accuracy.',
  onboardingStep3Title: 'Step-by-Step Solution',
  onboardingStep3Desc: 'Get a detailed step-by-step solution with formulas and clear explanations.',
}

export const t = { vi, en }
