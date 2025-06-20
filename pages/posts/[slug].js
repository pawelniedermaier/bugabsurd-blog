import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { serialize } from 'next-mdx-remote/serialize';
import { MDXRemote } from 'next-mdx-remote';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import HolographicQuote from '../../components/HolographicQuote';

// Funkcja pomocnicza do stylizacji statusów
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

const components = {
  img: (props) => (
    <div className="my-8">
      <Image width={1200} height={680} className="rounded-lg border border-gray-700/50" alt={props.alt} {...props} />
      <p className="text-xs text-center text-gray-500 mt-2">{props.alt}</p>
    </div>
  ),
  Strong: (props) => <strong className="font-bold text-white" {...props} />,
  HolographicQuote,
};

export async function getStaticPaths() {
  const postsDirectory = path.join(process.cwd(), 'posts');
  let filenames = [];
  try {
    filenames = fs.readdirSync(postsDirectory);
  } catch (error) {
    console.log("Could not find /posts directory, it's okay.");
  }
  const paths = filenames
    .filter(filename => filename.endsWith('.mdx'))
    .map(filename => ({
      params: {
        slug: encodeURIComponent(filename.replace(/\.mdx$/, '')),
      },
    }));
  return { paths, fallback: 'blocking' };
}

export async function getStaticProps({ params }) {
  const { slug } = params;
  const decodedSlug = decodeURIComponent(slug);
  const postsDirectory = path.join(process.cwd(), 'posts');
  try {
    const filenames = fs.readdirSync(postsDirectory);
    const allPosts = filenames
      .filter(filename => filename.endsWith('.mdx'))
      .map(filename => {
        const filePath = path.join(postsDirectory, filename);
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const { data } = matter(fileContents);
        return {
          slug: filename.replace(/\.mdx$/, ''),
          frontmatter: data,
        };
      });
    allPosts.sort((a, b) => {
      // Special handling for year 3069 - always put it first
      if (a.frontmatter.date.startsWith('3069')) return -1;
      if (b.frontmatter.date.startsWith('3069')) return 1;
      // Normal date comparison for other dates
      return new Date(b.frontmatter.date) - new Date(a.frontmatter.date);
    });
    const postIndex = allPosts.findIndex(post => post.slug === decodedSlug);
    const prevPost = allPosts[postIndex + 1] || null;
    const nextPost = allPosts[postIndex - 1] || null;
    const filePath = path.join(postsDirectory, `${decodedSlug}.mdx`);
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
    console.error('Error loading post:', error);
    return { notFound: true };
  }
}

export default function PostPage({ source, frontmatter, prevPost, nextPost }) {
  const [audioReady, setAudioReady] = useState(false);
  const audioContextRef = useRef(null);

  useEffect(() => {
    // Initialize audio context on component mount
    const initAudio = () => {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        console.log('Audio context initialized');
      } catch (error) {
        console.log('Failed to initialize audio context:', error);
      }
    };

    // Set audio as ready after user interaction
    const handleUserInteraction = async () => {
      if (audioContextRef.current) {
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        // Force resume and test audio
        try {
          const testOsc = audioContextRef.current.createOscillator();
          const testGain = audioContextRef.current.createGain();
          testGain.gain.setValueAtTime(0, audioContextRef.current.currentTime);
          testOsc.connect(testGain);
          testGain.connect(audioContextRef.current.destination);
          testOsc.start(audioContextRef.current.currentTime);
          testOsc.stop(audioContextRef.current.currentTime + 0.01);
        } catch (e) {
          console.log('Test audio failed:', e);
        }
      }
      setAudioReady(true);
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
    
    initAudio();
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  const playGlitchSound = async (type) => {
    if (!audioContextRef.current) {
      console.log('No audio context available');
      return;
    }

    try {
      // Force resume audio context
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      const filter = audioContextRef.current.createBiquadFilter();
      
      // Connect nodes
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      // Configure based on type
      switch (type) {
        case 'next':
          // Higher frequency for next post
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(400, audioContextRef.current.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(800, audioContextRef.current.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(1200, audioContextRef.current.currentTime + 0.2);
          oscillator.frequency.exponentialRampToValueAtTime(600, audioContextRef.current.currentTime + 0.3);
          break;
        case 'prev':
          // Lower frequency for previous post
          oscillator.type = 'square';
          oscillator.frequency.setValueAtTime(100, audioContextRef.current.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(50, audioContextRef.current.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(150, audioContextRef.current.currentTime + 0.2);
          oscillator.frequency.exponentialRampToValueAtTime(75, audioContextRef.current.currentTime + 0.3);
          break;
        case 'home':
          // Special oscillator for "Wróć do strumienia"
          oscillator.type = 'triangle';
          oscillator.frequency.setValueAtTime(300, audioContextRef.current.currentTime);
          oscillator.frequency.setValueAtTime(150, audioContextRef.current.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(450, audioContextRef.current.currentTime + 0.2);
          oscillator.frequency.setValueAtTime(200, audioContextRef.current.currentTime + 0.3);
          break;
        default:
          // Default glitch sound
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(200, audioContextRef.current.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(50, audioContextRef.current.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime + 0.2);
          oscillator.frequency.exponentialRampToValueAtTime(100, audioContextRef.current.currentTime + 0.3);
      }
      
      // Add filter for glitch effect
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1000, audioContextRef.current.currentTime);
      filter.frequency.exponentialRampToValueAtTime(200, audioContextRef.current.currentTime + 0.3);
      
      // Volume envelope
      gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContextRef.current.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.3);
      
      // Start and stop
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.3);
      
      console.log(`Playing ${type} glitch sound`);
    } catch (error) {
      console.log('Audio playback failed:', error);
    }
  };

  if (!frontmatter) {
    return <div>Ładowanie...</div>;
  }
  
  const statusClassName = getStatusStyles(frontmatter.status);

  return (
    <div className="min-h-screen p-4 sm:p-8 relative">
       <Head>
        <title>{`${frontmatter.title} :: bugabsurd.pl`}</title>
      </Head>
      <main className="max-w-3xl mx-auto">
        <header className="mb-12">
           <Link 
             href="/" 
             className="text-green-400 font-mono hover:underline glitch-interactive" 
             data-text="< Wróć do strumienia danych"
             onClick={() => playGlitchSound('home')}
           >
              {'<'} Wróć do strumienia danych
           </Link>
        </header>
        <article>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-4 font-mono !leading-tight glitch-text" data-text={frontmatter.title}>
            {frontmatter.title}
          </h1>
          <div className="border-t border-b border-gray-700 py-2 my-8 text-xs font-mono text-gray-500 flex flex-wrap gap-x-4">
            <span>[DATE: {frontmatter.date}]</span>
            <Link href={`/kategoria/${frontmatter.category.toLowerCase().replace(/ /g, '-')}`} className="hover:text-green-400 transition-colors font-bold">
              [CATEGORY: {frontmatter.category}]
            </Link>
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
            <Link 
              href={`/posts/${encodeURIComponent(prevPost.slug)}`} 
              className="text-gray-400 flex items-center glitch-interactive" 
              data-text="← Poprzedni log"
              onClick={() => playGlitchSound('prev')}
            >
                <i data-lucide="arrow-left" className="w-4 h-4 mr-2"></i> Poprzedni log
            </Link>
          ) : ( <div></div> )}
          <Link 
            href="/" 
            className="text-gray-400 flex items-center glitch-interactive" 
            data-text="Wróć do strumienia"
            onClick={() => playGlitchSound('home')}
          >
            <i data-lucide="layout-grid" className="w-4 h-4 mr-2"></i> Wróć do strumienia
          </Link>
          {nextPost ? (
            <Link 
              href={`/posts/${encodeURIComponent(nextPost.slug)}`} 
              className="text-gray-400 text-right flex items-center glitch-interactive" 
              data-text="Następny log →"
              onClick={() => playGlitchSound('next')}
            >
                Następny log <i data-lucide="arrow-right" className="w-4 h-4 ml-2"></i>
            </Link>
          ) : ( <div></div> )}
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
