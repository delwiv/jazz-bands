interface ProgressBarProps {
  progress: number
  visible: boolean
  className?: string
  barClassName?: string
}

export function ProgressBar({
  progress,
  visible,
  className = '',
  barClassName = '',
}: ProgressBarProps) {
  if (!visible) return null

  return (
    <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-white/10 ${className}`}>
      <div
        className={`h-full bg-white/80 transition-all duration-100 ease-linear ${barClassName}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
