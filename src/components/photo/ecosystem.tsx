import { ArrowUpRight, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Language } from '@/lib/photo/content';
import { ecosystemCopy, ecosystemProducts } from '@/lib/photo/ecosystem';
import { Brand } from './brand';
import { Shell } from './shell';

export function Ecosystem({ lang, slug }: { lang: Language; slug: string }) {
  const c = ecosystemCopy[lang];
  return <Shell lang={lang} slug={slug}>
    <main id="main" className="institution-page ecosystem-page">
      <Brand compact />
      <h1>{c.title}</h1>
      <p className="institution-lead">{c.description}</p>
      <div className="ecosystem-products">
        {ecosystemProducts.map(product => <article key={product.id} className="ecosystem-product">
          {product.id === 'pdf' ? <FileText className="text-primary" size={28} aria-hidden="true" /> : <Image className="text-primary" size={28} aria-hidden="true" />}
          <h2>{product.name}</h2>
          <p>{c[product.id]}</p>
          <Button asChild variant="outline">
            <a href={product.url} target="_blank" rel="noopener noreferrer" aria-label={`${c.visit}: ${product.name}`}>
              {c.visit}<ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </Button>
        </article>)}
      </div>
    </main>
  </Shell>;
}