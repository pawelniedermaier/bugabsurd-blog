import Head from 'next/head';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Ta funkcja znajduje wszystkie unikalne kategorie i tworzy dla nich ścieżki
export async function getStaticPaths() {
  const postsDirectory = path.join(process.cwd(), 'posts');
  const filenames = fs.readdirSync(postsDirectory);

  const categories = filenames.map(filename => {
    const filePath = path.join(postsDirectory, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContents);
    return data.category;
  });

  const uniqueCategories = [...new Set(categories)];
  const paths = uniqueCategories.map(cat => ({
    params: { kategoria: cat.toLowerCase().replace(/ /g, '-') },
  }));

  return {
    paths,
    fallback: false,
  };
}

// Ta funkcja pobiera posty dla konkretnej kategorii
export async function getStaticProps({ params }) {
  const { kategoria } = params;
  const postsDirectory = path.join(process.cwd(), 'posts');
  const filenames = fs.readdirSync(postsDirectory);

  const categoryPosts = filenames.map(filename => {
    const slug = filename.replace(/\.mdx$/, '');
    const filePath = path.join(postsDirectory, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    const postCategorySlug = data.category.toLowerCase().replace(/ /g, '-');

    if (postCategorySlug === kategoria) {
      const excerpt = content.substring(0, 150) + '...';
      return { slug, frontmatter: data, excerpt };
    }
    return null;
  }).filter(post => post !== null);
  
  const categoryName = categoryPosts.length > 0 ? categoryPosts[0].frontmatter.category : '';

  return { props: { posts: categoryPosts, categoryName } };
}

// To jest komponent, który wyświetla stronę kategorii
export default function CategoryPage({ posts, categoryName }) {
  return (
    <div className="min-h-screen p-4 sm:p-8 relative">
      <Head>
        <title>Kategoria: {categoryName} :: bugabsurd.pl</title>
      </Head>
      <div className="scanlines"></div>
      <main className="max-w-4xl mx-auto pb-16">
        <header className="mb-12">
          <Link href="/" className="text-green-400 font-mono hover:underline glitch-text" data-text="< Wróć do strumienia danych">
            {'<'} Wróć do strumienia danych
          </Link>
          <h1 className="text-3xl font-bold text-gray-100 mt-4 font-mono">
            Logi z kategorii: <span className="text-green-400">{categoryName}</span>
          </h1>
        </header>

        {/* Lista postów - taka sama jak na stronie głównej */}
        <div className="space-y-10">
          {posts.map((post) => (
            <div key={post.slug} className="font-mono text-sm sm:text-base">
              <div className="flex flex-wrap gap-x-4 text-gray-500">
                <span>[DATE: {post.frontmatter.date}]</span>
                <span>[CATEGORY: {post.frontmatter.category}]</span>
                {post.frontmatter.status && (
                   <span>[STATUS: <span className={post.frontmatter.status === 'KRYTYCZNY' || post.frontmatter.status === 'USZKODZONY' ? 'text-red-500 font-bold' : 'text-green-500'}>{post.frontmatter.status}</span>]</span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl mt-1">
                <Link href={`/posts/${post.slug}`} className="text-gray-200 hover:text-green-400 transition-colors duration-300 glitch-text" data-text={post.frontmatter.title}>
                    {'>'} {post.frontmatter.title}
                </Link>
              </h2>
              <p className="text-gray-400 mt-2 text-base leading-relaxed font-sans">
                {post.excerpt}
              </p>
              <div className="flex flex-wrap gap-x-4 text-gray-500 mt-3">
                 <Link href={`/posts/${post.slug}`} className="text-green-400 hover:underline">
                    [ODCZYTAJ CAŁY LOG...]
                 </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}