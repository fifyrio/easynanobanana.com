'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, profile, loading, signInWithGoogle, signOut } = useAuth();

  const navItems = [
    { label: 'Image Editor', href: '/image-editor' },
    { 
      label: 'AI Image Effects', 
      href: '/ai-image-effects/ai-figure-generator',
      dropdown: [
        { label: 'AI Figure Generator', href: '/ai-image-effects/ai-figure-generator', icon: '🎨' },
        { label: 'Object Removal', href: '/ai-image-effects/object-removal', icon: '🎯' },
        { label: 'Body Editor', href: '/ai-image-effects/body-editor', icon: '💪' }
      ]
    },
    { 
      label: 'Toolbox', 
      href: '/remove-background',
      dropdown: [
        { label: 'Background Removal', href: '/remove-background', icon: '✨' },
        { label: 'AI Prompt Assistant', href: '/ai-prompt-assistant', icon: '🤖' }
      ]
    },    
    { label: 'Pricing', href: '/pricing' },
    { label: 'Free Credit', href: '/free-credits', highlight: true }
  ];

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      {/* Free Credits Banner */}
      <div className="bg-yellow-400 px-4 py-2 text-center text-sm text-gray-900">
        <span>No account? </span>
        <Link href="/free-credits" className="underline hover:no-underline font-medium">
          Try free credits
        </Link>
        <span className="mx-2">|</span>
        <Link href="/invite" className="underline hover:no-underline font-medium">
          Invite friends
        </Link>
        <span> - bonus credits</span>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 flex items-center justify-center">
              <Image src="/images/logo.png" alt="Nano Banana" width={48} height={48} className="rounded-sm" />
            </div>
            <Link href="/" className="text-xl font-semibold text-gray-900 hover:text-gray-700 transition-colors">
              Nano Banana
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              item.highlight ? (
                <Link 
                  key={item.href}
                  href={item.href} 
                  className="relative bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-4 py-2 rounded-full font-semibold text-sm hover:from-yellow-500 hover:to-orange-500 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <span className="relative z-10 flex items-center">
                    💎 {item.label}
                  </span>
                  <div className="absolute inset-0 bg-white opacity-30 rounded-full animate-pulse"></div>
                </Link>
              ) : item.dropdown ? (
                <div 
                  key={item.href}
                  className="relative group"
                >
                  <Link 
                    href={item.href} 
                    className="text-gray-600 hover:text-gray-900 transition-colors font-medium flex items-center px-3 py-2"
                  >
                    {item.label}
                    <svg className="w-4 h-4 ml-1 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Link>
                  
                  {/* Dropdown Menu - CSS-only hover */}
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out">
                    {item.dropdown.map((dropdownItem) => (
                      <Link
                        key={dropdownItem.href}
                        href={dropdownItem.href}
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-yellow-50 hover:text-gray-900 transition-colors"
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
                  className="text-gray-600 hover:text-gray-900 transition-colors font-medium px-3 py-2"
                >
                  {item.label}
                </Link>
              )
            ))}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {loading ? (
              <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            ) : user ? (
              <div className="flex items-center space-x-3">
                {/* Credits Display */}
                {profile && (
                  <div className="flex items-center bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-full px-3 py-1.5">
                    <span className="text-lg mr-1">💎</span>
                    <span className="text-sm font-semibold text-yellow-700">
                      {profile.credits}
                    </span>
                    <span className="text-xs text-yellow-600 ml-1">credits</span>
                  </div>
                )}
                
                {/* User Menu */}
                <div className="relative group">
                  <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-gray-900">
                        {(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.user_metadata?.full_name || 'User'}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      {profile && (
                        <p className="text-xs text-yellow-600 font-medium mt-1">
                          💎 {profile.credits} credits
                        </p>
                      )}
                    </div>
                    <Link
                      href="/history"
                      className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      My History
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={signOut}
                      className="w-full text-left justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-none"
                    >
                      Sign out
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
                  className="text-gray-600 hover:text-gray-900"
                >
                  Sign in
                </Button>
                <Button 
                  size="sm" 
                  onClick={signInWithGoogle}
                  className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium shadow-sm border-0"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900 p-2"
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
          <div className="md:hidden py-4 border-t border-gray-100">
            <nav className="flex flex-col space-y-4">
              {navItems.map((item) => (
                item.highlight ? (
                  <Link 
                    key={item.href}
                    href={item.href} 
                    className="relative bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-4 py-3 rounded-full font-semibold text-sm hover:from-yellow-500 hover:to-orange-500 transition-all duration-200 transform hover:scale-105 shadow-lg text-center mx-4"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      💎 {item.label}
                    </span>
                    <div className="absolute inset-0 bg-white opacity-30 rounded-full animate-pulse"></div>
                  </Link>
                ) : item.dropdown ? (
                  <div key={item.href} className="px-4">
                    <div className="text-gray-600 font-medium py-2">{item.label}</div>
                    <div className="ml-4 space-y-2">
                      {item.dropdown.map((dropdownItem) => (
                        <Link
                          key={dropdownItem.href}
                          href={dropdownItem.href}
                          className="flex items-center py-2 text-gray-600 hover:text-gray-900 transition-colors"
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
                    className="text-gray-600 hover:text-gray-900 transition-colors font-medium px-4"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              ))}
              <div className="flex flex-col space-y-3 pt-4 border-t border-gray-100">
                {loading ? (
                  <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                ) : user ? (
                  <div className="flex flex-col space-y-3">
                    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 mx-4 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                          <span className="text-lg font-semibold text-gray-900">
                            {(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{user.user_metadata?.full_name || 'User'}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                          {profile && (
                            <p className="text-xs text-yellow-600 font-medium mt-1">
                              💎 {profile.credits} credits
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/history"
                      className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 mx-4"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      My History
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={signOut}
                      className="w-full text-gray-600 mx-4"
                    >
                      Sign out
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={signInWithGoogle}
                      className="w-full text-gray-600"
                    >
                      Sign in
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={signInWithGoogle}
                      className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium"
                    >
                      Get Started
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