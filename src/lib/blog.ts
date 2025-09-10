import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const postsDirectory = path.join(process.cwd(), 'content/blog')

export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  publishedAt: string
  readTime: string
  category: string
  featured: boolean
  image?: string
  content: string
  href: string
}

export function getAllPostSlugs() {
  if (!fs.existsSync(postsDirectory)) {
    return []
  }
  const fileNames = fs.readdirSync(postsDirectory)
  return fileNames
    .filter(fileName => fileName.endsWith('.md') || fileName.endsWith('.mdx'))
    .map(fileName => fileName.replace(/\.(md|mdx)$/, ''))
}

export function getPostBySlug(slug: string): BlogPost | null {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)

    return {
      slug,
      title: data.title || '',
      excerpt: data.excerpt || '',
      publishedAt: data.publishedAt || '',
      readTime: data.readTime || '',
      category: data.category || '',
      featured: data.featured || false,
      image: data.image || undefined,
      content,
      href: `/blog/${slug}`
    }
  } catch (error) {
    console.error(`Error reading post ${slug}:`, error)
    return null
  }
}

export function getAllPosts(): BlogPost[] {
  const slugs = getAllPostSlugs()
  const posts = slugs
    .map(slug => getPostBySlug(slug))
    .filter((post): post is BlogPost => post !== null)
    .sort((a, b) => {
      // Sort by publishedAt date, newest first
      const dateA = new Date(a.publishedAt)
      const dateB = new Date(b.publishedAt)
      return dateB.getTime() - dateA.getTime()
    })

  return posts
}

export function getFeaturedPost(): BlogPost | null {
  const posts = getAllPosts()
  return posts.find(post => post.featured) || null
}

export function getRegularPosts(): BlogPost[] {
  const posts = getAllPosts()
  return posts.filter(post => !post.featured)
}