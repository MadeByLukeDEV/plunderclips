'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/providers/AuthProvider';
import { usePathname } from 'next/navigation';
import { LogOut, Shield, Swords, LayoutDashboard, Compass, Youtube, Coffee, User } from 'lucide-react';

export default function Navbar() {
  const { user, loading } = useAuth();
  const path = usePathname();
  const active = (href: string) => path === href ? 'text-teal' : '';

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-sot-bg/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
      <div className='flex items-center justify-between gap-3'>
        {/* Logo */}
        <Link href="/">
          <span className="font-display text-xl font-900 tracking-widest text-white">
            PLUNDER<span className="text-teal">CLIPS</span>
          </span>
        </Link >
      </div>


        
        

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className={`nav-link ${active('/')}`}>
            <Compass className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />Explore
          </Link>
          <Link href="/streamers" className={`nav-link ${active('/streamers')}`}>
            <User className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />Streamers
          </Link>
          {user && (
            <>
              <Link href="/submit" className={`nav-link ${active('/submit')}`}>
                <Swords className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />Submit
              </Link>
              <Link href="/dashboard" className={`nav-link ${active('/dashboard')}`}>
                <LayoutDashboard className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />Dashboard
              </Link>
              {(user.role === 'ADMIN' || user.role === 'MODERATOR') && (
                <Link href="/admin" className={`nav-link text-teal ${active('/admin')}`}>
                  <Shield className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />Admin
                </Link>
              )}
            </>
          )}
        </div>

        {/* Right side — Leave/Login always visible */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-20 h-8 skeleton rounded" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2">
                {user.profileImage && (
                  <Image src={user.profileImage} alt={user.displayName} priority width={28} height={28}
                    className="rounded-full border border-teal/40" />
                )}
                <span className="font-display text-sm text-white/80 tracking-wide">{user.displayName}</span>
              </div>
              <a href="/api/auth/logout"
                className="flex items-center gap-1.5 px-3 py-1.5 border border-white/10 text-white/40 hover:border-red-500/50 hover:text-red-400 font-display text-xs rounded transition-all">
                <LogOut className="w-3 h-3" /><span>Leave</span>
              </a>
            </div>
          ) : (
            <a href="/api/auth/login" className="btn-teal-solid px-4 py-2 rounded text-sm">
              Sign in with Twitch
            </a>
          )}
        </div>
      </div>

      {/* Mobile bottom tab bar — only when logged in */}
      {user && (
        <div className="flex md:hidden border-t border-white/5 bg-sot-bg/95">
          {[
            { href: '/', icon: <Compass className="w-4 h-4" />, label: 'Explore' },
            { href: '/submit', icon: <Swords className="w-4 h-4" />, label: 'Submit' },
            { href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard' },
            ...(user.role === 'ADMIN' || user.role === 'MODERATOR'
              ? [{ href: '/admin', icon: <Shield className="w-4 h-4" />, label: 'Admin' }]
              : []),
          ].map(item => (
            <Link key={item.href} href={item.href}
              className={`flex-1 flex flex-col items-center py-2.5 gap-1 text-xs font-display tracking-wider transition-colors ${
                path === item.href ? 'text-teal' : 'text-white/30 hover:text-white/60'
              }`}>
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
