import PhotoCard from './PhotoCard.jsx'

function ScrapbookPage({ page, isRight = false }) {
  const photo = page?.photo || page?.photos?.[0]
  return (
    <article className="page-content flex h-full min-w-0 flex-col justify-between p-6 sm:p-8">
      <header className="flex items-start justify-between gap-4">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-neutral-800">
          {page?.title}
        </h2>
        <span className="select-none text-3xl" aria-hidden="true">
          {page?.sticker}
        </span>
      </header>

      {/* One Image Per Side */}
      <div className="my-auto flex justify-center py-4">
        {photo && (
          <PhotoCard
            imageUrl={photo.imageUrl || photo.url}
            altText={photo.altText || photo.caption}
            caption={photo.caption}
            rotation={isRight ? 2.5 : -2.5}
          />
        )}
      </div>

      <p className="handwritten font-handwriting text-center text-2xl sm:text-3xl text-amber-950/90 tracking-wide">
        {page?.handwritten || page?.text}
      </p>
    </article>
  )
}

function PageSpread({ leftPageData, rightPageData }) {
  return (
    <section
      className="mx-auto grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-2xl bg-amber-100 shadow-2xl md:grid-cols-2"
      aria-label="Open scrapbook spread"
    >
      <div className="min-w-0 border-b border-amber-200 shadow-inner md:border-b-0 md:border-r">
        <ScrapbookPage page={leftPageData} isRight={false} />
      </div>
      <div className="min-w-0 shadow-inner">
        <ScrapbookPage page={rightPageData} isRight={true} />
      </div>
    </section>
  )
}

export default PageSpread

