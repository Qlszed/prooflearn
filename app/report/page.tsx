"use client";
import ReportClient from "@/components/ReportClient";
import LanguageSelector from "@/components/LanguageSelector";
import { t, useLanguage } from "@/lib/i18n";
export default function ReportPage() { const language = useLanguage(); return <main className="shell inner-page"><header className="topbar"><a className="brand" href="/">ProofLearn<span>.</span></a><span className="step">{t(language, "reportStage")}</span><LanguageSelector /></header><ReportClient /></main>; }
