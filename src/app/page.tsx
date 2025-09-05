import Header from '@/components/common/Header';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-yellow-400 via-yellow-300 to-orange-300 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-6">
                <span className="text-4xl">🍌</span>
              </div>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Nano Banana
              <span className="block text-gray-700">AI Image Studio</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
              Create stunning images with the power of AI. From realistic photos to artistic illustrations, 
              bring your imagination to life in seconds.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/image-editor">
                <Button 
                  size="lg" 
                  className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 text-lg font-semibold shadow-lg"
                >
                  Start Creating
                  <i className="ri-arrow-right-line ml-2"></i>
                </Button>
              </Link>
              <Link href="/templates">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white px-8 py-4 text-lg font-semibold"
                >
                  Browse Templates
                </Button>
              </Link>
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-8 text-gray-700">
              <div className="flex items-center">
                <i className="ri-magic-line text-2xl mr-2"></i>
                <span className="font-medium">AI-Powered</span>
              </div>
              <div className="flex items-center">
                <i className="ri-time-line text-2xl mr-2"></i>
                <span className="font-medium">Instant Results</span>
              </div>
              <div className="flex items-center">
                <i className="ri-gift-line text-2xl mr-2"></i>
                <span className="font-medium">Free Credits</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full opacity-10 -translate-x-20 -translate-y-20"></div>
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full opacity-10 translate-x-20 translate-y-20"></div>
      </section>          

      {/* What Images Can Be Edited Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
              UNLEASH AI MAGIC FOR YOUR DIGITAL IDENTITY
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Transform ANY Image into Pure Digital Gold!
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Nano Banana is perfect for editing any type of image – no more need for Photoshop! Click to preview editing results.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {[
              {
                id: 1,
                title: "Stunning Portrait Transformations!",
                description: "Enhance portraits with AI precision: perfect skin tone, professional lighting, and natural beauty enhancement."
              },
              {
                id: 2,
                title: "Mind-Blowing 3D Magic!",
                description: "Transform your 2D cartoons into stunning 3D models with Nano Banana AI's advanced rendering technology."
              },
              {
                id: 3,
                title: "Hollywood-Grade Color Mastery!",
                description: "No need for Photoshop - Nano Banana AI understands your color grading needs perfectly."
              },
              {
                id: 4,
                title: "Dynamic Pose Revolution!",
                description: "Transform character poses in your images - adjust positioning, hand gestures, and body postures with precision."
              },
              {
                id: 5,
                title: "Brand Identity Powerhouse!",
                description: "Nano Banana AI precisely edits specific regions based on your prompts - modify logos, colors, and branding with accuracy."
              },
              {
                id: 6,
                title: "Instant Style Makeovers!",
                description: "Just let Nano Banana AI to change outfits - it will swap clothing while preserving everything else in your image perfectly."
              }
            ].map((feature) => (
              <div key={feature.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
                <div className="grid grid-cols-2 gap-3 p-4">
                  <div className="relative bg-gray-200 rounded-lg aspect-[9/16] overflow-hidden">
                    <img 
                      src={`${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/home/WhatImagesCanBeEdited/${feature.id}-before.webp`}
                      alt={`Before ${feature.title.toLowerCase()}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="relative bg-gray-200 rounded-lg aspect-[9/16] overflow-hidden">
                    <img 
                      src={`${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/home/WhatImagesCanBeEdited/${feature.id}-after.webp`}
                      alt={`After ${feature.title.toLowerCase()}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/ai-image-effects/ai-figure-generator">
              <Button 
                size="lg" 
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-4 text-lg font-semibold shadow-lg"
              >
                Start Editing Images Now
                <i className="ri-arrow-right-line ml-2"></i>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
              SHOWCASE GALLERY
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Unleash the Revolutionary Power of AI Image Magic!
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Watch our Nano Banana AI create stunning edited images with incredible photorealistic style.
            </p>
          </div>
          
          {/* Twitter Tweet Embed */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-3 mb-4">
                  <a href="https://x.com/Lars_pragmata/status/1955745610948337888" target="_blank" rel="noopener noreferrer">
                    <div className="relative">
                      <img src="https://pbs.twimg.com/profile_images/1248710661909237768/mZBDZ3zr_normal.jpg" alt="Lars_Pragmata" width="48" height="48" className="rounded-full" />
                    </div>
                  </a>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-1">
                      <a href="https://x.com/Lars_pragmata/status/1955745610948337888" target="_blank" rel="noopener noreferrer" className="font-bold text-gray-900 hover:underline">
                        Lars_Pragmata
                      </a>
                      <span className="text-gray-500">@Lars_pragmata</span>
                      <span className="text-gray-500">·</span>
                      <a href="https://x.com/Lars_pragmata/status/1955745610948337888" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:underline">
                        <time dateTime="2025-08-13T21:37:44.000Z">Aug 13</time>
                      </a>
                    </div>
                    <div className="text-gray-900 leading-normal">
                      <p>🔥 image editing is solved!</p>
                      <p>The new Gemini 3 image AKA nano banana is the best ai image editor 🫡</p>
                      <p>Google cooked again!</p>
                      <p>You can try it now on LMarena</p>
                    </div>
                  </div>
                </div>
                
                {/* Tweet Images */}
                <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden mb-4">
                  <a href="https://x.com/Lars_pragmata/status/1955745610948337888" target="_blank" rel="noopener noreferrer" className="block">
                    <img src="https://pbs.twimg.com/media/GyQ0RDPXMAUrPv_?format=jpg&name=small" alt="Image" className="w-full h-48 object-cover hover:opacity-90 transition-opacity" />
                  </a>
                  <a href="https://x.com/Lars_pragmata/status/1955745610948337888" target="_blank" rel="noopener noreferrer" className="block">
                    <img src="https://pbs.twimg.com/media/GyQ0RE2WAAQnivt?format=jpg&name=small" alt="Image" className="w-full h-48 object-cover hover:opacity-90 transition-opacity" />
                  </a>
                  <a href="https://x.com/Lars_pragmata/status/1955745610948337888" target="_blank" rel="noopener noreferrer" className="block col-span-2">
                    <img src="https://pbs.twimg.com/media/GyQ0RJaXMAI5Dac?format=jpg&name=small" alt="Image" className="w-full h-48 object-cover hover:opacity-90 transition-opacity" />
                  </a>
                </div>

                {/* Tweet Actions */}
                <div className="flex items-center justify-between text-gray-500 text-sm border-t border-gray-100 pt-3">
                  <a href="https://x.com/intent/tweet?in_reply_to=1955745610948337888" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                      <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01z"/>
                    </svg>
                    Reply
                  </a>
                  
                  <a href="https://x.com/intent/like?tweet_id=1955745610948337888" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-red-500 transition-colors">
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                      <path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"/>
                    </svg>
                    969
                  </a>

                  <a href="https://x.com/Lars_pragmata/status/1955745610948337888" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 transition-colors font-medium">
                    View on X
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link href="/ai-image-effects/ai-figure-generator">
              <Button 
                size="lg" 
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-4 text-lg font-semibold shadow-lg"
              >
                Start Editing Images Now
                <i className="ri-arrow-right-line ml-2"></i>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How To Use Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
              MAKE YOUR PHOTOS MORE BEAUTIFUL
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Master AI Image Creation in Just 3 Explosive Steps!
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Upload your image, add your editing prompts, and get amazing results. No complex operations needed – AI does all the heavy lifting for you.
            </p>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
            {[
              {
                step: "01",
                title: "Ignite Your Vision - Upload & Command the AI!",
                description: "Click the upload button to select the image you want to edit. In the prompt box, describe what changes you want – enhance colors, adjust style, or transform the scene.",
                image: `${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/home/HowItWorks/step-1.webp`
              },
              {
                step: "02", 
                title: "Watch AI Work Its Mind-Blowing Magic!",
                description: "Click the Generate button, and our AI will instantly analyze your image and prompt to create the perfect edited result with precision and quality.",
                image: `${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/home/HowItWorks/step-2.webp`
              },
              {
                step: "03",
                title: "Claim Your Masterpiece & Blow Minds!",
                description: "Once the edited image is ready, preview it immediately. If you're happy with the result, click the Download button to save the high-quality image ready for any use.",
                image: `${process.env.NEXT_PUBLIC_R2_ENDPOINT}/showcases/home/HowItWorks/step-3.webp`
              }
            ].map((stepData, index) => (
              <div key={stepData.step}>
                {/* Step Content */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center relative flex-1 max-w-sm hover:shadow-md transition-shadow h-full flex flex-col">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm z-10">
                    {stepData.step}
                  </div>
                  <div className="mb-6 relative pt-8">
                    <img 
                      src={stepData.image} 
                      alt={`Step ${stepData.step} illustration`}
                      className="w-full aspect-square object-cover rounded-2xl"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{stepData.title}</h3>
                  <p className="text-gray-600">
                    {stepData.description}
                  </p>
                </div>
                
                {/* Arrow - only show between steps */}
                {index < 2 && (
                  <>
                    <div className="hidden lg:flex items-center justify-center">
                      <i className="ri-arrow-right-line text-2xl text-yellow-500"></i>
                    </div>
                    <div className="lg:hidden flex items-center justify-center">
                      <i className="ri-arrow-down-line text-2xl text-yellow-500"></i>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

    
      
      {/* Featured Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Supercharge Your Creativity with Game-Changing AI Arsenal!
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to create, edit, and enhance images with cutting-edge AI technology
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center hover:shadow-md transition-shadow group">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-10 rounded-xl group-hover:animate-ping"></div>
                <span className="text-2xl relative z-10">🖼️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Epic Image Creation Engine!</h3>
              <p className="text-gray-600 mb-6">
                Transform your ideas into stunning visuals with our advanced AI models
              </p>
              <Link href="/image-editor">
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-white">
                  Try Now
                </Button>
              </Link>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center hover:shadow-md transition-shadow group">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-10 rounded-xl group-hover:animate-pulse"></div>
                <span className="text-2xl relative z-10">✨</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Instant Background Obliteration!</h3>
              <p className="text-gray-600 mb-6">
                Remove backgrounds instantly with precision AI technology
              </p>
              <Link href="/remove-background">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  Remove Backgrounds
                </Button>
              </Link>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center hover:shadow-md transition-shadow group">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-400 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-10 rounded-xl group-hover:animate-bounce"></div>
                <span className="text-2xl relative z-10">📐</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Explosive Template Collection!</h3>
              <p className="text-gray-600 mb-6">
                Choose from hundreds of professionally designed templates
              </p>
              <Link href="/templates">
                <Button className="bg-red-500 hover:bg-red-600 text-white">
                  Browse Templates
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Why Choose Nano Banana Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why Nano Banana is the Ultimate Creative Weapon!
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of creators who trust Nano Banana for their AI image generation needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center hover:shadow-md transition-shadow group">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-10 rounded-xl animate-pulse"></div>
                <span className="text-2xl relative z-10">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Blazingly Insane Speed!</h3>
              <p className="text-gray-600 mb-6">
                Generate high-quality images in seconds, not minutes. Our optimized AI models deliver results instantly.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center hover:shadow-md transition-shadow group">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-10 rounded-xl group-hover:animate-spin"></div>
                <span className="text-2xl relative z-10">🎨</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Limitless Creative Universe!</h3>
              <p className="text-gray-600 mb-6">
                From photorealistic to anime, illustrations to product shots - create any style you can imagine.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center hover:shadow-md transition-shadow group">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-400 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-10 rounded-xl group-hover:animate-bounce"></div>
                <span className="text-2xl relative z-10">💸</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Zero Risk, Maximum Impact!</h3>
              <p className="text-gray-600 mb-6">
                No upfront costs. Try our platform with free credits and only pay for what you use.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center hover:shadow-md transition-shadow group">
              <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-pink-400 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-10 rounded-xl group-hover:animate-pulse"></div>
                <span className="text-2xl relative z-10">🔒</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Fort Knox-Level Privacy!</h3>
              <p className="text-gray-600 mb-6">
                Your creations are private by default. We respect your intellectual property and creativity.
              </p>
            </div>
          </div>
          
          <div className="mt-16 bg-gradient-to-br from-yellow-400 via-yellow-300 to-orange-300 rounded-2xl p-8 lg:p-12 text-center">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                Ready to Unleash Your Creative Superpowers?
              </h3>
              <p className="text-lg text-gray-700 mb-8">
                Join the AI revolution and transform your creative workflow today. No technical skills required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/image-editor">
                  <Button 
                    size="lg" 
                    className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 text-lg font-semibold shadow-lg"
                  >
                    Start Creating Now
                    <i className="ri-arrow-right-line ml-2"></i>
                  </Button>
                </Link>
                <Link href="/free-credits">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white px-8 py-4 text-lg font-semibold bg-white"
                  >
                    Get Free Credits
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}