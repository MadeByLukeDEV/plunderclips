// src/app/terms/page.tsx — SERVER COMPONENT
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | PlunderClips',
  description: 'Read the PlunderClips Terms of Service — the rules governing your use of our Sea of Thieves community clip platform.',
  alternates: { canonical: `${process.env.NEXTAUTH_URL || 'https://plunderclips.gg'}/terms` },
  robots: { index: true, follow: false },
};

const EFFECTIVE_DATE = 'May 7, 2025';
const CONTACT_EMAIL  = 'hello@plunderclips.com';

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-10">
      <h2 className="font-display text-xl font-700 text-white tracking-wide mb-3">{title}</h2>
      <div className="space-y-3 text-white/50 text-sm font-body leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-14">

      {/* Header */}
      <div className="mb-10">
        <p className="font-display text-xs tracking-[0.3em] text-teal mb-2">LEGAL</p>
        <h1 className="font-display text-5xl font-900 text-white">Terms of Service</h1>
        <div className="teal-divider mt-3 mb-4" />
        <p className="text-white/30 text-xs font-mono">Effective date: {EFFECTIVE_DATE}</p>
      </div>

      {/* Intro */}
      <p className="text-white/40 text-sm font-body leading-relaxed mb-10">
        Welcome aboard. By accessing or using PlunderClips (&ldquo;the Service&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;),
        you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
        PlunderClips is an independent community platform and is <strong className="text-white/60">not affiliated with, endorsed by,
        or sponsored by Rare Ltd., Xbox Game Studios, or Microsoft Corporation</strong>.
      </p>

      <Section id="accounts" title="1. Accounts &amp; Authentication">
        <p>
          PlunderClips uses Twitch OAuth as its sole authentication method. By signing in, you
          authorise us to read your basic Twitch profile information (username, display name, profile
          picture, and optionally email) to create and maintain your account.
        </p>
        <p>
          You are responsible for all activity that occurs under your account. You must not share
          your Twitch credentials with others or allow third parties to access your PlunderClips
          account.
        </p>
        <p>
          You may optionally link a YouTube channel to your account via Google OAuth. This allows
          the platform to verify clip ownership automatically. Linking is voluntary and can be
          removed at any time from your Settings page.
        </p>
        <p>
          We reserve the right to suspend or terminate accounts that violate these Terms, engage in
          abusive behaviour, or attempt to manipulate the platform.
        </p>
      </Section>

      <Section id="content" title="2. User-Submitted Content">
        <p>
          PlunderClips allows registered users to submit clips hosted on Twitch, YouTube, and
          Medal.tv. By submitting a clip, you represent and warrant that:
        </p>
        <ul className="list-none space-y-1.5 pl-4">
          <li>→ You are the original creator of the clip, or you have explicit permission from the creator to submit it.</li>
          <li>→ The clip does not infringe the intellectual property rights, privacy rights, or any other rights of any third party.</li>
          <li>→ The clip does not contain content that is unlawful, hateful, harassing, defamatory, obscene, or otherwise objectionable.</li>
          <li>→ You have all necessary rights to grant us the licence described below.</li>
        </ul>
        <p>
          By submitting content, you grant PlunderClips a non-exclusive, worldwide, royalty-free
          licence to display, index, and link to your clip on the platform. You retain ownership of
          your content. This licence terminates when the clip is removed from the platform.
        </p>
        <p>
          Submitted clips are subject to moderation review before being publicly listed. We reserve
          the right to decline, remove, or re-categorise any submission at our discretion.
        </p>
      </Section>

      <Section id="conduct" title="3. Acceptable Use">
        <p>You agree not to use the Service to:</p>
        <ul className="list-none space-y-1.5 pl-4">
          <li>→ Submit clips you do not own or have permission to share.</li>
          <li>→ Submit content containing hate speech, harassment, threats, or content depicting real-world violence.</li>
          <li>→ Impersonate another person, streamer, or organisation.</li>
          <li>→ Attempt to circumvent moderation, access controls, or rate limits.</li>
          <li>→ Use automated tools, bots, or scrapers to access or extract data without prior written consent.</li>
          <li>→ Interfere with the integrity or performance of the platform.</li>
          <li>→ Engage in any activity that violates applicable laws or regulations.</li>
        </ul>
      </Section>

      <Section id="dmca" title="4. Copyright &amp; DMCA">
        <p>
          PlunderClips respects intellectual property rights. We respond to valid notices of claimed
          copyright infringement under the Digital Millennium Copyright Act (DMCA) and equivalent
          laws.
        </p>
        <p>
          If you believe content on PlunderClips infringes your copyright, please send a written
          notice to <a href={`mailto:${CONTACT_EMAIL}`} className="text-teal hover:text-teal/70 transition-colors">{CONTACT_EMAIL}</a> including:
        </p>
        <ul className="list-none space-y-1.5 pl-4">
          <li>→ Identification of the copyrighted work you claim has been infringed.</li>
          <li>→ The URL of the allegedly infringing content on PlunderClips.</li>
          <li>→ Your contact information and a statement that you have a good faith belief the use is not authorised.</li>
          <li>→ A statement, under penalty of perjury, that the information is accurate and that you are the copyright owner or authorised to act on their behalf.</li>
        </ul>
        <p>
          We will process valid DMCA notices promptly and remove infringing content where required.
          Repeat infringers&apos; accounts will be terminated.
        </p>
      </Section>

      <Section id="third-party" title="5. Third-Party Services">
        <p>
          Clips on PlunderClips are hosted by and played through third-party services: Twitch,
          YouTube, and Medal.tv. Your use of embedded content is subject to those services&apos;
          respective terms and privacy policies.
        </p>
        <p>
          Sea of Thieves is a registered trademark of Rare Ltd. PlunderClips is an independent fan
          platform and is not affiliated with, endorsed by, or sponsored by Rare Ltd., Xbox Game
          Studios, or Microsoft Corporation.
        </p>
        <p>
          We use the Twitch API and YouTube Data API to facilitate authentication and clip data
          retrieval. These integrations are governed by Twitch&apos;s and Google&apos;s developer
          terms respectively.
        </p>
      </Section>

      <Section id="moderation" title="6. Moderation &amp; Roles">
        <p>
          PlunderClips operates a role-based community system. Role assignments (e.g. Partner,
          Verified, Featured) are made at our sole discretion and may be changed or revoked at any
          time without notice.
        </p>
        <p>
          Moderation decisions regarding clip approvals, declines, and account actions are final
          unless explicitly reversed by an administrator. You may contact us at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-teal hover:text-teal/70 transition-colors">{CONTACT_EMAIL}</a> to
          dispute a decision.
        </p>
      </Section>

      <Section id="privacy" title="7. Privacy">
        <p>
          Your use of PlunderClips is also governed by our{' '}
          <Link href="/privacy" className="text-teal hover:text-teal/70 transition-colors">Privacy Policy</Link>,
          which is incorporated into these Terms by reference. By using the Service, you consent to
          the collection and use of information as described therein.
        </p>
      </Section>

      <Section id="disclaimers" title="8. Disclaimers">
        <p>
          The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, express
          or implied. We do not warrant that the Service will be uninterrupted, error-free, or free
          from harmful components.
        </p>
        <p>
          We do not endorse or verify the accuracy of user-submitted content. PlunderClips is not
          responsible for any content submitted by users, including clips, descriptions, or tags.
        </p>
      </Section>

      <Section id="liability" title="9. Limitation of Liability">
        <p>
          To the fullest extent permitted by applicable law, PlunderClips and its operators shall
          not be liable for any indirect, incidental, special, consequential, or punitive damages
          arising from your use of — or inability to use — the Service, even if advised of the
          possibility of such damages.
        </p>
        <p>
          Our total liability to you for any claim arising under these Terms shall not exceed £50
          (fifty British pounds).
        </p>
      </Section>

      <Section id="changes" title="10. Changes to These Terms">
        <p>
          We may update these Terms from time to time. When we do, we will revise the effective
          date at the top of this page. Continued use of the Service after changes are posted
          constitutes your acceptance of the revised Terms.
        </p>
        <p>
          Material changes will be announced on the platform where reasonably practicable.
        </p>
      </Section>

      <Section id="termination" title="11. Termination">
        <p>
          You may stop using the Service at any time. You may request deletion of your account and
          associated data by contacting us at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-teal hover:text-teal/70 transition-colors">{CONTACT_EMAIL}</a>.
        </p>
        <p>
          We may terminate or suspend your access immediately, without notice, for any conduct that
          we determine, in our sole discretion, violates these Terms or is harmful to other users,
          us, or third parties.
        </p>
      </Section>

      <Section id="governing-law" title="12. Governing Law">
        <p>
          These Terms are governed by and construed in accordance with the laws of England and
          Wales. Any disputes arising under these Terms shall be subject to the exclusive
          jurisdiction of the courts of England and Wales.
        </p>
      </Section>

      <Section id="contact" title="13. Contact">
        <p>
          If you have any questions about these Terms, please contact us at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-teal hover:text-teal/70 transition-colors">{CONTACT_EMAIL}</a>.
        </p>
      </Section>

      {/* Footer nav */}
      <div className="mt-12 pt-8 border-t border-white/5 flex items-center gap-6">
        <Link href="/" className="text-xs font-display tracking-wider text-white/20 hover:text-teal transition-colors">
          ← Home
        </Link>
        <Link href="/privacy" className="text-xs font-display tracking-wider text-white/20 hover:text-teal transition-colors">
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}
