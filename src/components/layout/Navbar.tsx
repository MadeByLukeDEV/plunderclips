'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/providers/AuthProvider';
import { usePathname } from 'next/navigation';
import { LogOut, Shield, Swords, LayoutDashboard, Compass, User, Youtube } from 'lucide-react';

const YT_CHANNEL = 'https://www.youtube.com/@PlunderClips';

const NAV_LINKS = [
  { href: '/',           icon: Compass,         label: 'Explore' },
  { href: '/streamers',  icon: User,            label: 'Streamers' },
];

const AUTH_LINKS = [
  { href: '/submit',    icon: Swords,          label: 'Submit' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
];

export default function Navbar() {
  const { user, loading } = useAuth();
  const path = usePathname();
  const isActive = (href: string) => path === href;

  const allDesktopLinks = [
    ...NAV_LINKS,
    ...(user ? AUTH_LINKS : []),
    ...(user?.role === 'ADMIN' || user?.role === 'MODERATOR'
      ? [{ href: '/admin', icon: Shield, label: 'Admin' }]
      : []),
  ];

  const allMobileLinks = allDesktopLinks;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-sot-bg/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-fluid h-14 flex items-center justify-between gap-6">

        {/* Logo */}
        <Link href="/" className="flex-shrink-0 group">
          <span className="font-display text-[clamp(1rem,2.5vw,1.2rem)] font-900 tracking-widest text-white group-hover:text-white/90 transition-colors">
            PLUNDER<span className="text-teal group-hover:drop-shadow-[0_0_8px_rgba(0,229,192,0.6)] transition-all">CLIPS</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6 flex-1">
          {allDesktopLinks.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link flex items-center gap-1.5 ${isActive(href) ? 'text-teal' : ''}`}
            >
              <Icon className="w-3.5 h-3.5 opacity-70" />
              {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* YouTube channel link */}
          <a
            href={YT_CHANNEL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="PlunderClips YouTube Channel"
            className="hidden md:flex items-center justify-center w-8 h-8 rounded text-white/25 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
          >
            <Youtube className="w-4 h-4" />
          </a>

          {loading ? (
            <div className="w-24 h-8 skeleton rounded" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2">
                {user.profileImage && (
                  <Image
                    src={user.profileImage}
                    alt={user.displayName}
                    priority
                    width={28}
                    height={28}
                    className="rounded-full border border-teal/30"
                  />
                )}
                <span className="font-display text-[0.8rem] text-white/70 tracking-wide">
                  {user.displayName}
                </span>
              </div>
              <a
                href="/api/auth/logout"
                className="flex items-center gap-1.5 px-3 py-1.5 border border-white/8 text-white/35 hover:border-red-500/40 hover:text-red-400 font-display text-xs rounded transition-all"
              >
                <LogOut className="w-3 h-3" />
                <span>Leave</span>
              </a>
            </div>
          ) : (
            <a href="/api/auth/login" className="btn-teal-solid px-4 py-2 rounded text-sm">
              Join the Crew
            </a>
          )}
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <div className="flex md:hidden border-t border-white/5 bg-sot-bg/98 backdrop-blur-md">
        {allMobileLinks.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 text-[10px] font-display tracking-wider transition-colors ${
              isActive(href) ? 'text-teal' : 'text-white/30 hover:text-white/60'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </Link>
        ))}
        {/* YouTube on mobile tab bar */}
        <a
          href={YT_CHANNEL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex flex-col items-center py-2.5 gap-0.5 text-[10px] font-display tracking-wider text-white/25 hover:text-red-400 transition-colors"
        >
          <Youtube className="w-4 h-4" />
          <span>YouTube</span>
        </a>
      </div>
    </nav>
  );
}
