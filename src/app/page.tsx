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