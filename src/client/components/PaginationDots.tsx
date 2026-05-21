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
          className={
            i === current
              ? 'size-2 rounded-full bg-[#0d0d0d]'
              : 'size-2 rounded-full border border-[rgba(0,0,0,0.1)] bg-transparent'
          }
        />
      ))}
    </>
  )
}
