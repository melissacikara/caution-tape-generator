import { Link } from 'react-router'

function HazardStripeBand() {
  return (
    <div
      className="h-3 w-full shrink-0 border-y border-black/40"
      style={{
        background:
          'repeating-linear-gradient(-45deg, #ffd000 0, #ffd000 12px, #0a0a0a 12px, #0a0a0a 24px)',
      }}
      aria-hidden
    />
  )
}

export function AboutPage() {
  return (
    <main className="flex justify-center px-4 pb-16 pt-6">
      <article className="w-full max-w-[480px] md:max-w-[640px]">
        <HazardStripeBand />

        <header className="border-x border-b border-border bg-surface px-4 py-8 md:px-6">
          <p className="font-ui text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted">
            About
          </p>
          <h1 className="mt-2 font-display text-4xl uppercase leading-none tracking-[0.06em] text-foreground md:text-5xl">
            What is this?
          </h1>
          <p className="mt-6 font-ui text-sm leading-relaxed text-muted">
            This started as a party game. It still is. Type a warning. It becomes tape.
            Attach it to a scenario. Share the scenario. No hard hat required. No actual hazard assumed.
          </p>
        </header>

        <section
          className="border-x border-b border-border bg-surface-raised px-4 py-8 md:px-6"
          aria-labelledby="how-heading"
        >
          <h2
            id="how-heading"
            className="font-display text-xl uppercase tracking-[0.12em] text-accent"
          >
            How it works
          </h2>
          <ol className="mt-6 space-y-5 font-ui text-sm leading-relaxed text-muted">
            <li className="flex gap-4">
              <span
                className="flex h-8 min-w-8 items-center justify-center bg-accent font-mono text-xs font-bold text-accent-text"
                aria-hidden
              >
                1
              </span>
              <span>
                <strong className="font-medium text-foreground">Issue a warning.</strong>{' '}
                Any warning. The generator will not question it.
              </span>
            </li>
            <li className="flex gap-4">
              <span
                className="flex h-8 min-w-8 items-center justify-center bg-accent font-mono text-xs font-bold text-accent-text"
                aria-hidden
              >
                2
              </span>
              <span>
                <strong className="font-medium text-foreground">Drop it in a scenario.</strong>{' '}
                Every tape needs a situation. Name yours.
              </span>
            </li>
            <li className="flex gap-4">
              <span
                className="flex h-8 min-w-8 items-center justify-center bg-accent font-mono text-xs font-bold text-accent-text"
                aria-hidden
              >
                3
              </span>
              <span>
                <strong className="font-medium text-foreground">Distribute the link.</strong>{' '}
                Recipients can add their own warnings to the same scenario. Chaos is collaborative.
              </span>
            </li>
          </ol>
        </section>

        <section
          className="border-x border-b border-border bg-surface px-4 py-8 md:px-6"
          aria-labelledby="visibility-heading"
        >
          <h2
            id="visibility-heading"
            className="font-display text-xl uppercase tracking-[0.12em] text-accent"
          >
            Who can see this
          </h2>
          <p className="mt-6 font-ui text-sm leading-relaxed text-muted">
            Private scenarios are for consenting friends. The link is the invitation.
            <br />
            Public is public. That means anyone&apos;s kid could see it. Choose accordingly.
          </p>
        </section>

        <section
          id="reporting"
          className="scroll-mt-[52px] border-x border-b border-border bg-surface-raised px-4 py-8 md:px-6"
          aria-labelledby="reporting-heading"
        >
          <h2
            id="reporting-heading"
            className="font-display text-xl uppercase tracking-[0.12em] text-accent"
          >
            Report a tape or scenario
          </h2>
          <p className="mt-6 font-ui text-sm leading-relaxed text-muted">
            Reports are for <strong className="font-medium text-foreground">public</strong> scenarios only.
            Open the scenario from the Library (Public tab), scroll to the tape, and use{' '}
            <strong className="font-medium text-foreground">Report</strong> under that tape.
            We review flags; there is no separate form for whole scenarios yet.
          </p>
          <Link
            to="/library"
            className="mt-6 inline-flex min-h-[44px] cursor-pointer items-center justify-center border border-border bg-background px-5 py-2.5 font-ui text-sm font-medium uppercase tracking-wide text-foreground transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised"
          >
            Open library
          </Link>
        </section>

        <footer className="border-x border-border bg-background px-4 py-6 md:px-6">
          <p className="font-ui text-xs uppercase tracking-[0.15em] text-muted">
            The tape does not make itself.
          </p>
          <Link
            to="/create"
            className="mt-4 inline-flex min-h-[44px] items-center justify-center border border-accent bg-transparent px-5 py-2.5 font-ui text-sm font-medium uppercase tracking-wide text-accent transition-colors hover:bg-accent hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Start taping
          </Link>
        </footer>

        <HazardStripeBand />
      </article>
    </main>
  )
}
