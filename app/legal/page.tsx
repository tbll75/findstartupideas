import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG } from "@/constants";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of Service for ${SITE_CONFIG.name} - the AI-powered startup idea discovery platform.`,
  alternates: {
    canonical: "/legal",
  },
};

export default function LegalPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Content */}
      <main className="flex-1 py-16">
        <div className="max-w-3xl mx-auto px-5 lg:px-8">
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <h1 className="font-serif text-4xl lg:text-5xl tracking-tight text-foreground mb-4">
              Terms of Service
            </h1>
            <p className="text-muted-foreground text-lg mb-12">
              Last updated: January 30, 2025
            </p>

            <section className="space-y-6 mb-12">
              <h2 className="font-serif text-2xl text-foreground border-b border-border pb-2">
                1. Acceptance of Terms
              </h2>
              <p className="text-foreground/90 leading-relaxed">
                By accessing or using {SITE_CONFIG.name} (&quot;the
                Service&quot;), you agree to be bound by these Terms of Service.
                If you do not agree to these terms, please do not use the
                Service. The Service is operated by {SITE_CONFIG.name} and
                provides AI-powered startup idea discovery by analyzing pain
                points from Hacker News discussions.
              </p>
            </section>

            <section className="space-y-6 mb-12">
              <h2 className="font-serif text-2xl text-foreground border-b border-border pb-2">
                2. Description of Service
              </h2>
              <p className="text-foreground/90 leading-relaxed">
                {SITE_CONFIG.name} allows you to search for startup ideas by
                topic, product, or market. The Service uses artificial
                intelligence to analyze publicly available discussions from
                Hacker News and extract pain points, quotes, and validated
                business opportunities. Search results are provided for
                informational purposes only.
              </p>
            </section>

            <section className="space-y-6 mb-12">
              <h2 className="font-serif text-2xl text-foreground border-b border-border pb-2">
                3. Use of the Service
              </h2>
              <p className="text-foreground/90 leading-relaxed mb-4">
                You agree to use the Service only for lawful purposes and in
                accordance with these Terms. You agree not to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                <li>
                  Exceed the rate limits or search quotas (including daily
                  limits) imposed by the Service
                </li>
                <li>
                  Attempt to circumvent any access restrictions, rate limits, or
                  security measures
                </li>
                <li>Use the Service to infringe on any third-party rights</li>
                <li>
                  Scrape, harvest, or collect data from the Service through
                  automated means without permission
                </li>
                <li>
                  Use the Service in any way that could damage, disable, or
                  impair the Service
                </li>
              </ul>
            </section>

            <section className="space-y-6 mb-12">
              <h2 className="font-serif text-2xl text-foreground border-b border-border pb-2">
                4. Intellectual Property
              </h2>
              <p className="text-foreground/90 leading-relaxed">
                The Service, including its design, features, and content
                (excluding user-generated content and third-party sources), is
                owned by {SITE_CONFIG.name}. Hacker News content and discussions
                are used under fair use for analysis. The AI-generated summaries
                and insights are provided for your personal use. You may share
                search results through the Service&apos;s sharing features.
              </p>
            </section>

            <section className="space-y-6 mb-12">
              <h2 className="font-serif text-2xl text-foreground border-b border-border pb-2">
                5. Disclaimer of Warranties
              </h2>
              <p className="text-foreground/90 leading-relaxed">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
                AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND. We do not
                guarantee the accuracy, completeness, or usefulness of any
                startup ideas, pain points, or insights. The Service is for
                research and inspiration only—you should conduct your own due
                diligence before making any business decisions.
              </p>
            </section>

            <section className="space-y-6 mb-12">
              <h2 className="font-serif text-2xl text-foreground border-b border-border pb-2">
                6. Limitation of Liability
              </h2>
              <p className="text-foreground/90 leading-relaxed">
                To the maximum extent permitted by law, {SITE_CONFIG.name} shall
                not be liable for any indirect, incidental, special,
                consequential, or punitive damages arising from your use of the
                Service. Our total liability shall not exceed the amount you
                paid to use the Service in the past twelve months, or $100,
                whichever is greater.
              </p>
            </section>

            <section className="space-y-6 mb-12">
              <h2 className="font-serif text-2xl text-foreground border-b border-border pb-2">
                7. Changes to Terms
              </h2>
              <p className="text-foreground/90 leading-relaxed">
                We may update these Terms from time to time. We will notify you
                of material changes by posting the updated Terms on this page
                and updating the &quot;Last updated&quot; date. Your continued
                use of the Service after such changes constitutes acceptance of
                the new Terms.
              </p>
            </section>

            <section className="space-y-6 mb-12">
              <h2 className="font-serif text-2xl text-foreground border-b border-border pb-2">
                8. Contact
              </h2>
              <p className="text-foreground/90 leading-relaxed">
                If you have questions about these Terms of Service, please
                contact us through our website or at the contact information
                provided on {SITE_CONFIG.domain}.
              </p>
            </section>

            <div className="pt-8 border-t border-border">
              <Link
                href="/"
                className="inline-flex items-center text-primary font-medium hover:underline focus-ring rounded"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
