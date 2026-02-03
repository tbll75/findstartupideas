import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG } from "@/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy Policy for ${SITE_CONFIG.name} - how we collect, use, and protect your information.`,
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Content */}
      <main className="flex-1 py-16">
        <div className="max-w-3xl mx-auto px-5 lg:px-8">
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <h1 className="font-serif text-4xl lg:text-5xl tracking-tight text-foreground mb-4">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground text-lg mb-12">
              Last updated: January 30, 2025
            </p>

            <section className="space-y-6 mb-12">
              <h2 className="font-serif text-2xl text-foreground border-b border-border pb-2">
                1. Introduction
              </h2>
              <p className="text-foreground/90 leading-relaxed">
                {SITE_CONFIG.name} (&quot;we&quot;, &quot;our&quot;, or
                &quot;us&quot;) respects your privacy. This Privacy Policy
                explains how we collect, use, disclose, and safeguard your
                information when you use our AI-powered startup idea discovery
                service at {SITE_CONFIG.domain}.
              </p>
            </section>

            <section className="space-y-6 mb-12">
              <h2 className="font-serif text-2xl text-foreground border-b border-border pb-2">
                2. Information We Collect
              </h2>
              <p className="text-foreground/90 leading-relaxed mb-4">
                We collect the following types of information:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                <li>
                  <strong>Email and name (optional):</strong> When you subscribe
                  to unlock additional searches or sign up for our newsletter,
                  we collect your email address and optionally your name. This
                  information is used to provide the service and send relevant
                  updates.
                </li>
                <li>
                  <strong>Search queries:</strong> When you search for startup
                  ideas, we process your search topic, filters (time range,
                  upvotes, sort order), and related parameters to generate
                  results. Search topics may be stored temporarily for caching
                  and rate limiting.
                </li>
                <li>
                  <strong>IP address:</strong> We use your IP address for rate
                  limiting (to prevent abuse and ensure fair usage), security,
                  and to enforce daily search limits. IP addresses are not
                  linked to your identity and are used only for technical
                  purposes.
                </li>
                <li>
                  <strong>Usage data:</strong> We use Vercel Analytics and Speed
                  Insights to understand how visitors use our site (e.g., page
                  views, performance metrics). This helps us improve the
                  Service.
                </li>
                <li>
                  <strong>Cookies and similar technologies:</strong> We may use
                  cookies or local storage to remember your preferences (e.g.,
                  search limit state) and to support analytics.
                </li>
              </ul>
            </section>

            <section className="space-y-6 mb-12">
              <h2 className="font-serif text-2xl text-foreground border-b border-border pb-2">
                3. How We Use Your Information
              </h2>
              <p className="text-foreground/90 leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                <li>Provide, maintain, and improve the Service</li>
                <li>
                  Process your search requests and deliver AI-analyzed startup
                  ideas
                </li>
                <li>
                  Enforce rate limits and daily search quotas (e.g., 5 free
                  searches per day per IP)
                </li>
                <li>
                  Send you newsletters or product updates if you have subscribed
                </li>
                <li>Respond to your inquiries and provide support</li>
                <li>
                  Analyze usage patterns to improve performance and user
                  experience
                </li>
                <li>Detect and prevent abuse, fraud, and security issues</li>
              </ul>
            </section>

            <section className="space-y-6 mb-12">
              <h2 className="font-serif text-2xl text-foreground border-b border-border pb-2">
                4. Third-Party Services
              </h2>
              <p className="text-foreground/90 leading-relaxed mb-4">
                We use the following third-party services that may process your
                data:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                <li>
                  <strong>Vercel:</strong> Hosting, analytics, and performance
                  monitoring. See{" "}
                  <Link
                    href="https://vercel.com/legal/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline focus-ring rounded"
                  >
                    Vercel&apos;s Privacy Policy
                  </Link>
                  .
                </li>
                <li>
                  <strong>Supabase:</strong> Database and backend infrastructure
                  for storing search metadata. See{" "}
                  <a
                    href="https://supabase.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline focus-ring rounded"
                  >
                    Supabase&apos;s Privacy Policy
                  </a>
                  .
                </li>
                <li>
                  <strong>Google Gemini:</strong> AI analysis of Hacker News
                  content to generate startup ideas. Search topics and public
                  content are processed by Google. See{" "}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline focus-ring rounded"
                  >
                    Google&apos;s Privacy Policy
                  </a>
                  .
                </li>
                <li>
                  <strong>Newsletter provider:</strong> When you subscribe, your
                  email and name may be sent to our newsletter service to manage
                  subscriptions.
                </li>
              </ul>
            </section>

            <section className="space-y-6 mb-12">
              <h2 className="font-serif text-2xl text-foreground border-b border-border pb-2">
                5. Data Retention
              </h2>
              <p className="text-foreground/90 leading-relaxed">
                We retain your information only as long as necessary to provide
                the Service and fulfill the purposes described in this policy.
                Cached search results and rate limit data are typically stored
                for a limited period (e.g., a few hours to days). Email
                subscriptions are retained until you unsubscribe. We may retain
                certain data longer if required by law or for legitimate
                business purposes.
              </p>
            </section>

            <section className="space-y-6 mb-12">
              <h2 className="font-serif text-2xl text-foreground border-b border-border pb-2">
                6. Your Rights and Choices
              </h2>
              <p className="text-foreground/90 leading-relaxed mb-4">
                Depending on your location, you may have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                <li>
                  <strong>Access:</strong> Request a copy of the personal data
                  we hold about you
                </li>
                <li>
                  <strong>Correction:</strong> Request correction of inaccurate
                  data
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your personal
                  data
                </li>
                <li>
                  <strong>Opt-out:</strong> Unsubscribe from newsletters at any
                  time via the link in our emails
                </li>
                <li>
                  <strong>Object or restrict:</strong> Object to or request
                  restriction of certain processing
                </li>
              </ul>
              <p className="text-foreground/90 leading-relaxed mt-4">
                To exercise these rights, please contact us. If you are in the
                European Economic Area (EEA) or UK, you also have the right to
                lodge a complaint with your local data protection authority.
              </p>
            </section>

            <section className="space-y-6 mb-12">
              <h2 className="font-serif text-2xl text-foreground border-b border-border pb-2">
                7. Security
              </h2>
              <p className="text-foreground/90 leading-relaxed">
                We implement appropriate technical and organizational measures
                to protect your information against unauthorized access,
                alteration, disclosure, or destruction. However, no method of
                transmission over the internet or electronic storage is 100%
                secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section className="space-y-6 mb-12">
              <h2 className="font-serif text-2xl text-foreground border-b border-border pb-2">
                8. Children&apos;s Privacy
              </h2>
              <p className="text-foreground/90 leading-relaxed">
                The Service is not intended for children under 13. We do not
                knowingly collect personal information from children under 13.
                If you believe we have collected such information, please
                contact us and we will take steps to delete it.
              </p>
            </section>

            <section className="space-y-6 mb-12">
              <h2 className="font-serif text-2xl text-foreground border-b border-border pb-2">
                9. Changes to This Policy
              </h2>
              <p className="text-foreground/90 leading-relaxed">
                We may update this Privacy Policy from time to time. We will
                notify you of material changes by posting the updated policy on
                this page and updating the &quot;Last updated&quot; date. Your
                continued use of the Service after such changes constitutes
                acceptance of the updated policy.
              </p>
            </section>

            <section className="space-y-6 mb-12">
              <h2 className="font-serif text-2xl text-foreground border-b border-border pb-2">
                10. Contact Us
              </h2>
              <p className="text-foreground/90 leading-relaxed">
                If you have questions about this Privacy Policy or our data
                practices, please contact us through our website at{" "}
                {SITE_CONFIG.domain} or using the contact information provided
                there.
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
