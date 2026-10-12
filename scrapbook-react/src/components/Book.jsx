import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useDrag } from '@use-gesture/react'

const pageFlipVariants = {
  initial: {
    rotateY: 0,
    z: 0,
    boxShadow: '0 8px 16px rgba(41, 26, 12, 0.12)',
  },
  animate: {
    rotateY: 0,
    z: 0,
    boxShadow: '0 8px 16px rgba(41, 26, 12, 0.12)',
    transition: { duration: 0.45, ease: 'easeOut' },
  },
  exit: {
    rotateY: -180,
    z: -8,
    boxShadow: '0 18px 28px rgba(41, 26, 12, 0.24)',
    transition: { duration: 1.2, ease: [0.65, 0, 0.35, 1] },
  },
}

function Book({ pages = [] }) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const currentPage = pages[currentPageIndex]
  const leftPage = currentPageIndex > 0 ? pages[currentPageIndex - 1] : null
  const hasNextPage = currentPageIndex < pages.length - 1

  function nextPage() {
    setCurrentPageIndex((index) =>
      Math.min(index + 1, Math.max(0, pages.length - 1)),
    )
  }

  function prevPage() {
    setCurrentPageIndex((index) => Math.max(index - 1, 0))
  }

  const bindSwipe = useDrag(
    ({ swipe: [swipeX] }) => {
      if (typeof window !== 'undefined' && window.visualViewport?.scale > 1.01) {
        return
      }

      if (swipeX === -1) nextPage()
      if (swipeX === 1) prevPage()
    },
    {
      axis: 'x',
      filterTaps: true,
      swipe: { velocity: 0.35, distance: 60, duration: 500 },
    },
  )

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div
        {...bindSwipe()}
        className="grid grid-cols-2 overflow-hidden rounded-2xl bg-amber-100 shadow-2xl [perspective:1200px]"
        style={{ touchAction: 'pan-y pinch-zoom' }}
        aria-label="Open scrapbook"
      >
        <div className="min-h-80 min-w-0 border-r border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 shadow-inner">
          {leftPage}
        </div>

        <div className="relative min-h-80 min-w-0 bg-amber-50">
          <AnimatePresence initial={false}>
            {currentPage && (
              <motion.div
                key={currentPageIndex}
                className="absolute inset-0 min-w-0 origin-left bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 shadow-inner"
                style={{
                  backfaceVisibility: 'hidden',
                  transformOrigin: 'left center',
                  transformStyle: 'preserve-3d',
                }}
                variants={pageFlipVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {currentPage}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={nextPage}
          disabled={!hasNextPage}
          className="rounded-lg bg-amber-900 px-5 py-2 font-medium text-white transition-colors hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default Book
