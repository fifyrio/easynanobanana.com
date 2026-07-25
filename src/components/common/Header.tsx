'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from './LanguageSwitcher';
import { buildAiEffectGroups, buildVideoDropdown } from '@/lib/nav-data';

const APP_STORE_URL = 'https://apps.apple.com/us/app/vido-ai-photo-to-video/id6758744274';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAppBanner, setShowAppBanner] = useState(false);
  const { user, profile, loading, signInWithGoogle, signOut } = useAuth();

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('appBannerDismissed') !== 'true') {
      setShowAppBanner(true);
    }
  }, []);

  const dismissAppBanner = () => {
    setShowAppBanner(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('appBannerDismissed', 'true');
    }
  };
  
  const t = useTranslations('common');
  const tNav = useTranslations('common.navigation');
  const tHeader = useTranslations('common.header');
  const tBtn = useTranslations('common.buttons');

  const aiEffectGroups = buildAiEffectGroups(tNav);

  type DropdownItem = { label: string; href: string; icon: string };
  type DropdownGroup = { label: string; items: DropdownItem[] };
  type NavItem = {
    label: string;
    href: string;
    highlight?: boolean;
    dropdown?: DropdownItem[];
    groups?: DropdownGroup[];
  };

  const navItems: NavItem[] = [
    {
      label: tNav('aiImageEffects'),
      href: '/ai-image-effects/ai-figure-generator',
      groups: aiEffectGroups
    },
    {
      label: tNav('aiVideo'),
      href: '/video/ai-kiss',
      dropdown: buildVideoDropdown(tNav)
    },
    { label: tNav('mcp'), href: '/mcp' },
    { label: tNav('pricing'), href: '/pricing' },
    { label: tNav('freeCredit'), href: '/free-credits', highlight: true }
  ];

  return (
    <header className="bg-white border-b border-[#FFE7A1] sticky top-0 z-50 shadow-[0_20px_60px_rgba(247,201,72,0.2)]">
      {/* Mobile App Download Banner */}
      {showAppBanner && (
        <div className="lg:hidden bg-gradient-to-r from-yellow-400 via-yellow-300 to-orange-300 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={dismissAppBanner}
              className="flex-shrink-0 text-yellow-800/60 hover:text-yellow-900 p-1 -ml-1"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-gray-900">Vido - AI Photo to Video</p>
                <span className="text-xs text-yellow-600">★★★★★</span>
              </div>
              <p className="text-xs text-gray-700">Get More AI Tools & Effects in App</p>
            </div>
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 bg-white text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-1.5 shadow-sm"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              App Store
            </a>
          </div>
        </div>
      )}
      {/* Free Credits Banner */}
      <div className="bg-[#FFD84D] px-4 py-2 text-center text-sm text-slate-900">
        <span>{tHeader('banner.noAccount')} </span>
        <Link href="/free-credits" prefetch={true} className="font-semibold underline hover:no-underline">
          {tHeader('banner.tryFree')}
        </Link>
        <span className="mx-2 text-[#8C6A00]">|</span>
        <Link href="/invite" prefetch={false} className="font-semibold underline hover:no-underline">
          {tHeader('banner.invite')}
        </Link>
        <span> {tHeader('banner.bonus')}</span>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 flex items-center justify-center rounded-2xl bg-[#FFF3B2] border border-[#FFE7A1]">
              <Image src="/images/logo.png" alt="Easy Nano Banana" width={36} height={36} className="rounded-xl" />
            </div>
            <Link href="/" prefetch={false} className="text-xl font-semibold text-slate-900 hover:text-[#C69312] transition-colors">
              Easy Nano Banana
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              item.highlight ? (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className="relative bg-[#FFD84D] text-slate-900 px-4 py-2 rounded-full font-semibold text-sm shadow-[0_15px_40px_rgba(255,216,77,0.3)] transition hover:-translate-y-0.5 hover:bg-[#ffe062]"
                >
                  <span className="relative z-10 flex items-center">
                    💎 {item.label}
                  </span>
                </Link>
              ) : item.groups ? (
                <div
                  key={item.href}
                  className="group"
                >
                  <Link
                    href={item.href}
                    prefetch={false}
                    className="text-slate-600 hover:text-slate-900 transition-colors font-medium flex items-center px-3 py-2"
                  >
                    {item.label}
                    <svg className="w-4 h-4 ml-1 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Link>

                  {/* Mega Menu — anchors to <header> (sticky positioned context), centered in viewport */}
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[min(1120px,calc(100vw-2rem))] max-h-[80vh] overflow-y-auto bg-white rounded-2xl shadow-[0_25px_70px_rgba(247,201,72,0.2)] border border-[#FFE7A1] p-4 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out columns-2 lg:columns-3 xl:columns-4 gap-4"
                  >
                    {item.groups.map((groupItem) => (
                      <div key={groupItem.label} className="break-inside-avoid mb-4">
                        <h3 className="px-3 pb-2 mb-1 text-xs font-bold uppercase tracking-wider text-[#C69312] border-b border-[#FFE7A1]">
                          {groupItem.label}
                        </h3>
                        <ul className="space-y-0.5">
                          {groupItem.items.map((dropdownItem) => (
                            <li key={dropdownItem.href}>
                              <Link
                                href={dropdownItem.href}
                                prefetch={false}
                                className="flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-[#FFF3B2] hover:text-slate-900 transition-colors rounded-lg"
                              >
                                <span className="text-base mr-2">{dropdownItem.icon}</span>
                                <span className="font-medium truncate">{dropdownItem.label}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ) : item.dropdown ? (
                <div
                  key={item.href}
                  className="relative group"
                >
                  <Link
                    href={item.href}
                    prefetch={false}
                    className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium flex items-center px-3 py-2"
                  >
                    {item.label}
                    <svg className="w-4 h-4 ml-1 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Link>

                  {/* Dropdown Menu - CSS-only hover. */}
                  <div
                    className="absolute top-full left-0 mt-1 w-60 bg-white rounded-2xl shadow-[0_25px_70px_rgba(247,201,72,0.2)] border border-[#FFE7A1] py-2 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out"
                  >
                    {item.dropdown.map((dropdownItem) => (
                      <Link
                        key={dropdownItem.href}
                        href={dropdownItem.href}
                        prefetch={false}
                        className="flex items-center px-4 py-3 text-slate-700 hover:bg-[#FFF3B2] hover:text-slate-900 transition-colors rounded-xl"
                      >
                        <span className="text-lg mr-3">{dropdownItem.icon}</span>
                        <span className="font-medium truncate">{dropdownItem.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={item.href === '/pricing'}
                  className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium px-3 py-2"
                >
                  {item.label}
                </Link>
              )
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSwitcher />
            {/* Auth Buttons */}
            <div className="flex items-center space-x-3">
              {loading ? (
                <div className="w-8 h-8 border-2 border-[#FFD84D] border-t-transparent rounded-full animate-spin"></div>
              ) : user ? (
                <div className="flex items-center space-x-3">
                  {/* Credits Display */}
                  {profile && (
                    <div className="flex items-center bg-[#FFF3B2] border border-[#FFE7A1] rounded-full px-3 py-1.5">
                      <span className="text-lg mr-1">💎</span>
                      <span className="text-sm font-semibold text-[#8C6A00]">
                        {profile.credits}
                      </span>
                      <span className="text-xs text-[#C69312] ml-1">credits</span>
                    </div>
                  )}
                  
                  {/* User Menu */}
                  <div className="relative group">
                    <div className="flex items-center space-x-2 bg-white border border-[#FFE7A1] rounded-2xl px-3 py-2 shadow-[0_10px_25px_rgba(240,162,2,0.15)] hover:shadow-[0_15px_40px_rgba(255,216,77,0.3)] transition-shadow cursor-pointer">
                      <div className="w-8 h-8 bg-[#FFD84D] rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-slate-900">
                          {(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-2xl shadow-[0_25px_70px_rgba(247,201,72,0.2)] border border-[#FFE7A1] py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <div className="px-4 py-2 border-b border-[#FFE7A1]">
                        <p className="text-sm font-medium text-slate-900">{user.user_metadata?.full_name || 'User'}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                        {profile && (
                          <p className="text-xs text-[#C69312] font-medium mt-1">
                            💎 {profile.credits} credits
                          </p>
                        )}
                      </div>
                      <Link
                        href="/billing"
                        prefetch={false}
                        className="flex items-center px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-[#FFF3B2]"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        {tNav('billing')}
                      </Link>
                      <Link
                        href="/assets"
                        prefetch={false}
                        className="flex items-center px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-[#FFF3B2]"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        Assets
                      </Link>
                      <Link
                        href="/prompt-history"
                        prefetch={false}
                        className="flex items-center px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-[#FFF3B2]"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {tNav('prompts')}
                      </Link>
                      <Link
                        href="/settings/api-keys"
                        prefetch={false}
                        className="flex items-center px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-[#FFF3B2]"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        {tNav('apiKeys')}
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={signOut}
                        className="w-full text-left justify-start text-slate-600 hover:text-slate-900 hover:bg-[#FFF3B2] rounded-none"
                      >
                        {tBtn('signOut')}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={signInWithGoogle}
                    className="text-slate-600 hover:text-slate-900"
                  >
                    {tBtn('signIn')}
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={signInWithGoogle}
                    className="bg-[#FFD84D] hover:bg-[#ffe062] text-slate-900 font-semibold shadow-[0_15px_40px_rgba(255,216,77,0.3)] border-0"
                  >
                    {tBtn('getStarted')}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-slate-600 hover:text-slate-900 p-2"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pt-4 pb-[max(2rem,env(safe-area-inset-bottom))] border-t border-[#FFE7A1] bg-white/95 backdrop-blur-sm max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain">
            <nav className="flex flex-col space-y-4">
              <div className="px-4 flex justify-end">
                <LanguageSwitcher />
              </div>
              {navItems.map((item) => (
                item.highlight ? (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    className="relative bg-[#FFD84D] text-slate-900 px-4 py-3 rounded-full font-semibold text-sm shadow-[0_15px_40px_rgba(255,216,77,0.3)] transition hover:-translate-y-0.5 hover:bg-[#ffe062] text-center mx-4"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      💎 {item.label}
                    </span>
                  </Link>
                ) : item.groups ? (
                  <div key={item.href} className="px-4">
                    <div className="text-slate-600 font-medium py-2">{item.label}</div>
                    <div className="ml-2 space-y-3">
                      {item.groups.map((groupItem) => (
                        <details key={groupItem.label} className="group/cat">
                          <summary className="cursor-pointer list-none flex items-center justify-between px-2 py-2 text-xs font-bold uppercase tracking-wider text-[#C69312] border-b border-[#FFE7A1]">
                            <span>{groupItem.label}</span>
                            <svg className="w-3.5 h-3.5 transition-transform group-open/cat:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </summary>
                          <div className="ml-2 mt-1 space-y-1">
                            {groupItem.items.map((dropdownItem) => (
                              <Link
                                key={dropdownItem.href}
                                href={dropdownItem.href}
                                prefetch={false}
                                className="flex items-center py-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                <span className="text-base mr-2">{dropdownItem.icon}</span>
                                <span className="font-medium">{dropdownItem.label}</span>
                              </Link>
                            ))}
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                ) : item.dropdown ? (
                  <div key={item.href} className="px-4">
                    <div className="text-slate-600 font-medium py-2">{item.label}</div>
                    <div className="ml-4 space-y-2">
                      {item.dropdown.map((dropdownItem) => (
                        <Link
                          key={dropdownItem.href}
                          href={dropdownItem.href}
                          prefetch={false}
                          className="flex items-center py-2 text-slate-600 hover:text-slate-900 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <span className="text-lg mr-3">{dropdownItem.icon}</span>
                          <span className="font-medium">{dropdownItem.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    className="text-slate-600 hover:text-slate-900 transition-colors font-medium px-4"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              ))}
              <div className="flex flex-col space-y-3 pt-4 border-t border-[#FFE7A1]">
                {loading ? (
                  <div className="w-8 h-8 border-2 border-[#FFD84D] border-t-transparent rounded-full animate-spin mx-auto"></div>
                ) : user ? (
                  <div className="flex flex-col space-y-3">
                    <div className="bg-white border border-[#FFE7A1] rounded-2xl px-4 py-3 mx-4 shadow-[0_10px_25px_rgba(240,162,2,0.15)]">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#FFD84D] rounded-full flex items-center justify-center">
                          <span className="text-lg font-semibold text-slate-900">
                            {(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{user.user_metadata?.full_name || 'User'}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                          {profile && (
                            <p className="text-xs text-[#C69312] font-medium mt-1">
                              💎 {profile.credits} credits
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/billing"
                      prefetch={false}
                      className="flex items-center px-4 py-2 text-sm text-slate-600 hover:text-slate-900 mx-4"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      {tNav('billing')}
                    </Link>
                    <Link
                      href="/assets"
                      prefetch={false}
                      className="flex items-center px-4 py-2 text-sm text-slate-600 hover:text-slate-900 mx-4"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      Assets
                    </Link>
                    <Link
                      href="/prompt-history"
                      prefetch={false}
                      className="flex items-center px-4 py-2 text-sm text-slate-600 hover:text-slate-900 mx-4"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {tNav('prompts')}
                    </Link>
                    <Link
                      href="/settings/api-keys"
                      prefetch={false}
                      className="flex items-center px-4 py-2 text-sm text-slate-600 hover:text-slate-900 mx-4"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      {tNav('apiKeys')}
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={signOut}
                      className="w-full text-slate-600 mx-4"
                    >
                      {tBtn('signOut')}
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={signInWithGoogle}
                      className="w-full text-slate-600"
                    >
                      {tBtn('signIn')}
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={signInWithGoogle}
                      className="w-full bg-[#FFD84D] hover:bg-[#ffe062] text-slate-900 font-semibold shadow-[0_15px_40px_rgba(255,216,77,0.3)]"
                    >
                      {tBtn('getStarted')}
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>            
    </header>
  );
}
