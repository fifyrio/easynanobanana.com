'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isToolboxOpen, setIsToolboxOpen] = useState(false);

  const navItems = [
    { label: 'Image Editor', href: '/' },
    { label: 'Templates', href: '/templates' },
    { label: 'Toolbox', href: '#', hasDropdown: true },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Free Credit', href: '/free-credits', highlight: true }
  ];

  const toolboxItems = [
    { label: 'Remove Background', href: '/remove-background' },
    { label: 'AI Prompt Assistant', href: '/ai-prompt-assistant' }
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
            {navItems.map((item) => {
              if (item.hasDropdown) {
                return (
                  <div 
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => setIsToolboxOpen(true)}
                    onMouseLeave={() => setIsToolboxOpen(false)}
                  >
                    <button 
                      className="text-gray-600 hover:text-gray-900 transition-colors font-medium flex items-center space-x-1"
                    >
                      <span>{item.label}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* Dropdown Menu */}
                    {isToolboxOpen && (
                      <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                        <div className="py-2">
                          {toolboxItems.map((toolItem) => (
                            <Link
                              key={toolItem.href}
                              href={toolItem.href}
                              className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                            >
                              {toolItem.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
              
              return (
                <Link 
                  key={item.href}
                  href={item.href} 
                  className={`text-gray-600 hover:text-gray-900 transition-colors font-medium ${
                    item.highlight ? 'text-blue-600 hover:text-blue-700' : ''
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
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
              {navItems.map((item) => {
                if (item.hasDropdown) {
                  return (
                    <div key={item.label}>
                      <button 
                        className="text-gray-600 hover:text-gray-900 transition-colors font-medium flex items-center justify-between w-full"
                        onClick={() => setIsToolboxOpen(!isToolboxOpen)}
                      >
                        <span>{item.label}</span>
                        <svg className={`w-4 h-4 transition-transform ${isToolboxOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isToolboxOpen && (
                        <div className="mt-2 ml-4 space-y-2">
                          {toolboxItems.map((toolItem) => (
                            <Link
                              key={toolItem.href}
                              href={toolItem.href}
                              className="block text-sm text-gray-600 hover:text-gray-900 transition-colors py-1"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              {toolItem.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                
                return (
                  <Link 
                    key={item.href}
                    href={item.href} 
                    className={`text-gray-600 hover:text-gray-900 transition-colors font-medium ${
                      item.highlight ? 'text-blue-600' : ''
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}
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