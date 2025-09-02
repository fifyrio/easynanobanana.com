'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [toolboxOpen, setToolboxOpen] = useState(false);

  const navItems = [
    { label: 'Image Editor', href: '/image-editor' },
    { label: 'Templates', href: '/templates' },
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
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center">
              <Image src="/images/logo.png" alt="Nano Banana" width={24} height={24} className="rounded-sm" />
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
                  className="relative"
                  onMouseEnter={() => setToolboxOpen(true)}
                  onMouseLeave={() => setToolboxOpen(false)}
                >
                  <Link 
                    href={item.href} 
                    className="text-gray-600 hover:text-gray-900 transition-colors font-medium flex items-center"
                  >
                    {item.label}
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Link>
                  
                  {/* Dropdown Menu */}
                  {toolboxOpen && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10">
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
                  )}
                </div>
              ) : (
                <Link 
                  key={item.href}
                  href={item.href} 
                  className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
                >
                  {item.label}
                </Link>
              )
            ))}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              Sign in
            </Button>
            <Button 
              size="sm" 
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium shadow-sm border-0"
            >
              Get Started
            </Button>
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
                <Button variant="ghost" size="sm" className="w-full text-gray-600">
                  Sign in
                </Button>
                <Button size="sm" className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium">
                  Get Started
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>            
    </header>
  );
}