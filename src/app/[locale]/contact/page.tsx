'use client';

import Header from '@/components/common/Header';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Contact Us
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get in touch with our team - we&apos;re here to help you create amazing visuals
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12 mb-20">
            <div className="text-center mb-12">
              <div className="text-6xl mb-6">💌</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">We&apos;d Love to Hear From You</h2>
              <p className="text-gray-600 text-lg">
                Whether you have questions, feedback, or need assistance, our support team is ready to help.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">Get Support</h3>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="text-2xl mr-4">📧</div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Email Support</h4>
                      <p className="text-gray-600 mb-2">Send us an email and we&apos;ll get back to you within 24 hours</p>
                      <a 
                        href="mailto:support@easynanobanana.com"
                        className="text-yellow-600 hover:text-yellow-700 font-medium transition-colors"
                      >
                        support@easynanobanana.com
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="text-2xl mr-4">⚡</div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Response Time</h4>
                      <p className="text-gray-600">We typically respond within 24 hours during business days</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="text-2xl mr-4">🌍</div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Support Hours</h4>
                      <p className="text-gray-600">Monday - Friday, 9:00 AM - 6:00 PM UTC</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">How We Can Help</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Technical support and troubleshooting</span>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Account and billing questions</span>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Feature requests and feedback</span>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Partnership and business inquiries</span>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Usage tips and best practices</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
              <div className="text-4xl mb-4">❓</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">FAQ</h3>
              <p className="text-gray-600 mb-4">
                Find quick answers to common questions about our platform
              </p>
              <a
                href="/faq"
                className="text-yellow-600 hover:text-yellow-700 font-medium transition-colors"
              >
                Browse FAQ →
              </a>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Documentation</h3>
              <p className="text-gray-600 mb-4">
                Learn how to make the most of our AI-powered tools
              </p>
              <a
                href="/docs"
                className="text-yellow-600 hover:text-yellow-700 font-medium transition-colors"
              >
                View Docs →
              </a>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Get Started</h3>
              <p className="text-gray-600 mb-4">
                New to Easy Nano Banana? Start creating amazing visuals today
              </p>
              <a
                href="/pricing"
                className="text-yellow-600 hover:text-yellow-700 font-medium transition-colors"
              >
                Start Creating →
              </a>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to Create Something Amazing?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Don&apos;t wait - start generating stunning visuals with our AI-powered tools today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/pricing"
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium px-8 py-3 rounded-xl transition-colors"
            >
              Get Started
            </a>
            <a
              href="/"
              className="bg-white hover:bg-gray-50 text-gray-900 font-medium px-8 py-3 rounded-xl border border-gray-300 transition-colors"
            >
              Try Demo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}