import type { GalleryImage } from '~/lib/types'

interface ThumbnailGridProps {
  images: GalleryImage[]
  onClick?: (index: number) => void
  className?: string
  itemClassName?: string
}

export function ThumbnailGrid({
  images,
  onClick,
  className = '',
  itemClassName = '',
}: ThumbnailGridProps) {
  if (!images.length) return null

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}
    >
      {images.map((image, index) => (
        <div
          key={`thumb-${image.src}`}
          className={`relative overflow-hidden bg-slate-800/50 group focus-ring ${itemClassName}`}
          onClick={() => onClick?.(index)}
          role={onClick ? 'button' : undefined}
          tabIndex={onClick ? 0 : undefined}
          style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
          <div className="aspect-square">
            <img
              src={image.src}
              alt={image.alt}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          {onClick && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="glass-card px-4 py-2 rounded-full border border-white/20 text-white text-sm">
                View full size
              </span>
            </div>
          )}

          {image.caption && !onClick && (
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
              <p className="text-white text-sm">{image.caption}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
