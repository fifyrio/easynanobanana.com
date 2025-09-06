'use client';

import { useState } from 'react';
import Header from '@/components/common/Header';

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: '🚀' },
    { id: 'image-generation', title: 'Image Generation', icon: '🎨' },
    { id: 'background-removal', title: 'Background Removal', icon: '✂️' },
    { id: 'credits-system', title: 'Credits System', icon: '💰' },
    { id: 'templates', title: 'Templates & Styles', icon: '🎭' },
    { id: 'api-docs', title: 'API Documentation', icon: '🔧' },
    { id: 'troubleshooting', title: 'Troubleshooting', icon: '🛠️' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Documentation
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to know about using Easy Nano Banana
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Table of Contents</h2>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left ${
                      activeSection === section.id
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-2">{section.icon}</span>
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-12">
              
              {activeSection === 'getting-started' && (
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">🚀 Getting Started</h2>
                  
                  <div className="space-y-8">
                    <section>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Create Your Account</h3>
                      <p className="text-gray-700 mb-4">
                        Sign up with your Google account to get started. You'll receive free credits to try out our services.
                      </p>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800">
                          <strong>💡 Tip:</strong> New users get 10 free credits to explore all features!
                        </p>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">2. Choose Your Tool</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">🎨 AI Image Generation</h4>
                          <p className="text-gray-600 text-sm">Create images from text descriptions</p>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">✂️ Background Removal</h4>
                          <p className="text-gray-600 text-sm">Remove backgrounds instantly</p>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">3. Start Creating</h3>
                      <ol className="list-decimal list-inside space-y-2 text-gray-700">
                        <li>Enter your prompt or upload an image</li>
                        <li>Select your preferred style or settings</li>
                        <li>Click generate and wait for your result</li>
                        <li>Download your creation!</li>
                      </ol>
                    </section>
                  </div>
                </div>
              )}

              {activeSection === 'image-generation' && (
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">🎨 Image Generation</h2>
                  
                  <div className="space-y-8">
                    <section>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Writing Effective Prompts</h3>
                      <p className="text-gray-700 mb-4">
                        The key to great AI-generated images is writing clear, descriptive prompts. Here are some tips:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                        <li>Be specific about what you want to see</li>
                        <li>Include details about style, colors, and mood</li>
                        <li>Mention the setting or background</li>
                        <li>Specify the image format (portrait, landscape, square)</li>
                      </ul>
                      
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-800 font-medium mb-2">✅ Good Example:</p>
                        <p className="text-green-700 text-sm">
                          "A majestic golden retriever sitting in a sunny meadow, photorealistic style, warm lighting, shallow depth of field"
                        </p>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Style Options</h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="border border-gray-200 rounded-lg p-4 text-center">
                          <div className="text-2xl mb-2">📸</div>
                          <h4 className="font-medium text-gray-900 mb-1">Photorealistic</h4>
                          <p className="text-gray-600 text-sm">Lifelike, detailed images</p>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4 text-center">
                          <div className="text-2xl mb-2">🎭</div>
                          <h4 className="font-medium text-gray-900 mb-1">Artistic</h4>
                          <p className="text-gray-600 text-sm">Painted, stylized looks</p>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4 text-center">
                          <div className="text-2xl mb-2">🌟</div>
                          <h4 className="font-medium text-gray-900 mb-1">Fantasy</h4>
                          <p className="text-gray-600 text-sm">Magical, surreal themes</p>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              )}

              {activeSection === 'background-removal' && (
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">✂️ Background Removal</h2>
                  
                  <div className="space-y-8">
                    <section>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">How It Works</h3>
                      <p className="text-gray-700 mb-4">
                        Our AI-powered background removal tool automatically detects the main subject in your image 
                        and removes everything else, giving you a clean cutout with transparent background.
                      </p>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800">
                          <strong>💡 Best Results:</strong> Use images with clear subjects and good contrast between 
                          the subject and background for optimal results.
                        </p>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Step-by-Step Guide</h3>
                      <ol className="list-decimal list-inside space-y-3 text-gray-700">
                        <li>Click on "Remove Background" from the main menu</li>
                        <li>Upload your image (JPG, PNG, or WebP format)</li>
                        <li>Wait for the AI to process your image (usually takes 2-5 seconds)</li>
                        <li>Preview the result and download your transparent PNG</li>
                      </ol>
                    </section>

                    <section>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Supported Formats</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Input Formats</h4>
                          <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                            <li>JPEG (.jpg, .jpeg)</li>
                            <li>PNG (.png)</li>
                            <li>WebP (.webp)</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Output Format</h4>
                          <ul className="list-disc list-inside text-gray-700 text-sm">
                            <li>PNG with transparency</li>
                          </ul>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              )}

              {activeSection === 'credits-system' && (
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">💰 Credits System</h2>
                  
                  <div className="space-y-8">
                    <section>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">How Credits Work</h3>
                      <p className="text-gray-700 mb-4">
                        Easy Nano Banana uses a credit-based system to provide fair and flexible pricing. 
                        Different actions consume different amounts of credits based on computational cost.
                      </p>
                      
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <h4 className="font-medium text-gray-900 mb-3">Credit Usage:</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-700 mb-1">🎨 <strong>Image Generation:</strong></p>
                            <p className="text-sm text-gray-600 ml-6">2 credits per image</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-700 mb-1">✂️ <strong>Background Removal:</strong></p>
                            <p className="text-sm text-gray-600 ml-6">1 credit per image</p>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Getting Credits</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Free Credits</h4>
                          <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                            <li>10 credits when you sign up</li>
                            <li>Daily check-in rewards</li>
                            <li>Referral bonuses</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Purchase Options</h4>
                          <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                            <li>One-time credit packs</li>
                            <li>Monthly subscriptions</li>
                            <li>Annual plans (20% savings)</li>
                          </ul>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Checking Your Balance</h3>
                      <p className="text-gray-700 mb-4">
                        Your credit balance is always visible in the top right corner of the interface. 
                        You can also view your usage history in your account settings.
                      </p>
                    </section>
                  </div>
                </div>
              )}

              {activeSection === 'templates' && (
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">🎭 Templates & Styles</h2>
                  
                  <div className="space-y-8">
                    <section>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Available Categories</h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="text-2xl mb-2">🏢</div>
                          <h4 className="font-medium text-gray-900 mb-1">Business</h4>
                          <p className="text-gray-600 text-sm">Professional headshots, corporate imagery</p>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="text-2xl mb-2">📱</div>
                          <h4 className="font-medium text-gray-900 mb-1">Social Media</h4>
                          <p className="text-gray-600 text-sm">Instagram posts, story templates</p>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="text-2xl mb-2">🎨</div>
                          <h4 className="font-medium text-gray-900 mb-1">Artistic</h4>
                          <p className="text-gray-600 text-sm">Abstract art, paintings, illustrations</p>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="text-2xl mb-2">🌅</div>
                          <h4 className="font-medium text-gray-900 mb-1">Nature</h4>
                          <p className="text-gray-600 text-sm">Landscapes, wildlife, outdoor scenes</p>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="text-2xl mb-2">🏠</div>
                          <h4 className="font-medium text-gray-900 mb-1">Interior</h4>
                          <p className="text-gray-600 text-sm">Room designs, furniture, architecture</p>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="text-2xl mb-2">🍕</div>
                          <h4 className="font-medium text-gray-900 mb-1">Food</h4>
                          <p className="text-gray-600 text-sm">Culinary photography, restaurant imagery</p>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Using Templates</h3>
                      <ol className="list-decimal list-inside space-y-2 text-gray-700">
                        <li>Browse the templates gallery on the main page</li>
                        <li>Click on a template that matches your vision</li>
                        <li>Modify the prompt to customize the result</li>
                        <li>Generate your personalized image</li>
                      </ol>
                    </section>
                  </div>
                </div>
              )}

              {activeSection === 'api-docs' && (
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">🔧 API Documentation</h2>
                  
                  <div className="space-y-8">
                    <section>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-blue-900 mb-2">🚧 Coming Soon</h3>
                        <p className="text-blue-800">
                          Our API is currently in development and will be available for Pro and Enterprise users. 
                          Stay tuned for updates!
                        </p>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Planned Features</h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>RESTful API endpoints for all core features</li>
                        <li>Webhook support for async operations</li>
                        <li>Rate limiting and usage analytics</li>
                        <li>Multiple authentication methods</li>
                        <li>Comprehensive SDKs for popular languages</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Get Notified</h3>
                      <p className="text-gray-700 mb-4">
                        Want to be among the first to access our API? Contact us at{' '}
                        <a href="mailto:support@easynanobanana.com" className="text-yellow-600 hover:text-yellow-700 underline">
                          support@easynanobanana.com
                        </a>{' '}
                        to join our API beta program.
                      </p>
                    </section>
                  </div>
                </div>
              )}

              {activeSection === 'troubleshooting' && (
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">🛠️ Troubleshooting</h2>
                  
                  <div className="space-y-8">
                    <section>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Common Issues</h3>
                      
                      <div className="space-y-6">
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h4 className="font-semibold text-gray-900 mb-2">❌ "Generation Failed" Error</h4>
                          <p className="text-gray-700 mb-3">
                            This usually happens when the AI cannot process your prompt safely or due to high server load.
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Solutions:</strong> Try rephrasing your prompt, avoid sensitive content, or try again in a few minutes.
                          </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-6">
                          <h4 className="font-semibold text-gray-900 mb-2">⏳ Slow Generation Times</h4>
                          <p className="text-gray-700 mb-3">
                            During peak hours, generation might take longer than usual.
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Solutions:</strong> Pro users get priority processing. Consider upgrading for faster generation.
                          </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-6">
                          <h4 className="font-semibold text-gray-900 mb-2">💳 Payment Issues</h4>
                          <p className="text-gray-700 mb-3">
                            Having trouble with payments or not seeing your credits after purchase?
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Solutions:</strong> Check your email for payment confirmation, refresh the page, or contact support.
                          </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-6">
                          <h4 className="font-semibold text-gray-900 mb-2">🖼️ Poor Image Quality</h4>
                          <p className="text-gray-700 mb-3">
                            Images not meeting your expectations or coming out blurry/distorted?
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Solutions:</strong> Be more specific in prompts, try different styles, or use the "enhance" option.
                          </p>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Need More Help?</h3>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <p className="text-yellow-800 mb-4">
                          Can't find a solution? Our support team is here to help!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <a
                            href="mailto:support@easynanobanana.com"
                            className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium px-4 py-2 rounded-lg transition-colors text-center"
                          >
                            Email Support
                          </a>
                          <a
                            href="/faq"
                            className="bg-white hover:bg-gray-50 text-gray-900 font-medium px-4 py-2 rounded-lg border border-gray-300 transition-colors text-center"
                          >
                            Check FAQ
                          </a>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}