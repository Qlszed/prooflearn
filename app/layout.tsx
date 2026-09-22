import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProofLearn | Verify understanding, not authorship",
  description: "A personalized defence for every student submission.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
