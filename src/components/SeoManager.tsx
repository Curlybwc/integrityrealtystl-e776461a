import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { DEFAULT_OG_IMAGE, SITE_NAME, resolveSeo } from "@/lib/seo";

function setMeta(selector: string, attr: string, value: string | undefined) {
  const el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) return;
  if (value === undefined) el.removeAttribute(attr);
  else el.setAttribute(attr, value);
}

function ensureMeta(selector: string, create: () => HTMLMetaElement) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  return el;
}

/**
 * Applies the per-route title, description, canonical and Open Graph
 * values from src/lib/seo.ts on every navigation. The static tags in
 * index.html are the home-page fallback for crawlers that do not run
 * JavaScript; this manager keeps them correct for everyone else.
 */
export default function SeoManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    const seo = resolveSeo(pathname);
    document.title = seo.title;

    setMeta('meta[name="description"]', "content", seo.description);
    ensureMeta('meta[name="robots"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("name", "robots");
      return m;
    }).setAttribute("content", seo.indexable ? "index,follow" : "noindex,nofollow");

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (seo.canonical) {
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.setAttribute("rel", "canonical");
        document.head.appendChild(canonical);
      }
      canonical.setAttribute("href", seo.canonical);
    } else {
      canonical?.remove();
    }

    setMeta('meta[property="og:title"]', "content", seo.title);
    setMeta('meta[property="og:description"]', "content", seo.description);
    setMeta('meta[property="og:url"]', "content", seo.canonical);
    setMeta('meta[property="og:image"]', "content", DEFAULT_OG_IMAGE);
    setMeta('meta[property="og:site_name"]', "content", SITE_NAME);
    setMeta('meta[name="twitter:title"]', "content", seo.title);
    setMeta('meta[name="twitter:description"]', "content", seo.description);
    setMeta('meta[name="twitter:image"]', "content", DEFAULT_OG_IMAGE);
  }, [pathname]);

  return null;
}
