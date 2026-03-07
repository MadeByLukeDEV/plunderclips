import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — SoT Clips',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-12">
        <p className="font-display text-xs tracking-[0.3em] text-teal mb-2">LEGAL</p>
        <h1 className="font-display text-6xl font-900 text-white">Privacy Policy</h1>
        <div className="teal-divider mt-4 mb-4" />
        <p className="text-white/30 text-sm font-mono">Last updated: March 2026</p>
      </div>

      <div className="space-y-12 font-body text-white/60 leading-relaxed text-[15px]">

        {/* 1 */}
        <section>
          <h2 className="font-display text-2xl font-700 text-white mb-3 tracking-wide">1. Who We Are</h2>
          <div className="teal-divider mb-4" />
          <p>
            plunderclips is a community platform for Sea of Thieves streamers to share and discover Twitch clips.
            For any privacy-related questions or requests, contact us at:
          </p>
          <div className="mt-4 sot-card rounded p-4 border-l-2 border-l-teal">
            <a href="mailto:business@madebyluke.dev" className="font-mono text-teal text-base hover:underline">
              business@madebyluke.dev
            </a>
          </div>
        </section>

        {/* 2 */}
        <section>
          <h2 className="font-display text-2xl font-700 text-white mb-3 tracking-wide">2. What Data We Store</h2>
          <div className="teal-divider mb-4" />
          <p className="mb-5">When you register and use plunderclips, the following data is collected and stored:</p>
          <div className="space-y-3">
            {[
              {
                title: 'Twitch Account Data',
                items: [
                  'Twitch ID (unique numeric identifier)',
                  'Twitch username (login)',
                  'Display name',
                  'Profile picture URL',
                  'Email address (if provided by Twitch)',
                ],
              },
              {
                title: 'Session Data',
                items: [
                  'Encrypted JWT session token (httpOnly cookie)',
                  'Session creation and expiry timestamp (3-day lifetime)',
                ],
              },
              {
                title: 'Clip Metadata (on submission)',
                items: [
                  'Twitch Clip ID and URL',
                  'Clip title and thumbnail URL',
                  'Broadcaster name and ID',
                  'View count and duration (from Twitch API)',
                  'Selected tags (e.g. Funny, Kill, Highlight)',
                  'Submission timestamp, review status, and moderation notes',
                ],
              },
            ].map(block => (
              <div key={block.title} className="sot-card rounded p-4">
                <p className="font-display text-xs text-teal tracking-widest mb-3">{block.title.toUpperCase()}</p>
                <ul className="space-y-1.5">
                  {block.items.map(item => (
                    <li key={item} className="flex gap-2 text-sm">
                      <span className="text-teal flex-shrink-0">→</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* 3 */}
        <section>
          <h2 className="font-display text-2xl font-700 text-white mb-3 tracking-wide">3. How We Use Your Data</h2>
          <div className="teal-divider mb-4" />
          <p className="mb-4">Your data is used exclusively for the following purposes:</p>
          <ul className="space-y-2">
            {[
              'Authentication and account management via Twitch OAuth 2.0',
              'Displaying your profile and submitted clips on the platform',
              'Verifying that you are a registered streamer before clips from your channel are accepted',
              'Moderation and review of submitted clips by the admin team',
              'Operation, security, and stability of the platform',
            ].map(item => (
              <li key={item} className="flex gap-2 text-sm">
                <span className="text-teal flex-shrink-0 mt-0.5">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-white/40">
            Your data is never sold or shared with third parties — except for the Twitch API which handles authentication.
          </p>
        </section>

        {/* 4 */}
        <section>
          <h2 className="font-display text-2xl font-700 text-white mb-3 tracking-wide">4. Consent & Clip Rights</h2>
          <div className="teal-divider mb-4" />
          <div className="sot-card rounded p-5 border-l-2 border-l-teal mb-5">
            <p className="font-display text-xs text-teal tracking-widest mb-3">IMPORTANT</p>
            <p className="text-white/80 text-sm leading-relaxed">
              By registering on plunderclips, you explicitly grant us permission to display, store as metadata,
              and editorially organize clips from your Twitch channel — for example by tagging them with
              categories like Funny, Kill, or Highlight. This applies to all clips submitted by you or
              other registered users where your channel is the broadcaster.
            </p>
          </div>
          <p className="mb-3">This permission covers:</p>
          <ul className="space-y-2 mb-5">
            {[
              'Embedding the clip via the official Twitch embed player',
              'Public display of the clip title, thumbnail, duration, and view count',
              'Tagging clips with community-selected categories',
              'Public visibility after approval by the moderation team',
            ].map(item => (
              <li key={item} className="flex gap-2 text-sm">
                <span className="text-teal flex-shrink-0 mt-0.5">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-white/40">
            Clip video files are <strong className="text-white/60">not</strong> stored on our servers.
            All video content is served exclusively through Twitch's infrastructure.
            We only store clip metadata and the clip ID.
          </p>
        </section>

        {/* 5 */}
        <section>
          <h2 className="font-display text-2xl font-700 text-white mb-3 tracking-wide">5. Registered Streamers Only</h2>
          <div className="teal-divider mb-4" />
          <p className="mb-4">
            plunderclips only accepts clips from streamers who have actively registered on the platform. This means:
          </p>
          <ul className="space-y-2 mb-4">
            {[
              'Clips from unregistered broadcasters are automatically rejected by the system',
              'By registering, you actively and knowingly consent to your clips being featured',
              'You remain in full control of whether your clips appear on this platform at any time',
            ].map(item => (
              <li key={item} className="flex gap-2 text-sm">
                <span className="text-teal flex-shrink-0 mt-0.5">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-white/40">
            This system ensures that no streamer appears on the platform without their own consent.
          </p>
        </section>

        {/* 6 */}
        <section>
          <h2 className="font-display text-2xl font-700 text-white mb-3 tracking-wide">6. Revoking Consent & Data Deletion</h2>
          <div className="teal-divider mb-4" />
          <p className="mb-4">
            You can revoke your consent at any time and without giving a reason. Upon confirmed revocation:
          </p>
          <ul className="space-y-2 mb-6">
            {[
              'All personal data associated with your account will be deleted from our database',
              'All clips featuring you as the broadcaster will be removed from the platform',
              'All active sessions will be invalidated immediately',
              'Your account will be permanently deactivated',
            ].map(item => (
              <li key={item} className="flex gap-2 text-sm">
                <span className="text-teal flex-shrink-0 mt-0.5">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="sot-card rounded p-5 border-l-2 border-l-teal">
            <p className="font-display text-xs tracking-widest text-teal mb-3">HOW TO REVOKE</p>
            <p className="text-sm text-white/70 mb-4 leading-relaxed">
              Send an email with the subject{' '}
              <span className="font-mono text-white/90 bg-white/5 px-1.5 py-0.5 rounded">Data Deletion</span>{' '}
              and your Twitch username to:
            </p>
            <a href="mailto:business@madebyluke.dev" className="font-mono text-teal hover:underline text-lg block mb-3">
              business@madebyluke.dev
            </a>
            <p className="text-xs text-white/25">
              We will process your request within 14 business days and confirm deletion via email.
            </p>
          </div>
        </section>

        {/* 7 */}
        <section>
          <h2 className="font-display text-2xl font-700 text-white mb-3 tracking-wide">7. Cookies & Sessions</h2>
          <div className="teal-divider mb-4" />
          <p className="mb-4">
            We use a single technically necessary cookie that is essential for the login flow:
          </p>
          <div className="sot-card rounded overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 font-display text-xs tracking-widest text-white/30">Name</th>
                  <th className="text-left px-4 py-3 font-display text-xs tracking-widest text-white/30">Purpose</th>
                  <th className="text-left px-4 py-3 font-display text-xs tracking-widest text-white/30">Lifetime</th>
                  <th className="text-left px-4 py-3 font-display text-xs tracking-widest text-white/30">Type</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-3 font-mono text-teal">auth-token</td>
                  <td className="px-4 py-3 text-white/50">Session authentication</td>
                  <td className="px-4 py-3 text-white/50">3 days</td>
                  <td className="px-4 py-3 text-white/50">httpOnly, Secure</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-white/30">
            No tracking cookies, analytics, or advertising cookies are used.
          </p>
        </section>

        {/* 8 */}
        <section>
          <h2 className="font-display text-2xl font-700 text-white mb-3 tracking-wide">8. Third Party — Twitch</h2>
          <div className="teal-divider mb-4" />
          <p className="mb-3">
            Authentication is handled via <span className="text-white/80">Twitch OAuth 2.0</span> (Twitch Interactive, Inc., San Francisco, USA).
            When logging in, you are redirected to Twitch where they process your credentials.
            After a successful login, Twitch sends us your Twitch ID, username, display name,
            profile picture, and optionally your email address.
          </p>
          <p className="text-sm text-white/40">
            Learn more about how Twitch handles your data:{' '}
            <a href="https://www.twitch.tv/p/en/legal/privacy-notice/" target="_blank" rel="noopener noreferrer"
              className="text-teal hover:underline">
              Twitch Privacy Notice →
            </a>
          </p>
        </section>

        {/* 9 */}
        <section>
          <h2 className="font-display text-2xl font-700 text-white mb-3 tracking-wide">9. Your Rights</h2>
          <div className="teal-divider mb-4" />
          <p className="mb-4">You have the following rights regarding your personal data:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {[
              { right: 'Access', desc: 'Request a copy of all data we hold about you' },
              { right: 'Rectification', desc: 'Correct any inaccurate data' },
              { right: 'Erasure', desc: 'Request complete deletion of your data' },
              { right: 'Restriction', desc: 'Limit how we process your data' },
              { right: 'Objection', desc: 'Object to the processing of your data' },
              { right: 'Portability', desc: 'Export your data in a common format' },
            ].map(r => (
              <div key={r.right} className="sot-card rounded p-3">
                <p className="font-display text-xs text-teal tracking-wider mb-1">{r.right.toUpperCase()}</p>
                <p className="text-xs text-white/40">{r.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-white/40">
            To exercise any of these rights, contact us at{' '}
            <a href="mailto:business@madebyluke.dev" className="text-teal hover:underline font-mono">
              business@madebyluke.dev
            </a>
          </p>
        </section>

        {/* 10 */}
        <section>
          <h2 className="font-display text-2xl font-700 text-white mb-3 tracking-wide">10. Changes to This Policy</h2>
          <div className="teal-divider mb-4" />
          <p className="text-sm">
            We reserve the right to update this Privacy Policy as needed. The date of the last update is shown
            at the top of this page. For significant changes, registered users will be notified by email
            where an address is on file.
          </p>
        </section>

        {/* Nav */}
        <div className="pt-6 border-t border-white/5">
          <Link href="/" className="btn-teal px-5 py-2 rounded text-sm inline-block">← Back</Link>
        </div>

      </div>
    </div>
  );
}