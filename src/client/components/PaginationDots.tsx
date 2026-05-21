interface PaginationDotsProps {
  total: number
  current: number
}

export function PaginationDots({ total, current }: PaginationDotsProps) {
  return (
    <>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`size-2 rounded-full ${
            i === current
              ? 'bg-[#0d0d0d]'
              : 'border border-[rgba(0,0,0,0.1)] bg-transparent'
          }`}
        />
      ))}
    </>
  )
}
