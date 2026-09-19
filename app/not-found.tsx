import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-[60vh] bg-foundation-darkest">
      <Section spacing="lg">
        <Container size="sm" className="text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-foundation-dark border border-foundation-slate flex items-center justify-center mx-auto text-brand-cyan shadow-lg">
            <Compass className="w-8 h-8 animate-pulse-slow" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase font-sans tracking-[0.2em] text-brand-cyan font-bold block">
              404 • Not Found
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-typo-white">
              Resource Not Located
            </h1>
            <p className="font-sans text-sm sm:text-base text-typo-gray max-w-md mx-auto leading-relaxed">
              The event, article, or platform page you requested does not exist or has been relocated by the IEDC administration.
            </p>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Button href="/" variant="primary" size="md">
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span>Return Home</span>
            </Button>
            <Button href="/events" variant="secondary" size="md">
              Browse Events
            </Button>
            <Button href="/blog" variant="ghost" size="md">
              Read Blog
            </Button>
          </div>
        </Container>
      </Section>
    </div>
  );
}
