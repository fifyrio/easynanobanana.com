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
      
  {/* Showcase Section */}
  <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
              SHOWCASE GALLERY
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              See the Power of Nano Banana Image Editing
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Watch our Nano Banana AI create stunning edited images with incredible photorealistic style.
            </p>
          </div>
          
          <div className="relative">
            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
              {/* Before/After Example 1 */}
              <div className="flex-none w-80">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="grid grid-rows-2 gap-0">
                    <div className="aspect-square bg-gray-200 flex items-center justify-center relative">
                      <div className="text-gray-500 text-xs">Before Image</div>
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        Before
                      </div>
                    </div>
                    <div className="aspect-square bg-gray-200 flex items-center justify-center relative">
                      <div className="text-gray-500 text-xs">After Image</div>
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        After
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Before/After Example 2 */}
              <div className="flex-none w-80">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="grid grid-rows-2 gap-0">
                    <div className="aspect-square bg-gray-200 flex items-center justify-center relative">
                      <div className="text-gray-500 text-xs">Before Image</div>
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        Before
                      </div>
                    </div>
                    <div className="aspect-square bg-gray-200 flex items-center justify-center relative">
                      <div className="text-gray-500 text-xs">After Image</div>
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        After
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Before/After Example 3 */}
              <div className="flex-none w-80">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="grid grid-rows-2 gap-0">
                    <div className="aspect-square bg-gray-200 flex items-center justify-center relative">
                      <div className="text-gray-500 text-xs">Before Image</div>
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        Before
                      </div>
                    </div>
                    <div className="aspect-square bg-gray-200 flex items-center justify-center relative">
                      <div className="text-gray-500 text-xs">After Image</div>
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        After
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Before/After Example 4 */}
              <div className="flex-none w-80">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="grid grid-rows-2 gap-0">
                    <div className="aspect-square bg-gray-200 flex items-center justify-center relative">
                      <div className="text-gray-500 text-xs">Before Image</div>
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        Before
                      </div>
                    </div>
                    <div className="aspect-square bg-gray-200 flex items-center justify-center relative">
                      <div className="text-gray-500 text-xs">After Image</div>
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        After
                      </div>
                    </div>
                  </div>
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

      {/* What Images Can Be Edited Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
              UNLEASH AI MAGIC FOR YOUR DIGITAL IDENTITY
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              What images can be edited by Nano Banana?
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Nano Banana is perfect for editing any type of image – no more need for Photoshop! Click to preview editing results.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Portrait Photo Editing */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
              <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden flex items-center justify-center">
                <div className="text-gray-500 text-sm">Portrait Photo Placeholder</div>
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-gray-700">
                  Original
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Portrait Photo Editing</h3>
                <p className="text-gray-600 text-sm">
                  Enhance portraits with AI precision: perfect skin tone, professional lighting, and natural beauty enhancement.
                </p>
              </div>
            </div>

            {/* Turn Cartoon Style in 3D */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
              <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden flex items-center justify-center">
                <div className="text-gray-500 text-sm">3D Cartoon Placeholder</div>
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-gray-700">
                  Original
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Turn Cartoon Style in 3D</h3>
                <p className="text-gray-600 text-sm">
                  Transform your 2D cartoons into stunning 3D models with Nano Banana AI's advanced rendering technology.
                </p>
              </div>
            </div>

            {/* Professional Color Grading */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
              <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden flex items-center justify-center">
                <div className="text-gray-500 text-sm">Color Grading Placeholder</div>
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-gray-700">
                  Original
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional Color Grading</h3>
                <p className="text-gray-600 text-sb">
                  No need for Photoshop - Nano Banana AI understands your color grading needs perfectly.
                </p>
              </div>
            </div>

            {/* Adjust Character Poses */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
              <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden flex items-center justify-center">
                <div className="text-gray-500 text-sm">Character Poses Placeholder</div>
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-gray-700">
                  Original
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Adjust Character Poses</h3>
                <p className="text-gray-600 text-sm">
                  Transform character poses in your images - adjust positioning, hand gestures, and body postures with precision.
                </p>
              </div>
            </div>

            {/* Brand Logo Editing */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
              <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden flex items-center justify-center">
                <div className="text-gray-500 text-sm">Brand Logo Placeholder</div>
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-gray-700">
                  Original
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Brand Logo Editing</h3>
                <p className="text-gray-600 text-sm">
                  Nano Banana AI precisely edits specific regions based on your prompts - modify logos, colors, and branding with accuracy.
                </p>
              </div>
            </div>

            {/* Outfit Changes Made Simple */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
              <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden flex items-center justify-center">
                <div className="text-gray-500 text-sm">Outfit Changes Placeholder</div>
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-gray-700">
                  Original
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Outfit Changes Made Simple</h3>
                <p className="text-gray-600 text-sm">
                  Just let Nano Banana AI to change outfits - it will swap clothing while preserving everything else in your image perfectly.
                </p>
              </div>
            </div>
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

      {/* How To Use Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
              MAKE YOUR PHOTOS MORE BEAUTIFUL
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Edit your image in 3 easy steps
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Upload your image, add your editing prompts, and get amazing results. No complex operations needed – AI does all the heavy lifting for you.
            </p>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
            {/* Step 1 */}
            <div className="text-center relative flex-1 max-w-sm">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm z-10">
                01
              </div>
              <div className="bg-gray-200 rounded-2xl p-8 pt-12 mb-6 relative overflow-hidden h-64 flex items-center justify-center">
                <div className="text-gray-500 text-sm">Step 1 Illustration Placeholder</div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Upload an image, add your editing prompt</h3>
              <p className="text-gray-600">
                Click the upload button to select the image you want to edit. In the prompt box, describe what changes you want – enhance colors, adjust style, or transform the scene.
              </p>
            </div>

            {/* Arrow */}
            <div className="hidden lg:flex items-center justify-center">
              <i className="ri-arrow-right-line text-2xl text-yellow-500"></i>
            </div>
            
            {/* Mobile Arrow */}
            <div className="lg:hidden flex items-center justify-center">
              <i className="ri-arrow-down-line text-2xl text-yellow-500"></i>
            </div>

            {/* Step 2 */}
            <div className="text-center relative flex-1 max-w-sm">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm z-10">
                02
              </div>
              <div className="bg-gray-200 rounded-2xl p-8 pt-12 mb-6 relative overflow-hidden h-64 flex items-center justify-center">
                <div className="text-gray-500 text-sm">Step 2 Illustration Placeholder</div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">AI processes your request</h3>
              <p className="text-gray-600">
                Click the Generate button, and our AI will instantly analyze your image and prompt to create the perfect edited result with precision and quality.
              </p>
            </div>

            {/* Arrow */}
            <div className="hidden lg:flex items-center justify-center">
              <i className="ri-arrow-right-line text-2xl text-yellow-500"></i>
            </div>
            
            {/* Mobile Arrow */}
            <div className="lg:hidden flex items-center justify-center">
              <i className="ri-arrow-down-line text-2xl text-yellow-500"></i>
            </div>

            {/* Step 3 */}
            <div className="text-center relative flex-1 max-w-sm">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm z-10">
                03
              </div>
              <div className="bg-gray-200 rounded-2xl p-8 pt-12 mb-6 relative overflow-hidden h-64 flex items-center justify-center">
                <div className="text-gray-500 text-sm">Step 3 Illustration Placeholder</div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Download and share</h3>
              <p className="text-gray-600">
                Once the edited image is ready, preview it immediately. If you're happy with the result, click the Download button to save the high-quality image ready for any use.
              </p>
            </div>
          </div>
        </div>
      </section>

    
      
      {/* Featured Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Powerful AI Tools at Your Fingertips
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
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Image Generation</h3>
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
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Background Removal</h3>
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
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Template Gallery</h3>
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
              Why Choose Nano Banana?
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
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Lightning Fast</h3>
              <p className="text-gray-600 mb-6">
                Generate high-quality images in seconds, not minutes. Our optimized AI models deliver results instantly.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center hover:shadow-md transition-shadow group">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-10 rounded-xl group-hover:animate-spin"></div>
                <span className="text-2xl relative z-10">🎨</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Artistic Variety</h3>
              <p className="text-gray-600 mb-6">
                From photorealistic to anime, illustrations to product shots - create any style you can imagine.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center hover:shadow-md transition-shadow group">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-400 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-10 rounded-xl group-hover:animate-bounce"></div>
                <span className="text-2xl relative z-10">💸</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Free to Start</h3>
              <p className="text-gray-600 mb-6">
                No upfront costs. Try our platform with free credits and only pay for what you use.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center hover:shadow-md transition-shadow group">
              <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-pink-400 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-10 rounded-xl group-hover:animate-pulse"></div>
                <span className="text-2xl relative z-10">🔒</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Privacy Focused</h3>
              <p className="text-gray-600 mb-6">
                Your creations are private by default. We respect your intellectual property and creativity.
              </p>
            </div>
          </div>
          
          <div className="mt-16 bg-gradient-to-br from-yellow-400 via-yellow-300 to-orange-300 rounded-2xl p-8 lg:p-12 text-center">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                Ready to Create Something Amazing?
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