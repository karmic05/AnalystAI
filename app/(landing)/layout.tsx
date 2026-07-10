import { LandingNav } from "@/components/landing/nav";
import { LogoMarquee } from "@/components/landing/logo-marquee";
import { LandingFooter } from "@/components/landing/footer";

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <LandingNav />
      <main className="flex flex-1 flex-col">{children}</main>
      <LogoMarquee />
      <LandingFooter />
    </div>
  );
}
