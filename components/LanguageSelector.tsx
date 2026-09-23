"use client";

import { languageNames, useLanguage } from "@/lib/i18n";

export default function LanguageSelector() {
  const language = useLanguage();
  function change(event: React.ChangeEvent<HTMLSelectElement>) {
    localStorage.setItem("prooflearn-language", event.target.value);
    const raw = sessionStorage.getItem("prooflearn");
    if (raw) { try { sessionStorage.setItem("prooflearn", JSON.stringify({ ...JSON.parse(raw), language: event.target.value })); } catch {} }
    window.dispatchEvent(new Event("prooflearn-language-change"));
  }
  return <label className="language-selector"><span className="sr-only">Language</span><select value={language} onChange={change} aria-label="Language"><option value="en">{languageNames.en}</option><option value="ru">{languageNames.ru}</option><option value="kk">{languageNames.kk}</option></select></label>;
}
