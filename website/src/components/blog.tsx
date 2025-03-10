import React from 'react';
import { ArrowRight, Calendar } from 'lucide-react';
import Link from 'next/link';
import type { MdxFile } from 'nextra';
import { getPageMap } from 'nextra/page-map';

// Define proper types
interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  route: string;
}

interface PostProps {
  post: BlogPost;
}

// Blog post card component
const BlogPostCard = ({ post }: PostProps) => {
  return (
    <div className="group relative">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-500 rounded-2xl blur opacity-0 group-hover:opacity-25 transition duration-300"></div>
      <div className="relative flex flex-col h-full bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="flex-1 p-6 flex flex-col">
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <Calendar size={14} className="mr-1" />
            <span>{post.date}</span>
          </div>
          
          <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-purple-700 transition-colors">
            {post.title}
          </h3>
          
          <p className="text-gray-600 mb-4">
            {post.excerpt}
          </p>
          <div className="flex-1"></div>
          <div className="mt-auto">
            <Link 
              href={post.route}
              className="inline-flex items-center text-purple-700 font-medium group-hover:text-purple-900 transition-colors"
            >
              Read more
              <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// Featured post component
const FeaturedPost = ({ post }: PostProps) => {
  return (
    <div className="relative overflow-hidden rounded-2xl shadow-xl mb-16">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 to-blue-900/90"></div>      
      <div className="relative z-10 p-8 md:p-12 text-white max-w-3xl">        
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          {post.title}
        </h2>
        
        <p className="text-lg md:text-xl text-gray-200 mb-6">
          {post.excerpt}
        </p>
        
        <div className="flex items-center text-gray-300 mb-6">
          <Calendar size={16} className="mr-1" />
          <span>{post.date}</span>
        </div>
        
        <Link 
          href={post.route}
          className="inline-flex items-center justify-center px-6 py-3 bg-white text-purple-800 font-medium rounded-full shadow-lg hover:bg-gray-100 transition-colors"
        >
          Read Featured Post
          <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </div>
    </div>
  );
};

// Animated blobs for the background
const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 -z-10">
      {/* Purple blob */}
      <div className="absolute top-70 left-8 w-64 h-64 bg-purple-500 opacity-10 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
      
      {/* Blue blob */}
      <div className="absolute top-32 -right-8 w-80 h-80 bg-blue-500 opacity-10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
      
      {/* Orange blob */}
      <div className="absolute bottom-24 left-20 w-72 h-72 bg-orange-400 opacity-10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
    </div>
  );
};

const BlogOverview = async () => {
  // Fetch real blog posts from MDX files
  const pageMap = (await getPageMap(`/blog`)) as unknown as MdxFile[];
  
  // Transform MDX files into blog post format
  const blogPosts: BlogPost[] = pageMap
    .filter(page => page.name !== 'index')
    .map(page => {
      const { title, description, timestamp } = page.frontMatter || {};
      
      const date = timestamp 
        ? new Date(timestamp).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })
        : 'No date';
      
      return {
        id: page.route,
        title: title || 'Untitled',
        excerpt: description || 'No description available',
        date,
        route: page.route
      };
    });
  
  // Get the first post as featured (if available)
  const featuredPost = blogPosts.length > 0 ? blogPosts[0] : null;
  
  // Remove featured post from regular listing
  const regularPosts = featuredPost 
    ? blogPosts.filter(post => post.id !== featuredPost.id) 
    : blogPosts;
  
  return (
    <div className="min-h-screen relative">      
      <AnimatedBackground />
      
      <div className="pt-20 pb-16 sm:pt-24 lg:pt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Blog Header */}
          <div className="text-center mb-16">
            <div className="inline-block px-6 py-2 border border-purple-200 rounded-full bg-purple-50 text-purple-800 text-sm font-medium mb-6">
              Our Blog
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-6">
              Latest News & Insights
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tips, tutorials, and updates from the EmbedPDF team to help you build better PDF experiences.
            </p>
          </div>
          
          {/* Featured Post */}
          {featuredPost && (
            <FeaturedPost post={featuredPost} />
          )}
          
          {/* Blog Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularPosts.length > 0 ? (
              regularPosts.map(post => (
                <BlogPostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <div className="text-2xl font-bold text-gray-400">No posts found</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogOverview;