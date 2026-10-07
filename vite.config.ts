import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "node:path";
import { SITE } from "./site.config";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/**
 * Injects SEO + Google Search Console tags into index.html and emits
 * robots.txt and sitemap.xml, all driven by site.config.ts.
 */
function seo(): Plugin {
  const url = SITE.siteUrl.replace(/\/$/, "");
  return {
    name: "aimagino-seo",
    transformIndexHtml(html) {
      const tags = [
        SITE.googleSiteVerification && `<meta name="google-site-verification" content="${esc(SITE.googleSiteVerification)}" />`,
        `<link rel="canonical" href="${url}/" />`,
        `<meta name="robots" content="index, follow" />`,
        `<meta property="og:type" content="website" />`,
        `<meta property="og:site_name" content="AImagino Solution" />`,
        `<meta property="og:title" content="${esc(SITE.title)}" />`,
        `<meta property="og:description" content="${esc(SITE.description)}" />`,
        `<meta property="og:url" content="${url}/" />`,
        `<meta property="og:image" content="${url}/og-image.png" />`,
        `<meta property="og:image:width" content="1200" />`,
        `<meta property="og:image:height" content="630" />`,
        `<meta name="twitter:card" content="summary_large_image" />`,
        `<meta name="twitter:title" content="${esc(SITE.title)}" />`,
        `<meta name="twitter:description" content="${esc(SITE.description)}" />`,
        `<meta name="twitter:image" content="${url}/og-image.png" />`,
        `<script type="application/ld+json">${JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "AImagino AI Real Estate",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          description: SITE.description,
          url: `${url}/`,
          publisher: { "@type": "Organization", name: "AImagino Solution" },
        })}</script>`,
      ].filter(Boolean);
      return html
        .replace(/<title>.*?<\/title>/, `<title>${esc(SITE.title)}</title>`)
        .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(SITE.description)}" />`)
        .replace("</head>", `    ${tags.join("\n    ")}\n  </head>`);
    },
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "robots.txt", source: `User-agent: *\nAllow: /\n\nSitemap: ${url}/sitemap.xml\n` });
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${url}/</loc>\n    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n`,
      });
    },
  };
}

// `npm run build:single` produces one self-contained HTML file (dist-single/index.html)
// that can be emailed, hosted anywhere, or opened directly from disk.
export default defineConfig(({ mode }) => ({
  plugins: [react(), seo(), ...(mode === "single" ? [viteSingleFile()] : [])],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  build: mode === "single" ? { outDir: "dist-single", chunkSizeWarningLimit: 4000 } : { chunkSizeWarningLimit: 1500 },
}));
