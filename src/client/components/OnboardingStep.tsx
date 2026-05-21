import type { ReactNode } from 'react'

interface OnboardingStepProps {
  title: string
  description: string
  illustration: ReactNode
}

export function OnboardingStep({ title, description, illustration }: OnboardingStepProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex size-[120px] items-center justify-center rounded-full bg-[#d4fae8]">
        {illustration}
      </div>
      <div className="flex flex-col gap-3">
        <h2 id="onboarding-title" className="text-[36px] font-semibold leading-tight tracking-[-0.72px] text-[#0d0d0d]">
          {title}
        </h2>
        <p className="text-[16px] leading-relaxed text-[#666666]">
          {description}
        </p>
      </div>
    </div>
  )
}
