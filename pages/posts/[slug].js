import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { serialize } from 'next-mdx-remote/serialize';
import { MDXRemote } from 'next-mdx-remote';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Definiujemy niestandardowe komponenty, np. do optymalizacji obrazków
const components = {
  img: (props) => (
    <div className="my-8">
      <Image width={1200} height={680} className="rounded-lg border border-gray-700/50" alt={props.alt} {...props} />
      <p className="text-xs text-center text-gray-500 mt-2">{props.alt}</p>
    </div>
  ),
};

// Ta funkcja mówi Next.js, które strony postów ma wygenerować
export async function getStaticPaths() {
  const postsDirectory = path.join(process.cwd(), 'posts');
  let filenames = [];
  if (fs.existsSync(postsDirectory)) {
    filenames = fs.readdirSync(postsDirectory);
  }
  const paths = filenames
    .filter(filename => filename.endsWith('.mdx'))
    .map(filename => ({
      params: {
        slug: filename.replace(/\.mdx$/, ''),
      },
    }));
  return { paths, fallback: false };
}

// Ta funkcja pobiera dane dla konkretnego posta
export async function getStaticProps({ params }) {
  const { slug } = params;
  const postsDirectory = path.join(process.cwd(), 'posts');
  
  // Logika do znalezienia poprzedniego i następnego posta
  const filenames = fs.readdirSync(postsDirectory);
  const allPosts = filenames.map(filename => {
    const slug = filename.replace(/\.mdx$/, '');
    const filePath = path.join(postsDirectory, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContents);
    return { slug, frontmatter: data };
  });

  allPosts.sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date));

  const postIndex = allPosts.findIndex(post => post.slug === slug);
  const prevPost = allPosts[postIndex + 1] || null;
  const nextPost = allPosts[postIndex - 1] || null;

  // Wczytanie właściwej treści posta
  const filePath = path.join(postsDirectory, `${slug}.mdx`);
  
  try {
    const source = fs.readFileSync(filePath, 'utf8');
    const { content, data } = matter(source);
    const mdxSource = await serialize(content, { parseFrontmatter: false });
    return { 
      props: { 
        source: mdxSource, 
        frontmatter: data,
        prevPost,
        nextPost,
      },
      revalidate: 60,
    };
  } catch (error) {
    return { notFound: true };
  }
}

// Komponent strony posta z finalną nawigacją
export default function PostPage({ source, frontmatter, prevPost, nextPost }) {
  const statusClassName = frontmatter.status === 'KRYTYCZNY' || frontmatter.status === 'USZKODZONY' 
    ? 'text-red-500 font-bold' 
    : 'text-green-500';

  return (
    <div className="min-h-screen p-4 sm:p-8 relative">
       <Head>
        <title>{`${frontmatter.title} :: bugabsurd.pl`}</title>
      </Head>
      <div className="scanlines"></div>
      <main className="max-w-3xl mx-auto">
        <header className="mb-12">
           <Link href="/" className="text-green-400 font-mono hover:underline glitch-text" data-text="< Wróć do strumienia danych">
              {'<'} Wróć do strumienia danych
           </Link>
        </header>
        <article>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-4 font-mono !leading-tight">
            {frontmatter.title}
          </h1>
          <div className="border-t border-b border-gray-700 py-2 my-8 text-xs font-mono text-gray-500 flex flex-wrap gap-x-4">
            <span>[DATE: {frontmatter.date}]</span>
            <span>[CATEGORY: {frontmatter.category}]</span>
            {frontmatter.status && (
              <span>[STATUS: <span className={statusClassName}>{frontmatter.status}</span>]</span>
            )}
          </div>
          <div className="prose prose-invert prose-lg text-gray-300 max-w-none">
             <MDXRemote {...source} components={components} />
          </div>
        </article>

        <nav className="mt-16 pt-8 border-t border-gray-700/50 flex justify-between items-center font-mono">
          {prevPost ? (
            <Link href={`/posts/${prevPost.slug}`} className="text-gray-400 hover:text-green-400 transition-colors flex items-center">
                <i data-lucide="arrow-left" className="w-4 h-4 mr-2"></i> Poprzedni log
            </Link>
          ) : (
            <div></div> 
          )}
          <Link href="/" className="text-gray-400 hover:text-green-400 transition-colors flex items-center">
            <i data-lucide="layout-grid" className="w-4 h-4 mr-2"></i> Wróć do strumienia
          </Link>
          {nextPost ? (
            <Link href={`/posts/${nextPost.slug}`} className="text-gray-400 hover:text-green-400 transition-colors text-right flex items-center">
                Następny log <i data-lucide="arrow-right" className="w-4 h-4 ml-2"></i>
            </Link>
          ) : (
            <div></div>
          )}
        </nav>

        <footer className="mt-16 text-center text-gray-600 font-mono text-xs">
          <p>// KONIEC TRANSMISJI_</p>
        </footer>
      </main>
      <style jsx global>{`
        .prose { font-family: 'Inter', sans-serif; }
        .prose a { color: #48bb78; text-decoration: none; }
        .prose a:hover { text-decoration: underline; }
        .prose h2 { font-family: 'Source Code Pro', monospace; color: #f7fafc; }
        .prose strong { color: #f0fdf4; }
        .prose blockquote { border-left-color: #48bb78; color: #a0aec0; }
        .prose code { background-color: #2d3748; padding: 2px 4px; border-radius: 4px; }
        .prose pre { border: 1px solid #4a5568; background-color: #1a202c; padding: 1em; border-radius: 8px; }
      `}</style>
    </div>
  );
}