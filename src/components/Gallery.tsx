import { useState } from 'react'
import type { PhotoId } from '../domain/listing'
import { PhotoPlaceholder } from './PhotoPlaceholder'

/** Swipeable gallery (scroll-snap) with a position indicator. */
export function Gallery({ photos }: { photos: PhotoId[] }) {
  const [index, setIndex] = useState(0)
  const list: PhotoId[] = photos.length ? photos : ['fachada']

  return (
    <div className="relative">
      <div
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
        onScroll={(e) => {
          const el = e.currentTarget
          setIndex(Math.round(el.scrollLeft / el.clientWidth))
        }}
      >
        {list.map((p, i) => (
          <PhotoPlaceholder key={`${p}-${i}`} photo={p} iconSize={64} className="h-56 w-full shrink-0 snap-center" />
        ))}
      </div>
      {list.length > 1 && (
        <>
          <span className="absolute top-3 right-3 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
            {index + 1} / {list.length}
          </span>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5" aria-hidden>
            {list.map((_, i) => (
              <span key={i} className={`size-2 rounded-full ${i === index ? 'bg-white' : 'bg-white/50'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
