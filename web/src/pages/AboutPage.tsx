import { Link } from 'react-router'

function HazardStripeBand() {
  return (
    <div
      className="h-3 w-full shrink-0 border-y border-black/40"
      style={{
        background:
          'repeating-linear-gradient(-45deg, #dc2626 0, #dc2626 12px, #0a0a0a 12px, #0a0a0a 24px)',
      }}
      aria-hidden
    />
  )
}

export function AboutPage() {
  return (
    <main className="flex justify-center px-4 pb-16 pt-6 text-red-500">
      <article className="w-full max-w-[480px] md:max-w-[640px]">
        <HazardStripeBand />

        <header className="border-x border-b border-border bg-surface px-4 py-8 md:px-6">
          <p className="font-ui text-[0.65rem] font-medium uppercase tracking-[0.2em]">
            About
          </p>
          <h1 className="mt-2 font-display text-4xl uppercase leading-none tracking-[0.06em] md:text-5xl">
            What is this?
          </h1>
          <p className="mt-6 font-ui text-sm leading-relaxed text-red-400">
            Caution Tape Generator helps you build bold, readable warning strips—then collect them on
            shareable scenario boards. It is built for quick visual emphasis: short phrases, high
            contrast, and a look borrowed from real hazard tape.
          </p>
        </header>

        <section
          className="border-x border-b border-border bg-surface-raised px-4 py-8 md:px-6"
          aria-labelledby="how-heading"
        >
          <h2
            id="how-heading"
            className="font-display text-xl uppercase tracking-[0.12em] text-red-500"
          >
            How it works
          </h2>
          <ol className="mt-6 space-y-5 font-ui text-sm leading-relaxed text-red-400">
            <li className="flex gap-4">
              <span
                className="flex h-8 min-w-8 items-center justify-center bg-red-600 font-mono text-xs font-bold text-white"
                aria-hidden
              >
                1
              </span>
              <span>
                <strong className="font-medium text-red-500">Compose a strip.</strong> Enter your
                message and pick a tape color in the creator.
              </span>
            </li>
            <li className="flex gap-4">
              <span
                className="flex h-8 min-w-8 items-center justify-center bg-red-600 font-mono text-xs font-bold text-white"
                aria-hidden
              >
                2
              </span>
              <span>
                <strong className="font-medium text-red-500">Attach it to a scenario.</strong> Start
                a new board or add the strip to one you already use.
              </span>
            </li>
            <li className="flex gap-4">
              <span
                className="flex h-8 min-w-8 items-center justify-center bg-red-600 font-mono text-xs font-bold text-white"
                aria-hidden
              >
                3
              </span>
              <span>
                <strong className="font-medium text-red-500">Open the shareable page.</strong> Each
                scenario has its own link so others can view the full run of tapes.
              </span>
            </li>
          </ol>
        </section>

        <footer className="border-x border-border bg-background px-4 py-6 md:px-6">
          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center justify-center border border-red-500 bg-transparent px-5 py-2.5 font-ui text-sm font-medium uppercase tracking-wide text-red-500 transition-colors hover:bg-red-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Back to creator
          </Link>
        </footer>

        <HazardStripeBand />
      </article>
    </main>
  )
}
