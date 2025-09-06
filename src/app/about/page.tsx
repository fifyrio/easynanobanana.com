'use client';

import Header from '@/components/common/Header';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About Easy Nano Banana
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Empowering creators with cutting-edge AI technology to bring their visual ideas to life
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-gray-700 mb-4">
              We believe that everyone should have access to professional-quality image creation tools. 
              Our mission is to democratize visual content creation through innovative AI technology, 
              making it easy for anyone to generate stunning images regardless of their technical background.
            </p>
            <p className="text-gray-700">
              Whether you're a content creator, marketer, designer, or just someone with a creative vision, 
              Easy Nano Banana provides the tools you need to transform your ideas into beautiful visuals.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Creative Innovation</h3>
              <p className="text-gray-600">
                Leveraging the latest AI models to deliver exceptional image generation capabilities
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12 mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">What We Offer</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🖼️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Image Generation</h3>
              <p className="text-gray-600">
                Create high-quality images from simple text descriptions using advanced AI models
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">✂️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Background Removal</h3>
              <p className="text-gray-600">
                Instantly remove backgrounds from images with precision and professional results
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🎭</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Style Templates</h3>
              <p className="text-gray-600">
                Access a wide variety of artistic styles and templates to enhance your creations
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">⚡</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-gray-600">
                Get professional results in seconds, not hours
              </p>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Why Choose Us</h2>
            <ul className="space-y-4">
              <li className="flex items-start">
                <svg className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700"><strong>User-Friendly:</strong> No technical expertise required - just describe what you want</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700"><strong>High Quality:</strong> Professional-grade results powered by state-of-the-art AI</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700"><strong>Affordable:</strong> Flexible pricing options to fit any budget</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700"><strong>Reliable:</strong> Built with enterprise-grade infrastructure for consistent performance</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
          <p className="text-gray-700 max-w-4xl mx-auto mb-6">
            Founded with a vision to make AI-powered creativity accessible to everyone, Easy Nano Banana 
            started as a simple idea: what if anyone could create professional-quality images with just 
            a few words? Today, we're proud to serve thousands of creators worldwide, helping them bring 
            their visual ideas to life.
          </p>
          <p className="text-gray-700 max-w-4xl mx-auto">
            We're constantly evolving our platform, adding new features and improving our AI models to 
            provide you with the best possible creative experience. Join us on this exciting journey 
            of visual innovation.
          </p>
        </div>

        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of creators who are already using Easy Nano Banana
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/pricing"
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium px-8 py-3 rounded-xl transition-colors"
            >
              View Pricing
            </a>
            <a
              href="/docs"
              className="bg-white hover:bg-gray-50 text-gray-900 font-medium px-8 py-3 rounded-xl border border-gray-300 transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}