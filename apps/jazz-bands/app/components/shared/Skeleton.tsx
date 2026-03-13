const skeletonVariants = {
  text: 'animate-pulse rounded-md bg-gray-200 dark:bg-gray-700 h-4 w-full',
  circle: 'animate-pulse rounded-full bg-gray-200 dark:bg-gray-700 h-12 w-12',
  rect: 'animate-pulse rounded-md bg-gray-200 dark:bg-gray-700 h-16 w-full',
} as const

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circle' | 'rect'
}

export function Skeleton({
  className,
  variant = 'text',
  ...props
}: SkeletonProps) {
  return (
    <div
      className={`${skeletonVariants[variant]} ${className || ''}`}
      {...props}
    />
  )
}
