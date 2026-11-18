import { sourceCode } from '@/lib/photo/source-code';
import { Link } from '@tanstack/react-router';
import { copy, institutional, langIndex, type Language, type Institutional } from '@/lib/photo/content';
import { contactEmail, institutionCopy } from '@/lib/photo/institution-copy';
import { Brand } from './brand';
import { Shell } from './shell';
export function Institution({ lang, slug, page }: { lang: Language; slug: string; page: Institutional }) {
  const c = copy[lang];
  const src = sourceCode(lang);
  const content = institutionCopy[lang][page];
  return <Shell lang={lang} slug={slug}>
    <main id="main" className="institution-page">
      <Brand compact />
      <h1>{c[page]}{page === 'about' ? ' MOLVIRA PHOTO' : ''}</h1>
      <p className="institution-lead">{content.intro}</p>
      <div className="space-y-8">
        {content.sections.map((section, index) => <section key={section.heading} aria-labelledby={`institution-section-${index}`}>
          <h2 id={`institution-section-${index}`} className="text-lg font-semibold leading-relaxed text-foreground">{section.heading}</h2>
          {section.paragraphs.map(paragraph => <p key={paragraph} className="mt-3 text-[15px] leading-[1.9] text-muted-foreground max-sm:text-sm">{paragraph}</p>)}
          {section.email && <p className="mt-3"><a className="break-all text-primary underline underline-offset-4" href={`mailto:${contactEmail}`}>{contactEmail}</a></p>}
          {section.lovablePrivacy && <p className="mt-3"><a className="text-primary underline underline-offset-4" href="https://lovable.dev/privacy" target="_blank" rel="noopener noreferrer">{section.lovablePrivacy}</a></p>}
          {section.googlePrivacy && <p className="mt-3"><a className="text-primary underline underline-offset-4" href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">{section.googlePrivacy}</a></p>}
        </section>)}
      </div>
      {src && (page === 'about' || page === 'privacy') && <p className="institution-paragraph">{src.notice} <a href={src.url} target="_blank" rel="noopener">{src.link}</a></p>}
      <nav className="mt-10 flex flex-wrap gap-x-5 gap-y-3 border-t border-border pt-6 text-sm" aria-label={c.legal}>
        {(['about', 'contact', 'privacy', 'terms', 'cookies'] as const).filter(key => key !== page).map(key => <Link key={key} className="text-primary underline underline-offset-4" to="/$lang/$page" params={{ lang, page: institutional[key][langIndex(lang)] }}>{c[key]}</Link>)}
      </nav>
      <p className="institution-philosophy">Easy · Free · Private.</p>
    </main>
  </Shell>;
}
