import { Metadata } from 'next';
import Header from '@/components/common/Header';
import Link from 'next/link';
import Image from 'next/image';
import { getAllPosts, getFeaturedPost, getRegularPosts } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Blog - AI Photo Editing Insights & Tutorials | Nano Banana',
  description: 'Discover the latest insights, tutorials, and trends in AI photo editing. Learn how to make the most of artificial intelligence tools for image manipulation and creative editing.',
  metadataBase: new URL('https://easynanobanana.com'),
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: 'Blog - AI Photo Editing Insights & Tutorials',
    description: 'Discover the latest insights, tutorials, and trends in AI photo editing.',
    url: '/blog',
    siteName: 'Nano Banana',
    locale: 'en_US',
    type: 'website',
  },
  keywords: [
    'AI photo editing blog',
    'image editing tutorials',
    'artificial intelligence photography',
    'photo manipulation guides',
    'creative editing tips',
    'AI technology insights'
  ],
};

// Blog posts are now loaded from Markdown files

export default function BlogPage() {
  const featuredPost = getFeaturedPost();
  const allPosts = getAllPosts();

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50">
        <div className="container mx-auto px-6 py-12">
          
          {/* Page Header */}
          <header className="text-center mb-16">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-yellow-300 rounded-2xl transform rotate-1 opacity-20"></div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 relative bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                🍌 AI Photo Editing Blog
              </h1>
            </div>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Discover the latest insights, tutorials, and trends in AI-powered photo editing. 
              Learn how artificial intelligence is revolutionizing creative image manipulation.
            </p>
          </header>

          {/* Featured Article */}
          {featuredPost && (
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Featured Article</h2>
              <Link href={featuredPost.href} className="group">
                <article className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  {featuredPost.image && (
                    <div className="relative h-64 md:h-80 overflow-hidden">
                      <Image 
                        src={featuredPost.image} 
                        alt={featuredPost.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute top-4 left-4">
                        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium text-sm">
                          {featuredPost.category}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="p-8 md:p-12">
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      {!featuredPost.image && (
                        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium">
                          {featuredPost.category}
                        </span>
                      )}
                      <time dateTime={featuredPost.publishedAt}>{new Date(featuredPost.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      <span>{featuredPost.readTime}</span>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 group-hover:text-yellow-600 transition-colors">
                      {featuredPost.title}
                    </h3>
                    <p className="text-lg text-gray-700 leading-relaxed mb-6">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex items-center text-yellow-600 font-semibold group-hover:text-yellow-700 bg-yellow-50 hover:bg-yellow-100 px-4 py-2 rounded-lg inline-flex transition-all">
                      Read Article
                      <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </article>
              </Link>
            </section>
          )}

          {/* Regular Articles Grid */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">All Articles</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {allPosts.map((post: any, index: number) => (
                <Link key={index} href={post.href} className="group">
                  <article className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow h-full">
                    <div className="p-6">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">
                          {post.category}
                        </span>
                        <span>{post.readTime}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-yellow-600 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-gray-700 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <time className="text-sm text-gray-500">{new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                        <div className="flex items-center text-yellow-600 text-sm font-medium group-hover:text-yellow-700">
                          Read More
                          <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>

          {/* Newsletter Signup */}
          <section className="mt-20">
            <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl p-8 md:p-12 text-gray-900 text-center shadow-xl">
              <h2 className="text-3xl font-bold mb-4">🍌 Stay Updated</h2>
              <p className="text-xl mb-8 opacity-90">
                Get the latest AI photo editing tips and insights delivered to your inbox.
              </p>
              <div className="max-w-md mx-auto flex gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 border-2 border-white focus:border-yellow-200 focus:outline-none"
                />
                <button className="bg-gray-900 text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors shadow-md">
                  Subscribe
                </button>
              </div>
            </div>
          </section>

          {/* Back to Home */}
          <div className="text-center mt-16">
            <Link 
              href="/" 
              className="inline-flex items-center text-yellow-600 hover:text-yellow-700 font-semibold bg-yellow-50 hover:bg-yellow-100 px-4 py-2 rounded-lg transition-all"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}