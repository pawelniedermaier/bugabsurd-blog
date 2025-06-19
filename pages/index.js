import Head from 'next/head';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import strip from 'strip-markdown';

// Ta funkcja teraz szuka specjalnego paragrafu, aby stworzyć zajawkę
export async function getStaticProps() {
  const postsDirectory = path.join(process.cwd(), 'posts');
  let posts = [];

  if (fs.existsSync(postsDirectory)) {
    const filenames = fs.readdirSync(postsDirectory);

    posts = filenames.map(filename => {
      if (!filename.endsWith('.mdx')) return null;
      const slug = filename.replace(/\.mdx$/, '');
      const filePath = path.join(postsDirectory, filename);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      
      const { data, content } = matter(fileContents);

      // === NOWA LOGIKA - POBIERANIE ZAJAWKI Z <p className="leadin-paragraph"> ===
      let excerpt = '';
      const leadinRegex = /<p className="leadin-paragraph">(.*?)<\/p>/s;
      const leadinMatch = content.match(leadinRegex);

      if (leadinMatch && leadinMatch[1]) {
        // 1. Znaleziono specjalny paragraf. Używamy jego treści.
        // Czyścimy go z wewnętrznych tagów (np. <strong>) dla pewności.
        excerpt = leadinMatch[1].replace(/<[^>]*>/g, '').trim().replace(/\s+/g, ' ');
      } else {
        // 2. Fallback: Jeśli nie ma specjalnego paragrafu, użyj starej metody.
        const processedContent = remark().use(strip).processSync(content);
        const plainTextContent = String(processedContent);
        excerpt = plainTextContent.trim().replace(/\s+/g, ' ').substring(0, 150) + '...';
      }

      return {
        slug,
        frontmatter: data,
        excerpt,
      };
    }).filter(post => post !== null);

    posts.sort((a, b) => {
      // Special handling for year 3069 - always put it first
      if (a.frontmatter.date.startsWith('3069')) return -1;
      if (b.frontmatter.date.startsWith('3069')) return 1;
      // Normal date comparison for other dates
      return new Date(b.frontmatter.date) - new Date(a.frontmatter.date);
    });
  }

  return {
    props: {
      posts,
    },
    revalidate: 60,
  };
}


// Komponent HomePage pozostaje bez zmian, więc nie musisz go kopiować
// Poniżej jest tylko dla pełnego kontekstu pliku
export default function HomePage({ posts = [] }) {
  // ... cała reszta Twojego komponentu HomePage ...
  // ... nie musisz nic tu zmieniać ...
  return (
    <div className="min-h-screen p-4 sm:p-8 relative">
      <Head>
        <title>bugabsurd.pl :: Data Stream</title>
      </Head>
      <div className="scanlines"></div>

      <section className="h-screen/2 flex flex-col justify-center items-center text-center">
        <div className="font-mono text-lg md:text-2xl space-y-4 text-gray-300">
            <p className="manifesto-line" style={{ animationDelay: '0.5s' }}>Rzeczywistość jest błędem w oprogramowaniu.</p>
            <p className="manifesto-line" style={{ animationDelay: '1.5s' }}>Logika to tylko tymczasowa łatka.</p>
            <p className="manifesto-line" style={{ animationDelay: '2.5s' }}>
              Ten blog to b<span className="glitchy-letter" data-glitch-text="u">ó</span>g w systemie.
            </p>
            <p className="manifesto-line text-2xl md:text-4xl text-white font-bold" style={{ animationDelay: '3.5s' }}>
              Witaj w <span className="text-green-400">cyber surrealiźmie</span>.
            </p>
        </div>
        <div className="font-mono text-sm md:text-base text-gray-500 mt-12 space-y-2">
            <p className="manifesto-line" style={{ animationDelay: '5.0s' }}>
                <span className="typewriter-text" style={{ width: '0', animationDelay: '5.2s' }}>{'>'} URUCHAMIANIE PROTOKOŁU: BUG_ABSURD...</span>
            </p>
            <p className="manifesto-line" style={{ animationDelay: '7.5s' }}>
                 <span className="typewriter-text" style={{ width: '0', animationDelay: '7.7s' }}>{'>'} ...transmisja w toku_</span>
            </p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto pb-16">
        <header className="mb-12">
          <h1 className="text-2xl font-bold text-green-400 font-mono glitch-interactive" data-text="bugabsurd.pl">
            bugabsurd.pl
          </h1>
          <p className="text-sm text-gray-500 font-mono">{'>'} ODCZYT STRUMIENIA DANYCH...</p>
        </header>

        <div className="space-y-10">
          {posts.map((post) => {
            const statusClassName = getStatusStyles(post.frontmatter.status);
            return (
              <div key={post.slug} className="font-mono text-sm sm:text-base">
                <div className="flex flex-wrap gap-x-4 text-gray-500">
                  <span>[DATE: {post.frontmatter.date}]</span>
                  <Link href={`/kategoria/${post.frontmatter.category.toLowerCase().replace(/ /g, '-')}`} className="hover:text-green-400 transition-colors font-bold glitch-interactive" data-text={`[CATEGORY: ${post.frontmatter.category}]`}>
                    [CATEGORY: {post.frontmatter.category}]
                  </Link>
                  {post.frontmatter.status && (
                     <span>[STATUS: <span className={`${statusClassName} glitch-interactive`} data-text={post.frontmatter.status}>{post.frontmatter.status}</span>]</span>
                  )}
                </div>
                <h2 className="text-lg sm:text-xl mt-1">
                <Link href={`/posts/${encodeURIComponent(post.slug)}`} className="text-gray-200 hover:text-green-400 transition-colors duration-300 glitch-interactive" data-text={post.frontmatter.title}>
    {'>'} {post.frontmatter.title}
</Link>
                </h2>
                <p className="text-gray-400 mt-2 text-base leading-relaxed font-sans">
                  {post.excerpt}
                </p>
                <div className="flex flex-wrap gap-x-4 text-gray-500 mt-3">
                   <Link href={`/posts/${encodeURIComponent(post.slug)}`} className="text-green-400 hover:underline glitch-interactive" data-text="[ODCZYTAJ CAŁY LOG...]">
                      [ODCZYTAJ CAŁY LOG...]
                   </Link>
                </div>
              </div>
            );
          })}
        </div>

        <section className="my-24 py-16">
            <h2 className="text-2xl font-bold text-green-400 font-mono text-center mb-12 glitch-interactive" data-text="// OSOBA_ZA_KONSOLĄ">
                // OSOBA_ZA_KONSOLĄ
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-12 items-center">
                <div className="md:col-span-2">
                    <img 
                        src="/images/operator.jpg"
                        alt="Operator przy konsoli" 
                        className="rounded-lg shadow-lg border border-gray-700/50 transition-all duration-500 opacity-70 filter grayscale hover:grayscale-0 hover:opacity-100 hover:scale-105"
                    />
                </div>
                <div className="md:col-span-3 text-gray-300">
                    <h3 className="text-xl font-bold text-white font-mono mb-4">Paweł: operator tego absurdu.</h3>
                    <div className="space-y-3 text-lg leading-relaxed">
                        <p>Trochę filozof, trochę dzik-artysta i inżynier.</p>
                        <p>Blog to mój plac zabaw na styku <span className="text-green-400 font-semibold">cyberpunka i surrealizmu</span>.</p>
                        <p>Lubię prowokować do myślenia. Nie ma tu cenzury. Latamy jak chcemy i gdzie chcemy.</p>
                    </div>
                </div>
            </div>
        </section>
        
        <footer className="mt-20 text-center text-gray-600 font-mono text-xs">
          <p>// KONIEC TRANSMISJI //</p>
        </footer>
      </main>
    </div>
  );
}

// Musiałem dodać tę funkcję, bo jej brakowało w Twoim pliku
const getStatusStyles = (status) => {
  if (!status) return '';
  switch (status.toUpperCase()) {
    case 'KRYTYCZNY':
    case 'USZKODZONY':
      return 'text-red-500 font-bold';
    case 'ZAGROŻENIE':
      return 'text-orange-400 font-bold';
    case 'MISTYCZNY':
      return 'text-violet-400 font-bold';
    case 'STABILNY':
    default:
      return 'text-green-500';
  }
};