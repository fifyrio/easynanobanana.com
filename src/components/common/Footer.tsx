'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          {/* Brand */}
          <div className="mb-6 md:mb-0">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center">
                <Image src="/images/logo.png" alt="Nano Banana" width={24} height={24} className="rounded-sm" />
              </div>
              <span className="text-xl font-semibold text-gray-900">Nano Banana</span>
            </div>
          </div>

          {/* Footer Links */}
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8">
            <Link href="/about" className="text-gray-600 hover:text-gray-900 transition-colors">
              About
            </Link>
            <Link href="/docs" className="text-gray-600 hover:text-gray-900 transition-colors">
              Docs
            </Link>
            <Link href="/faq" className="text-gray-600 hover:text-gray-900 transition-colors">
              FAQ
            </Link>
            <Link href="/privacy" className="text-gray-600 hover:text-gray-900 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-gray-600 hover:text-gray-900 transition-colors">
              Terms
            </Link>
            <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">
              Contact
            </Link>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-100 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm mb-4 md:mb-0">
              © 2024 Nano Banana. All rights reserved.
            </p>
            <div className="flex items-center space-x-4">
              <span className="text-gray-500 text-sm">English</span>
              <div className="flex space-x-3">
                <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                  <i className="ri-twitter-fill text-lg"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                  <i className="ri-instagram-fill text-lg"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                  <i className="ri-facebook-fill text-lg"></i>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Branding Tagline */}
        <div className="text-center mt-8 pt-8 border-t border-gray-100">
          <div className="flex items-center justify-center space-x-3 text-gray-500">
            <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded flex items-center justify-center">
              <Image src="/images/logo.png" alt="Nano Banana" width={16} height={16} className="rounded-sm" />
            </div>
            <span className="text-sm">Nano Banana - Create with AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}