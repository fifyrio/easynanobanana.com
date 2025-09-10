import { Metadata } from 'next';
import Header from '@/components/common/Header';
import Link from 'next/link';

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

const blogPosts = [
  {
    title: 'When "Photos Don\'t Lie" Stops Making Sense',
    excerpt: 'Explore how AI photo editing tools are transforming image manipulation from complex software to simple text prompts, making creative editing accessible to everyone.',
    href: '/blog/when-photos-dont-lie-stops-making-sense',
    publishedAt: 'September 10, 2025',
    readTime: '8 min read',
    category: 'AI Technology',
    featured: true,
  },
  // Placeholder for future posts
  {
    title: 'The Complete Guide to AI Background Removal',
    excerpt: 'Learn how to perfectly remove backgrounds from any image using AI technology. Step-by-step tutorial with tips and best practices.',
    href: '/blog/ai-background-removal-guide',
    publishedAt: 'Coming Soon',
    readTime: '6 min read',
    category: 'Tutorial',
    featured: false,
  },
  {
    title: 'The Future of Creative Tools',
    excerpt: 'Explore upcoming innovations in AI-powered creative software and their impact on the creative industry.',
    href: '/blog/future-of-creative-tools',
    publishedAt: 'Coming Soon',
    readTime: '5 min read',
    category: 'Technology',
    featured: false,
  },
];

export default function BlogPage() {
  const featuredPost = blogPosts.find(post => post.featured);
  const regularPosts = blogPosts.filter(post => !post.featured);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="container mx-auto px-6 py-12">
          
          {/* Page Header */}
          <header className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              AI Photo Editing Blog
            </h1>
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
                  <div className="p-8 md:p-12">
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full font-medium">
                        {featuredPost.category}
                      </span>
                      <time dateTime="2025-09-10">{featuredPost.publishedAt}</time>
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      <span>{featuredPost.readTime}</span>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 group-hover:text-purple-600 transition-colors">
                      {featuredPost.title}
                    </h3>
                    <p className="text-lg text-gray-700 leading-relaxed mb-6">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex items-center text-purple-600 font-semibold group-hover:text-purple-700">
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
              {regularPosts.map((post, index) => (
                <Link key={index} href={post.href} className="group">
                  <article className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow h-full">
                    <div className="p-6">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">
                          {post.category}
                        </span>
                        <span>{post.readTime}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-gray-700 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <time className="text-sm text-gray-500">{post.publishedAt}</time>
                        <div className="flex items-center text-purple-600 text-sm font-medium group-hover:text-purple-700">
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
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 md:p-12 text-white text-center">
              <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
              <p className="text-xl mb-8 opacity-90">
                Get the latest AI photo editing tips and insights delivered to your inbox.
              </p>
              <div className="max-w-md mx-auto flex gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500"
                />
                <button className="bg-white text-purple-600 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </section>

          {/* Back to Home */}
          <div className="text-center mt-16">
            <Link 
              href="/" 
              className="inline-flex items-center text-purple-600 hover:text-purple-700 font-semibold"
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