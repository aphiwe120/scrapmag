import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Play, Pause } from 'lucide-react';
import PhotoCard from './components/PhotoCard';
import { SCRAPBOOK_DATA } from './data/scrapbookData';

// Replicating the exact cubic-bezier curve and 0.8s timing from the original scrapbook-style.css
const CUBIC_BEZIER = [0.68, -0.55, 0.265, 1.55];
const DURATION = 0.8;
const AUTO_FLIP_DELAY = 4000;

// Quick-jump sections: the cover, 2025, and each month of 2026
const JUMP_SECTIONS = (() => {
  const sections = [{ label: 'Cover', spread: 0 }];
  const seen = new Set();
  SCRAPBOOK_DATA.forEach((page, i) => {
    if (i === 0) return;
    const label = page.date ? page.date.split(' – ')[0].replace(/ \d+,/, '') : null;
    if (!label || seen.has(label)) return;
    seen.add(label);
    sections.push({ label, spread: Math.floor((i + 1) / 2) });
  });
  return sections;
})();

const FLIP_TRANSITION = {
  duration: DURATION,
  ease: CUBIC_BEZIER,
};

const FADE_TRANSITION = {
  duration: DURATION,
  ease: 'easeInOut',
};

const leftPageVariants = {
  initial: (custom) => {
    const { direction, isCover } =
      typeof custom === 'object' && custom !== null
        ? custom
        : { direction: custom || 0, isCover: false };

    if (direction === 0) {
      return { rotateY: 0, z: 0, opacity: 1 };
    }

    if (isCover) {
      return {
        rotateY: direction < 0 ? -180 : 0,
        z: direction < 0 ? -100 : 0,
        opacity: direction < 0 ? 0.3 : 1,
      };
    }

    return {
      rotateY: 0,
      z: 0,
      opacity: 1,
    };
  },
  animate: {
    rotateY: 0,
    z: 0,
    opacity: 1,
    transition: FLIP_TRANSITION,
  },
  exit: (custom) => {
    const { direction, isCover } =
      typeof custom === 'object' && custom !== null
        ? custom
        : { direction: custom || 0, isCover: false };

    if (isCover && direction > 0) {
      // Opening cover: flips open along the left edge
      return {
        rotateY: -180,
        z: -100,
        opacity: 0.3,
        zIndex: 30,
        transition: FLIP_TRANSITION,
      };
    }

    if (direction < 0) {
      // Flipping backward: left page turns backward over the spine to the right
      return {
        rotateY: 180,
        z: -100,
        opacity: 0.3,
        zIndex: 30,
        transition: FLIP_TRANSITION,
      };
    }

    // Forward turn: left page stays under and gently fades
    return {
      rotateY: 0,
      z: -50,
      opacity: 0,
      zIndex: 10,
      transition: FADE_TRANSITION,
    };
  },
};

const rightPageVariants = {
  initial: (custom) => {
    const { direction } =
      typeof custom === 'object' && custom !== null
        ? custom
        : { direction: custom || 0 };

    if (direction === 0) {
      return { rotateY: 0, z: 0, opacity: 1 };
    }

    return {
      rotateY: 0,
      z: 0,
      opacity: 1,
    };
  },
  animate: {
    rotateY: 0,
    z: 0,
    opacity: 1,
    transition: FLIP_TRANSITION,
  },
  exit: (custom) => {
    const { direction } =
      typeof custom === 'object' && custom !== null
        ? custom
        : { direction: custom || 0 };

    if (direction > 0) {
      // Flipping forward: right page turns forward over the spine to the left
      return {
        rotateY: -180,
        z: -100,
        opacity: 0.3,
        zIndex: 30,
        transition: FLIP_TRANSITION,
      };
    }

    // Backward turn: right page stays under and gently fades
    return {
      rotateY: 0,
      z: -50,
      opacity: 0,
      zIndex: 10,
      transition: FADE_TRANSITION,
    };
  },
};

// SCRAPBOOK_DATA is imported from ./data/scrapbookData.js (163 pages)
export { SCRAPBOOK_DATA };

// Natural polaroid rotation: left page tilts left (-3.5deg to -1.5deg), right page tilts right (+1.5deg to +3.5deg)
const getPolaroidRotation = (pageId = 1, isRightSide = false) => {
  const seed = ((pageId * 7 + (isRightSide ? 13 : 5)) % 11) / 10;
  const angle = 1.5 + seed * 2.0;
  return Number((isRightSide ? angle : -angle).toFixed(1));
};

export default function DigitalScrapbook() {
  const [{ index: currentIndex, direction }, setNavigation] = useState({
    index: 0,
    direction: 0,
  });
  const [photoIndices, setPhotoIndices] = useState({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const touchStartX = useRef(null);

  const togglePhoto = (pageId, count) => {
    if (!count || count <= 1) return;
    setPhotoIndices((prev) => ({
      ...prev,
      [pageId]: ((prev[pageId] || 0) + 1) % count,
    }));
  };

  const lastPageIndex = SCRAPBOOK_DATA.length - 1;
  const totalPages = Math.max(
    ...SCRAPBOOK_DATA.map((page) => page.pageNum ?? page.id),
  );

  // Group pages into left/right spreads for desktop view
  const getVisiblePages = () => {
    if (currentIndex === 0) return [SCRAPBOOK_DATA[0], null]; // Cover
    
    // Calculate the left and right page indices based on spread logic
    const leftIndex = currentIndex;
    const rightIndex = currentIndex + 1;
    
    return [
      SCRAPBOOK_DATA[leftIndex] || null,
      SCRAPBOOK_DATA[rightIndex] || null
    ];
  };

  const [leftPage, rightPage] = getVisiblePages();
  const currentPageNumber = leftPage?.pageNum ?? leftPage?.id ?? 1;
  const isFirstPage = currentIndex === 0;
  const isLastPage = currentIndex >= SCRAPBOOK_DATA.length - 2;
  const autoPlayActive = isAutoPlaying && !isLastPage;

  const leftActiveIndex = leftPage ? (photoIndices[leftPage.id] || 0) : 0;
  const leftPhoto = leftPage?.photos
    ? leftPage.photos[leftActiveIndex % leftPage.photos.length]
    : leftPage?.photo;

  const rightActiveIndex = rightPage ? (photoIndices[rightPage.id] || 0) : 0;
  const rightPhoto = rightPage?.photos
    ? rightPage.photos[rightActiveIndex % rightPage.photos.length]
    : rightPage?.photo;

  const handleNext = useCallback(() => {
    if (isLastPage || isAnimating) return;
    setIsAnimating(true);
    setNavigation(({ index }) => ({
      index: Math.min(index === 0 ? 1 : index + 2, lastPageIndex),
      direction: 1,
    }));
    setTimeout(() => setIsAnimating(false), 800);
  }, [isLastPage, isAnimating, lastPageIndex]);

  const handlePrev = useCallback(() => {
    if (isFirstPage || isAnimating) return;
    setIsAnimating(true);
    setNavigation(({ index }) => ({
      index: index === 1 ? 0 : Math.max(index - 2, 0),
      direction: -1,
    }));
    setTimeout(() => setIsAnimating(false), 800);
  }, [isFirstPage, isAnimating]);

  const goToSpread = useCallback((spread) => {
    const maxSpread = Math.floor((SCRAPBOOK_DATA.length - 1) / 2);
    const s = Math.max(0, Math.min(maxSpread, spread));
    const target = s === 0 ? 0 : 2 * s - 1;
    if (target === currentIndex) return;
    setIsAnimating(true);
    setNavigation({ index: target, direction: target > currentIndex ? 1 : -1 });
    setTimeout(() => setIsAnimating(false), 800);
  }, [currentIndex]);

  const currentSpread = currentIndex === 0 ? 0 : (currentIndex + 1) / 2;
  const maxSpread = Math.floor((SCRAPBOOK_DATA.length - 1) / 2);

  // Auto flip: advance every few seconds, stop at the last spread
  useEffect(() => {
    if (!isAutoPlaying || isLastPage) return undefined;
    const timer = setTimeout(handleNext, AUTO_FLIP_DELAY);
    return () => clearTimeout(timer);
  }, [isAutoPlaying, isLastPage, currentIndex, handleNext]);

  // Keyboard navigation from original scrapbook.js (ArrowLeft and ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target instanceof HTMLElement && e.target.matches('input, select')) return;
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'PageDown') {
        goToSpread(currentSpread + 10);
      } else if (e.key === 'PageUp') {
        goToSpread(currentSpread - 10);
      } else if (e.key === 'Home') {
        goToSpread(0);
      } else if (e.key === 'End') {
        goToSpread(maxSpread);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, goToSpread, currentSpread, maxSpread]);

  // Touch swipe handlers from original scrapbook.js
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
  };

  return (
    <main className="isolate relative flex min-h-screen items-center justify-center p-4 pb-28 selection:bg-indigo-200">
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://res.cloudinary.com/fnuqpqaf/image/upload/v1791836832/scrapbook/IMG-20250925-WA0138.jpg')",
          backgroundAttachment: 'fixed',
        }}
      />
      <div aria-hidden="true" className="fixed inset-0 z-0 bg-black/20" />

      {/* Book Container with perspective: 1200px matching original CSS */}
      <div
        className="relative z-10 h-[85vh] max-h-[700px] w-[90vw] max-w-[1200px]"
        style={{ perspective: '1200px' }}
      >
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative flex h-full w-full overflow-hidden rounded-sm border border-white/20 bg-white/50 shadow-2xl backdrop-blur-md"
          style={{
            transformStyle: 'preserve-3d',
            boxShadow:
              '0 20px 60px rgba(0, 0, 0, 0.4), inset -2px 0 5px rgba(0, 0, 0, 0.1)',
          }}
        >
          <AnimatePresence initial={false} custom={{ direction, isCover: leftPage?.type === 'cover' }}>
            {/* Left Page / Cover */}
            {leftPage && (
              <motion.div
                key={`left-${currentIndex}`}
                custom={{ direction, isCover: leftPage?.type === 'cover' }}
                variants={leftPageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className={`absolute inset-y-0 left-0 flex flex-col overflow-hidden ${
                  rightPage ? 'w-1/2 border-r border-amber-900/15' : 'w-full'
                }`}
                style={{
                  transformOrigin: leftPage?.type === 'cover' ? 'left center' : 'right center',
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                }}
              >
                {leftPage?.type === 'cover' ? (
                  <div className="page-content cover-page flex-1 flex flex-col items-center justify-center text-center p-8">
                    <h1 className="text-5xl md:text-7xl font-serif text-neutral-800 font-bold mb-4 drop-shadow-sm tracking-tight">
                      {leftPage.title}
                    </h1>
                    <p className="text-2xl font-serif italic text-neutral-600 mb-8">
                      {leftPage.subtitle}
                    </p>
                    <p className="text-xl font-serif tracking-[0.25em] text-neutral-400">
                      {leftPage.date}
                    </p>
                  </div>
                ) : leftPage?.type === 'chapter' ? (
                  <div className="page-content cover-page flex-1 flex flex-col items-center justify-center text-center p-8">
                    <span className="text-5xl sm:text-6xl mb-6 select-none">{leftPage.sticker}</span>
                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-neutral-800 mb-4 tracking-tight">
                      {leftPage.title}
                    </h2>
                    <p className="font-serif italic text-xl sm:text-2xl text-neutral-600 mb-8">
                      {leftPage.subtitle}
                    </p>
                    <p className="handwritten font-handwriting text-2xl sm:text-3xl md:text-4xl text-amber-950/90 -rotate-1 max-w-sm">
                      {leftPage.text}
                    </p>
                    <span className="absolute bottom-6 left-6 font-serif text-sm italic text-stone-400">
                      {leftPage.pageNum}
                    </span>
                  </div>
                ) : (
                  <div className="page-content flex-1 flex flex-col p-6 sm:p-8 overflow-y-auto justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-neutral-800 border-b-2 border-indigo-400/80 pb-1.5 tracking-tight">
                            {leftPage.title}
                          </h2>
                          {leftPage.date && (
                            <p className="font-serif italic text-xs sm:text-sm text-stone-500 mt-1">
                              {leftPage.date}
                            </p>
                          )}
                        </div>
                        <span className="text-3xl sm:text-4xl select-none filter drop-shadow-xs">
                          {leftPage.sticker}
                        </span>
                      </div>

                      {/* One Image Per Side (Left) */}
                      <div className="my-auto flex flex-col items-center justify-center py-2 sm:py-4">
                        {leftPhoto && (
                          <div
                            onClick={() => togglePhoto(leftPage.id, leftPage.photos?.length)}
                            className={leftPage.photos?.length > 1 ? 'cursor-pointer' : ''}
                            title={leftPage.photos?.length > 1 ? 'Click photo to toggle image' : undefined}
                          >
                            <PhotoCard
                              imageUrl={leftPhoto.url}
                              altText={leftPhoto.caption}
                              caption={leftPhoto.caption}
                              rotation={getPolaroidRotation(leftPage.id, false)}
                            />
                          </div>
                        )}
                        {leftPage.photos && leftPage.photos.length > 1 && (
                          <div className="mt-3 flex items-center justify-center gap-1.5">
                            {leftPage.photos.map((_, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPhotoIndices((prev) => ({ ...prev, [leftPage.id]: idx }));
                                }}
                                aria-label={`Show photo ${idx + 1}`}
                                className={`h-2 rounded-full transition-all ${
                                  idx === (leftActiveIndex % leftPage.photos.length)
                                    ? 'w-5 bg-amber-800/70'
                                    : 'w-2 bg-amber-800/25 hover:bg-amber-800/40'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="relative pt-3 pb-1">
                      <p className="handwritten font-handwriting text-2xl sm:text-3xl md:text-4xl text-amber-950/90 -rotate-2 text-center tracking-wide drop-shadow-xs">
                        {leftPage.text}
                      </p>
                      <span className="absolute bottom-0 left-0 font-serif text-sm italic text-stone-400">
                        {leftPage.pageNum}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Right Page */}
            {rightPage && (
              <motion.div
                key={`right-${currentIndex}`}
                custom={{ direction, isCover: false }}
                variants={rightPageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="absolute inset-y-0 right-0 w-1/2 flex flex-col overflow-hidden border-l border-amber-900/15"
                style={{
                  transformOrigin: 'left center',
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                }}
              >
                <div className="page-content flex-1 flex flex-col p-6 sm:p-8 overflow-y-auto justify-between">
                  {rightPage.type === 'end' ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                      <p className="handwritten font-handwriting text-5xl text-neutral-600 italic tracking-wide">
                        {rightPage.text}
                      </p>
                      <span className="absolute bottom-6 right-6 font-serif text-sm italic text-stone-400">
                        {rightPage.pageNum}
                      </span>
                    </div>
                  ) : rightPage.type === 'chapter' ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                      <span className="text-5xl sm:text-6xl mb-6 select-none">{rightPage.sticker}</span>
                      <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-neutral-800 mb-4 tracking-tight">
                        {rightPage.title}
                      </h2>
                      <p className="font-serif italic text-xl sm:text-2xl text-neutral-600 mb-8">
                        {rightPage.subtitle}
                      </p>
                      <p className="handwritten font-handwriting text-2xl sm:text-3xl md:text-4xl text-amber-950/90 -rotate-1 max-w-sm">
                        {rightPage.text}
                      </p>
                      <span className="absolute bottom-6 right-6 font-serif text-sm italic text-stone-400">
                        {rightPage.pageNum}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-neutral-800 border-b-2 border-indigo-400/80 pb-1.5 tracking-tight">
                              {rightPage.title}
                            </h2>
                            {rightPage.date && (
                              <p className="font-serif italic text-xs sm:text-sm text-stone-500 mt-1">
                                {rightPage.date}
                              </p>
                            )}
                          </div>
                          <span className="text-3xl sm:text-4xl select-none filter drop-shadow-xs">
                            {rightPage.sticker}
                          </span>
                        </div>

                        {/* One Image Per Side (Right) */}
                        <div className="my-auto flex flex-col items-center justify-center py-2 sm:py-4">
                          {rightPhoto && (
                            <div
                              onClick={() => togglePhoto(rightPage.id, rightPage.photos?.length)}
                              className={rightPage.photos?.length > 1 ? 'cursor-pointer' : ''}
                              title={rightPage.photos?.length > 1 ? 'Click photo to toggle image' : undefined}
                            >
                              <PhotoCard
                                imageUrl={rightPhoto.url}
                                altText={rightPhoto.caption}
                                caption={rightPhoto.caption}
                                rotation={getPolaroidRotation(rightPage.id, true)}
                              />
                            </div>
                          )}
                          {rightPage.photos && rightPage.photos.length > 1 && (
                            <div className="mt-3 flex items-center justify-center gap-1.5">
                              {rightPage.photos.map((_, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPhotoIndices((prev) => ({ ...prev, [rightPage.id]: idx }));
                                  }}
                                  aria-label={`Show photo ${idx + 1}`}
                                  className={`h-2 rounded-full transition-all ${
                                    idx === (rightActiveIndex % rightPage.photos.length)
                                      ? 'w-5 bg-amber-800/70'
                                      : 'w-2 bg-amber-800/25 hover:bg-amber-800/40'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="relative pt-3 pb-1">
                        <p className="handwritten font-handwriting text-2xl sm:text-3xl md:text-4xl text-amber-950/90 rotate-1 text-center tracking-wide drop-shadow-xs">
                          {rightPage.text}
                        </p>
                        <span className="absolute bottom-0 right-0 font-serif text-sm italic text-stone-400">
                          {rightPage.pageNum}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Glassmorphic Pill Navigation */}
      <nav
        aria-label="Scrapbook page navigation"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      >
        <div className="pointer-events-auto flex items-center justify-between gap-6 sm:gap-8 rounded-full border border-white/30 bg-white/20 px-6 py-2.5 shadow-2xl backdrop-blur-xl transition-all duration-300">
          <button
            type="button"
            onClick={handlePrev}
            disabled={isFirstPage || isAnimating}
            aria-label="Previous page"
            className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-sm transition-all duration-200 hover:scale-105 hover:bg-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:pointer-events-none disabled:opacity-35"
          >
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
          </button>

          <div className="flex items-center gap-3">
            <select
              aria-label="Jump to section"
              value=""
              onChange={(e) => goToSpread(Number(e.target.value))}
              className="hidden sm:block rounded-full border border-white/20 bg-black/20 px-2 py-1 text-xs text-white focus:outline-none"
            >
              <option value="" disabled>Jump to…</option>
              {JUMP_SECTIONS.map((s) => (
                <option key={s.label} value={s.spread} className="text-black">{s.label}</option>
              ))}
            </select>
            <input
              type="range"
              aria-label="Scrub through pages"
              min={0}
              max={maxSpread}
              value={currentSpread}
              onChange={(e) => goToSpread(Number(e.target.value))}
              className="hidden sm:block w-32 md:w-56 lg:w-80 accent-white"
            />
            <span
              aria-live="polite"
              className="font-serif text-sm sm:text-base tracking-wider text-white select-none drop-shadow-sm font-medium"
            >
              Page <span className="font-bold text-white">{currentPageNumber}</span> of{' '}
              <span className="text-white/80">{totalPages}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={isLastPage || isAnimating}
            aria-label="Next page"
            className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-sm transition-all duration-200 hover:scale-105 hover:bg-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:pointer-events-none disabled:opacity-35"
          >
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsAutoPlaying((p) => !p)}
            disabled={isLastPage}
            aria-label={autoPlayActive ? 'Pause auto flip' : 'Start auto flip'}
            aria-pressed={autoPlayActive}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-sm transition-all duration-200 hover:scale-105 hover:bg-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:pointer-events-none disabled:opacity-35"
          >
            {autoPlayActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
        </div>
      </nav>
    </main>
  );
}