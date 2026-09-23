"use client";
import Link from "next/link";
import LanguageSelector from "@/components/LanguageSelector";
import { t, useLanguage } from "@/lib/i18n";

export default function Landing() {
  const language = useLanguage();
  const headline = t(language, "landingHeadline").split("|");
  return <main className="landing shell">
    <header className="topbar"><Link className="brand" href="/">ProofLearn<span>.</span></Link><span className="top-note">{t(language, "assessment")}</span><LanguageSelector /></header>
    <section className="hero">
      <div className="hero-copy"><p className="eyebrow">{t(language, "landingEyebrow")}</p><h1>{headline[0]}<br /><em>{headline[1]}</em></h1><p className="lede">{t(language, "landingLede")}</p><Link className="button primary" href="/setup">{t(language, "create")} <span>→</span></Link><p className="fine-print">{t(language, "notDetector")}</p></div>
      <div className="editorial-art" aria-label="An abstract diagram of a written answer becoming a question"><div className="paper"><span>student<br />submission</span><i /></div><div className="arrow">→</div><div className="question-card"><small>QUESTION 01</small><strong>Explain this<br />in your own words.</strong><div className="line" /><div className="line short" /></div></div>
    </section>
    <footer className="landing-foot"><span>ProofLearn / 2026</span><span>{language === "ru" ? "Доказательства важнее предположений" : language === "kk" ? "Дәлел болжамнан маңызды" : "Evidence over assumption"}</span></footer>
  </main>;
}
