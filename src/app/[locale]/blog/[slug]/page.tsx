import { Metadata } from 'next';
import Header from '@/components/common/Header';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getPostBySlug, getAllPostSlugs, getRegularPosts } from '@/lib/blog';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map((slug: string) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  
  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: `${post.title} | Nano Banana`,
    description: post.excerpt,
    metadataBase: new URL('https://easynanobanana.com'),
    alternates: {
      canonical: `/blog/${params.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `/blog/${params.slug}`,
      siteName: 'Nano Banana',
      locale: 'en_US',
      type: 'article',
      publishedTime: new Date(post.publishedAt).toISOString(),
      authors: ['Nano Banana Team'],
      images: post.image ? [
        {
          url: post.image,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default function BlogPost({ params }: Props) {
  const post = getPostBySlug(params.slug);
  const relatedPosts = getRegularPosts().slice(0, 2);

  if (!post) {
    notFound();
  }

  return (
    <>
      <Header />
      <article className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50">
        <div className="container mx-auto px-6 py-12">
          {/* Breadcrumb Navigation */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-600">
              <li>
                <Link href="/" className="hover:text-yellow-600 transition-colors">
                  Home
                </Link>
              </li>
              <li className="text-gray-400">/</li>
              <li>
                <Link href="/blog" className="hover:text-yellow-600 transition-colors">
                  Blog
                </Link>
              </li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-900 font-medium">{post.title}</li>
            </ol>
          </nav>

          {/* Hero Image */}
          {post.image && (
            <div className="max-w-6xl mx-auto mb-8">
              <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden shadow-xl">
                <Image 
                  src={post.image} 
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium text-sm inline-block mb-4">
                    {post.category}
                  </div>
                  <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                    🍌 {post.title}
                  </h1>
                </div>
              </div>
            </div>
          )}

          {/* Article Header */}
          <header className="max-w-4xl mx-auto mb-12">
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
              {!post.image && (
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-yellow-300 rounded-2xl transform rotate-1 opacity-20"></div>
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight relative">
                    🍌 {post.title}
                  </h1>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </time>
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <span>{post.readTime}</span>
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <span>By Nano Banana Team</span>
              </div>
              <p className="text-xl text-gray-700 leading-relaxed">
                {post.excerpt}
              </p>
            </div>
          </header>

          {/* Article Content */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
              <div className="prose prose-lg prose-gray max-w-none">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12 flex items-center">
                        <span className="bg-yellow-100 text-yellow-700 rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold mr-3">
                          {/* You can add section numbers here if needed */}
                        </span>
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-8">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-gray-700 leading-relaxed mb-6">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 pl-4">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-6 pl-4">
                        {children}
                      </ol>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="bg-yellow-50 rounded-lg p-6 mb-6 border border-yellow-200">
                        <div className="text-gray-700">
                          {children}
                        </div>
                      </blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-6">
                        {children}
                      </pre>
                    ),
                    strong: ({ children }) => (
                      <strong className="text-yellow-600 font-semibold">
                        {children}
                      </strong>
                    ),
                    a: ({ children, href }) => (
                      <Link 
                        href={href || '#'} 
                        className="inline-block bg-gray-900 text-white font-semibold px-8 py-3 rounded-full hover:bg-gray-800 transition-colors transform hover:scale-105 shadow-lg"
                      >
                        {children}
                      </Link>
                    ),
                  }}
                >
                  {post.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Related Articles */}
          {relatedPosts.length > 0 && (
            <aside className="max-w-4xl mx-auto mt-16">
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {relatedPosts.map((relatedPost: any) => (
                    <Link key={relatedPost.slug} href={relatedPost.href} className="group">
                      <div className="p-6 border border-gray-200 rounded-lg hover:border-yellow-300 transition-colors">
                        <h4 className="font-semibold text-gray-900 group-hover:text-yellow-600 mb-2">
                          {relatedPost.title}
                        </h4>
                        <p className="text-gray-600 text-sm">
                          {relatedPost.excerpt}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          )}
        </div>
      </article>
    </>
  );
}