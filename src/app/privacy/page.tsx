// src/app/privacy/page.tsx — SERVER COMPONENT
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | PlunderClips',
  description: 'Read the PlunderClips Privacy Policy — how we collect, use, and protect your personal data on our Sea of Thieves community clip platform.',
  alternates: { canonical: `${process.env.NEXTAUTH_URL || 'https://plunderclips.com'}/privacy` },
  robots: { index: true, follow: false },
};

const LAST_UPDATED  = 'May 7, 2025';
const CONTACT_EMAIL = 'hello@plunderclips.com';

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12">
      <h2 className="font-display text-xl font-700 text-white tracking-wide mb-3">{title}</h2>
      <div className="teal-divider mb-5" />
      <div className="space-y-4 text-white/50 text-sm font-body leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function InfoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="sot-card rounded p-4">
      <p className="font-display text-xs text-teal tracking-widest mb-3">{label}</p>
      {children}
    </div>
  );
}

function Arrow({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 text-sm">
      <span className="text-teal flex-shrink-0 mt-0.5">→</span>
      <span>{children}</span>
    </li>
  );
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-14">

      {/* Header */}
      <div className="mb-10">
        <p className="font-display text-xs tracking-[0.3em] text-teal mb-2">LEGAL</p>
        <h1 className="font-display text-5xl font-900 text-white">Privacy Policy</h1>
        <div className="teal-divider mt-3 mb-4" />
        <p className="text-white/30 text-xs font-mono">Last updated: {LAST_UPDATED}</p>
      </div>

      {/* Intro */}
      <p className="text-white/40 text-sm font-body leading-relaxed mb-10">
        PlunderClips (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) takes your privacy seriously.
        This policy explains what data we collect when you use PlunderClips, why we collect it,
        and how you can control it. PlunderClips is an independent fan platform and is not affiliated
        with Rare Ltd., Xbox Game Studios, or Microsoft Corporation.
      </p>

      <Section id="who-we-are" title="1. Who We Are">
        <p>
          PlunderClips is a community clip platform for Sea of Thieves. Registered streamers submit
          and showcase their best Twitch, YouTube, and Medal.tv moments for the SoT community to discover.
        </p>
        <p>For any privacy-related questions or requests, contact us at:</p>
        <InfoCard label="DATA CONTACT">
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-mono text-teal text-base hover:underline">
            {CONTACT_EMAIL}
          </a>
        </InfoCard>
      </Section>

      <Section id="data-collected" title="2. What Data We Collect">
        <p>When you register and use PlunderClips, the following data is collected and stored:</p>

        <InfoCard label="TWITCH ACCOUNT DATA">
          <ul className="space-y-1.5">
            <Arrow>Twitch ID (unique numeric identifier)</Arrow>
            <Arrow>Twitch username (login)</Arrow>
            <Arrow>Display name</Arrow>
            <Arrow>Profile picture URL (cached via Twitch CDN)</Arrow>
            <Arrow>Email address (if provided by Twitch — optional)</Arrow>
          </ul>
        </InfoCard>

        <InfoCard label="YOUTUBE CHANNEL DATA (OPTIONAL — ONLY IF YOU LINK YOUR CHANNEL)">
          <ul className="space-y-1.5">
            <Arrow>YouTube channel ID</Arrow>
            <Arrow>YouTube channel name</Arrow>
          </ul>
          <p className="text-xs text-white/30 mt-3">
            This data is retrieved via Google OAuth when you choose to link your YouTube channel in
            Settings. We never store access tokens or refresh tokens — only the channel ID and name.
          </p>
        </InfoCard>

        <InfoCard label="SESSION DATA">
          <ul className="space-y-1.5">
            <Arrow>Encrypted JWT session token (stored in an httpOnly cookie)</Arrow>
            <Arrow>Session creation and expiry timestamp (3-day lifetime)</Arrow>
          </ul>
        </InfoCard>

        <InfoCard label="CLIP METADATA (ON SUBMISSION)">
          <ul className="space-y-1.5">
            <Arrow>Clip ID, URL, and platform (Twitch, YouTube, or Medal.tv)</Arrow>
            <Arrow>Clip title and thumbnail URL</Arrow>
            <Arrow>Broadcaster / channel name and ID</Arrow>
            <Arrow>View count and duration (from platform APIs)</Arrow>
            <Arrow>Selected tags (e.g. Funny, Kill, Highlight)</Arrow>
            <Arrow>Submission timestamp, review status, and moderation notes</Arrow>
          </ul>
        </InfoCard>
      </Section>

      <Section id="how-we-use" title="3. How We Use Your Data">
        <p>Your data is used exclusively for the following purposes:</p>
        <ul className="space-y-2">
          <Arrow>Authentication and account management via Twitch OAuth 2.0</Arrow>
          <Arrow>Displaying your profile, role, and submitted clips on the platform</Arrow>
          <Arrow>Verifying clip ownership to reduce manual moderation overhead</Arrow>
          <Arrow>Determining live-streaming status for the live streamers section</Arrow>
          <Arrow>Moderation and review of submitted clips by the admin team</Arrow>
          <Arrow>Operation, security, and stability of the platform</Arrow>
        </ul>
        <p className="text-white/30">
          Your data is <strong className="text-white/50">never sold</strong> and is not shared with
          third parties beyond what is required for authentication (Twitch, Google).
        </p>
      </Section>

      <Section id="lawful-basis" title="4. Lawful Basis for Processing (GDPR)">
        <p>
          Where the General Data Protection Regulation (GDPR) applies, we process your personal
          data on the following lawful bases:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { basis: 'Contract', desc: 'Processing your Twitch account data is necessary to provide the service you signed up for.' },
            { basis: 'Consent', desc: 'Linking a YouTube channel or Medal.tv account is entirely voluntary and based on your explicit consent.' },
            { basis: 'Legitimate Interest', desc: 'Moderation logs and security measures to maintain platform integrity.' },
            { basis: 'Legal Obligation', desc: 'Retaining records as required by applicable law (e.g. DMCA compliance).' },
          ].map(r => (
            <div key={r.basis} className="sot-card rounded p-3">
              <p className="font-display text-xs text-teal tracking-wider mb-1">{r.basis.toUpperCase()}</p>
              <p className="text-xs text-white/40">{r.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="consent" title="5. Consent &amp; Clip Rights">
        <InfoCard label="IMPORTANT">
          <p className="text-white/70 text-sm leading-relaxed">
            By registering on PlunderClips, you explicitly grant us permission to display, store as
            metadata, and editorially organise clips from your channel — including tagging them with
            categories like Funny, Kill, or Highlight. This applies to clips submitted by you or by
            other registered users where your channel is the broadcaster.
          </p>
        </InfoCard>
        <p>This permission covers:</p>
        <ul className="space-y-1.5">
          <Arrow>Embedding clips via the official platform player (Twitch, YouTube, Medal.tv)</Arrow>
          <Arrow>Public display of clip title, thumbnail, duration, and view count</Arrow>
          <Arrow>Tagging clips with community-selected categories</Arrow>
          <Arrow>Public visibility after approval by the moderation team</Arrow>
        </ul>
        <p className="text-white/30">
          Clip video files are <strong className="text-white/50">not</strong> stored on our servers.
          All video content is served directly through the originating platform&apos;s infrastructure.
          We only store clip metadata and the clip ID.
        </p>
      </Section>

      <Section id="registered-only" title="6. Registered Streamers Only">
        <p>
          PlunderClips only accepts clips from streamers who have actively registered on the
          platform. This means:
        </p>
        <ul className="space-y-1.5">
          <Arrow>Clips from unregistered broadcasters are automatically rejected</Arrow>
          <Arrow>By registering, you actively and knowingly consent to your clips being featured</Arrow>
          <Arrow>You remain in full control of whether your clips appear on this platform at any time</Arrow>
        </ul>
        <p className="text-white/30">
          This system ensures that no streamer appears on the platform without their own consent.
        </p>
      </Section>

      <Section id="deletion" title="7. Revoking Consent &amp; Data Deletion">
        <p>You can revoke your consent at any time and without giving a reason. Upon confirmed revocation:</p>
        <ul className="space-y-1.5">
          <Arrow>All personal data associated with your account will be deleted from our database</Arrow>
          <Arrow>All clips where you are the broadcaster will be removed from the platform</Arrow>
          <Arrow>All active sessions will be invalidated immediately</Arrow>
          <Arrow>Your account will be permanently deactivated</Arrow>
        </ul>
        <InfoCard label="HOW TO REVOKE">
          <p className="text-sm text-white/70 mb-4 leading-relaxed">
            Send an email with the subject{' '}
            <span className="font-mono text-white/90 bg-white/5 px-1.5 py-0.5 rounded">Data Deletion</span>{' '}
            and your Twitch username to:
          </p>
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-mono text-teal hover:underline text-base block mb-3">
            {CONTACT_EMAIL}
          </a>
          <p className="text-xs text-white/25">
            We will process your request within 14 business days and confirm deletion via email.
          </p>
        </InfoCard>
      </Section>

      <Section id="cookies" title="8. Cookies &amp; Temporary Tokens">
        <p>We use only technically necessary cookies. No tracking, analytics, or advertising cookies are used.</p>
        <div className="sot-card rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-3 font-display text-xs tracking-widest text-white/30">Name</th>
                <th className="text-left px-4 py-3 font-display text-xs tracking-widest text-white/30">Purpose</th>
                <th className="text-left px-4 py-3 font-display text-xs tracking-widest text-white/30">Lifetime</th>
                <th className="text-left px-4 py-3 font-display text-xs tracking-widest text-white/30">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="px-4 py-3 font-mono text-teal">auth-token</td>
                <td className="px-4 py-3 text-white/50">Session authentication</td>
                <td className="px-4 py-3 text-white/50">3 days</td>
                <td className="px-4 py-3 text-white/50">httpOnly, Secure</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-teal">yt-oauth-state</td>
                <td className="px-4 py-3 text-white/50">CSRF protection during YouTube OAuth</td>
                <td className="px-4 py-3 text-white/50">10 minutes</td>
                <td className="px-4 py-3 text-white/50">httpOnly, Secure</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="third-parties" title="9. Third-Party Services">
        <p>
          PlunderClips integrates with the following third-party services. Each has its own privacy
          policy which governs how they handle your data:
        </p>
        <div className="space-y-3">
          <InfoCard label="TWITCH (AUTHENTICATION & CLIP DATA)">
            <p className="text-sm text-white/50 mb-2">
              Authentication is handled via Twitch OAuth 2.0 (Twitch Interactive, Inc., San Francisco, USA).
              When you log in, Twitch processes your credentials and sends us your profile information.
            </p>
            <a href="https://www.twitch.tv/p/en/legal/privacy-notice/" target="_blank" rel="noopener noreferrer"
              className="text-teal hover:text-teal/70 text-xs font-mono transition-colors">
              Twitch Privacy Notice →
            </a>
          </InfoCard>
          <InfoCard label="GOOGLE / YOUTUBE (OPTIONAL — CHANNEL LINKING ONLY)">
            <p className="text-sm text-white/50 mb-2">
              If you choose to link your YouTube channel, you are redirected to Google to authorise
              read-only access to your YouTube channel information. We receive only your channel ID
              and channel name — no access tokens are stored after the linking process completes.
            </p>
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer"
              className="text-teal hover:text-teal/70 text-xs font-mono transition-colors">
              Google Privacy Policy →
            </a>
          </InfoCard>
          <InfoCard label="MEDAL.TV (CLIP SUBMISSION ONLY)">
            <p className="text-sm text-white/50">
              Medal.tv clips are accepted by URL submission only. We do not have a Medal.tv API
              integration and do not collect any Medal.tv account data. Clips from Medal.tv always
              undergo manual moderation review.
            </p>
          </InfoCard>
        </div>
      </Section>

      <Section id="your-rights" title="10. Your Rights">
        <p>You have the following rights regarding your personal data:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { right: 'Access',       desc: 'Request a copy of all data we hold about you' },
            { right: 'Rectification', desc: 'Correct any inaccurate data' },
            { right: 'Erasure',      desc: 'Request complete deletion of your data' },
            { right: 'Restriction',  desc: 'Limit how we process your data' },
            { right: 'Objection',    desc: 'Object to the processing of your data' },
            { right: 'Portability',  desc: 'Export your data in a common format' },
          ].map(r => (
            <div key={r.right} className="sot-card rounded p-3">
              <p className="font-display text-xs text-teal tracking-wider mb-1">{r.right.toUpperCase()}</p>
              <p className="text-xs text-white/40">{r.desc}</p>
            </div>
          ))}
        </div>
        <p>
          To exercise any of these rights, contact us at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-teal hover:text-teal/70 font-mono transition-colors">
            {CONTACT_EMAIL}
          </a>. We will respond within 30 days.
        </p>
      </Section>

      <Section id="data-retention" title="11. Data Retention">
        <p>We retain your data for as long as your account is active. Specifically:</p>
        <ul className="space-y-1.5">
          <Arrow>Account data is retained until you request deletion.</Arrow>
          <Arrow>Session tokens expire automatically after 3 days.</Arrow>
          <Arrow>Temporary OAuth state cookies expire after 10 minutes.</Arrow>
          <Arrow>Moderation logs may be retained for up to 12 months for platform integrity purposes.</Arrow>
          <Arrow>Clip metadata from removed clips is deleted promptly following a valid removal request.</Arrow>
        </ul>
      </Section>

      <Section id="changes" title="12. Changes to This Policy">
        <p>
          We may update this Privacy Policy as the platform evolves. The date of the last update is
          shown at the top of this page. For significant changes, we will announce them on the
          platform where reasonably practicable.
        </p>
        <p>
          Continued use of PlunderClips after a policy update constitutes acceptance of the revised
          policy.
        </p>
      </Section>

      {/* Footer nav */}
      <div className="mt-12 pt-8 border-t border-white/5 flex items-center gap-6">
        <Link href="/" className="text-xs font-display tracking-wider text-white/20 hover:text-teal transition-colors">
          ← Home
        </Link>
        <Link href="/terms" className="text-xs font-display tracking-wider text-white/20 hover:text-teal transition-colors">
          Terms of Service
        </Link>
      </div>
    </div>
  );
}
