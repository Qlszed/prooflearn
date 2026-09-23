import Link from "next/link";

export default function Landing() {
  return <main className="landing shell">
    <header className="topbar"><Link className="brand" href="/">ProofLearn<span>.</span></Link><span className="top-note">Assessment, rethought</span></header>
    <section className="hero">
      <div className="hero-copy"><p className="eyebrow">A short text-based defence</p><h1>Verify understanding,<br /><em>not authorship.</em></h1><p className="lede">Turn any student submission into a personalized short text-based defence.</p><Link className="button primary" href="/setup">Create verification <span>→</span></Link><p className="fine-print">We don&apos;t detect AI. We verify learning.</p></div>
      <div className="editorial-art" aria-label="An abstract diagram of a written answer becoming a question"><div className="paper"><span>student<br />submission</span><i /></div><div className="arrow">→</div><div className="question-card"><small>QUESTION 01</small><strong>Explain this<br />in your own words.</strong><div className="line" /><div className="line short" /></div></div>
    </section>
    <footer className="landing-foot"><span>ProofLearn / 2026</span><span>Evidence over assumption</span></footer>
  </main>;
}
