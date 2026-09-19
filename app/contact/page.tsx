import { constructMetadata } from "@/lib/seo/metadata";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { PageHeading } from "@/components/ui/PageHeading";
import { ContactForm } from "@/components/contact/ContactForm";
import {
  MapPin,
  Mail,
  Building,
  Clock,
  ExternalLink,
  Linkedin,
  Twitter,
  Instagram,
  Github,
  Sparkles,
} from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants/site";

export const metadata = constructMetadata({
  title: "Contact & Incubation Inquiries",
  description:
    "Connect with the Innovation & Entrepreneurship Development Cell at TKIET Warananagar for student startup pitches, lab access, and mentorship.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="flex flex-col flex-1">
      <Section spacing="lg" hasAsymmetricGrid>
        <Container size="lg">
          <PageHeading
            badge="Institutional Portal"
            title="Let's Connect."
            subtitle="Reach out to discuss student startup incubation, prototyping laboratory access, mentor engagements, or collaborative hackathons."
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 my-10 items-start">
            {/* Left Column: Direct Institutional Channels */}
            <div className="lg:col-span-5 space-y-6">
              {/* Headquarters & Physical Details */}
              <div className="p-8 rounded-2xl bg-foundation-dark border border-foundation-slate space-y-6">
                <div className="flex items-center gap-2 text-xs font-mono text-brand-cyan">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="uppercase tracking-wider font-semibold">Cell Headquarters</span>
                </div>

                <div className="space-y-5 text-sm font-sans">
                  {/* Institution */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-foundation-slate/60 border border-foundation-slate flex items-center justify-center shrink-0 mt-0.5">
                      <Building className="w-4 h-4 text-brand-cyan" />
                    </div>
                    <div>
                      <span className="text-xs uppercase font-semibold text-typo-gray block">
                        Institution
                      </span>
                      <p className="text-typo-white font-medium">
                        {SITE_CONFIG.institution}
                      </p>
                      <p className="text-typo-gray text-xs mt-0.5">
                        {SITE_CONFIG.fullName}
                      </p>
                    </div>
                  </div>

                  {/* Physical Address (Text Only - No Map Embed per Spec) */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-foundation-slate/60 border border-foundation-slate flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-brand-cyan" />
                    </div>
                    <div>
                      <span className="text-xs uppercase font-semibold text-typo-gray block">
                        Campus Location
                      </span>
                      <p className="text-typo-white font-medium">
                        Innovation &amp; Prototyping Laboratory
                      </p>
                      <p className="text-typo-gray text-xs mt-0.5">
                        TKIET Campus, Warananagar, Panhala, Kolhapur
                      </p>
                      <p className="text-typo-gray text-xs">
                        Maharashtra — 416113, India
                      </p>
                    </div>
                  </div>

                  {/* Official Email */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-foundation-slate/60 border border-foundation-slate flex items-center justify-center shrink-0 mt-0.5">
                      <Mail className="w-4 h-4 text-brand-cyan" />
                    </div>
                    <div>
                      <span className="text-xs uppercase font-semibold text-typo-gray block">
                        Official Communications
                      </span>
                      <a
                        href="mailto:iedc@tkiet.ac.in"
                        className="text-brand-cyan hover:underline font-medium block mt-0.5"
                      >
                        iedc@tkiet.ac.in
                      </a>
                      <p className="text-typo-gray text-xs mt-0.5">
                        Primary inbox for student pitches &amp; institutional liaisons
                      </p>
                    </div>
                  </div>

                  {/* Operating Hours */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-foundation-slate/60 border border-foundation-slate flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-4 h-4 text-brand-cyan" />
                    </div>
                    <div>
                      <span className="text-xs uppercase font-semibold text-typo-gray block">
                        Academic Operating Hours
                      </span>
                      <p className="text-typo-white font-medium">
                        Monday — Saturday
                      </p>
                      <p className="text-typo-gray text-xs mt-0.5">
                        09:30 AM — 05:30 PM IST (Lab extended during hackathons)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Channels & Online Presence */}
              <div className="p-6 rounded-2xl bg-foundation-dark border border-foundation-slate space-y-4">
                <span className="text-xs uppercase font-mono tracking-wider text-typo-gray font-semibold block">
                  Connect on Official Channels
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-foundation-slate/40 border border-foundation-slate/70 hover:border-brand-blue text-typo-gray hover:text-typo-white transition-all text-xs font-sans group"
                  >
                    <Linkedin className="w-4 h-4 text-brand-cyan group-hover:scale-110 transition-transform" />
                    <span>LinkedIn</span>
                    <ExternalLink className="w-3 h-3 ml-auto opacity-60" />
                  </a>

                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-foundation-slate/40 border border-foundation-slate/70 hover:border-brand-blue text-typo-gray hover:text-typo-white transition-all text-xs font-sans group"
                  >
                    <Twitter className="w-4 h-4 text-brand-cyan group-hover:scale-110 transition-transform" />
                    <span>Twitter / X</span>
                    <ExternalLink className="w-3 h-3 ml-auto opacity-60" />
                  </a>

                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-foundation-slate/40 border border-foundation-slate/70 hover:border-brand-blue text-typo-gray hover:text-typo-white transition-all text-xs font-sans group"
                  >
                    <Instagram className="w-4 h-4 text-brand-cyan group-hover:scale-110 transition-transform" />
                    <span>Instagram</span>
                    <ExternalLink className="w-3 h-3 ml-auto opacity-60" />
                  </a>

                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-foundation-slate/40 border border-foundation-slate/70 hover:border-brand-blue text-typo-gray hover:text-typo-white transition-all text-xs font-sans group"
                  >
                    <Github className="w-4 h-4 text-brand-cyan group-hover:scale-110 transition-transform" />
                    <span>GitHub</span>
                    <ExternalLink className="w-3 h-3 ml-auto opacity-60" />
                  </a>
                </div>

                <div className="pt-2 text-[11px] font-sans text-typo-gray/70 leading-relaxed">
                  Inquiries logged through the form are reviewed by student leads and faculty coordinators within 48–72 academic hours.
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Inquiry Form */}
            <div className="lg:col-span-7">
              <ContactForm />
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}

