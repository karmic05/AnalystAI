import type { Metadata } from "next";
import { About } from "@/components/landing/about";

export const metadata: Metadata = {
  title: "About · AnalystAI",
  description:
    "AnalystAI's mission, vision, and founder. On a mission to put a capable, trustworthy analyst on every operator's desk.",
};

export default function AboutPage() {
  return <About />;
}
