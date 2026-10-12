function PhotoCard({ imageUrl, altText, caption, rotation = 0, className = '' }) {
  return (
    <div
      className={`group relative inline-block transition-transform duration-300 ease-out hover:z-30 hover:scale-105 hover:!rotate-0 ${className}`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <figure className="relative w-60 sm:w-68 md:w-72 max-w-full rounded-xs bg-gradient-to-b from-[#fffefc] via-[#faf7f0] to-[#f4eee2] p-3 pb-6 shadow-[0_14px_32px_-6px_rgba(0,0,0,0.24),0_6px_12px_-2px_rgba(0,0,0,0.1)] border border-stone-200/80">
        {/* Washi Tape at top center */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-3.5 left-1/2 -translate-x-1/2 w-20 sm:w-24 h-6 sm:h-7 -rotate-1 rounded-[1px] bg-amber-100/75 border-y border-amber-300/50 backdrop-blur-[1px] shadow-xs z-20"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(160, 130, 90, 0.12) 0, rgba(160, 130, 90, 0.12) 2px, transparent 0, transparent 6px)',
          }}
        />

        {/* Photo Container with glossy inset highlight */}
        <div className="relative aspect-square w-full overflow-hidden rounded-[1px] bg-stone-200">
          <img
            src={imageUrl}
            alt={altText || caption || 'Scrapbook photo'}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
          {/* Subtle white inset shadow & highlight sheen simulating glossy photo paper */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 shadow-[inset_0_0_15px_rgba(255,255,255,0.7)] ring-1 ring-black/5 bg-gradient-to-tr from-transparent via-white/10 to-white/25"
          />
        </div>

        {/* Polaroid bottom caption */}
        {caption && (
          <figcaption className="mt-3.5 text-center font-handwriting text-2xl text-stone-700 font-medium tracking-wide">
            {caption}
          </figcaption>
        )}
      </figure>
    </div>
  );
}

export default PhotoCard;

