"use client";
import VerifyClient from "@/components/VerifyClient";
import LanguageSelector from "@/components/LanguageSelector";
import { t, useLanguage } from "@/lib/i18n";
export default function VerifyPage() { const language = useLanguage(); const margin = t(language, "marginTest").split("|"); const sub = t(language, "marginOne").split("|"); return <main className="shell inner-page"><header className="topbar"><a className="brand" href="/">ProofLearn<span>.</span></a><span className="step">{t(language, "questionStage")}</span><LanguageSelector /></header><div className="verify-layout"><VerifyClient /><aside className="margin-note verify-note"><span className="note-number">02</span><div className="note-rule" /><p>{margin[0]}<br />{margin[1]}</p><small>{sub[0]}<br />{sub[1]}</small></aside></div></main>; }
