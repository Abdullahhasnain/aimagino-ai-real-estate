/**
 * Public website settings used at build time (SEO + Google Search Console).
 *
 * Each value can also be set as an environment variable in Netlify
 * (Site configuration → Environment variables), which overrides this file:
 *   SITE_URL, GOOGLE_SITE_VERIFICATION
 */
export const SITE = {
  /** Your live address, no trailing slash. Update after choosing the Netlify site name or custom domain. */
  siteUrl: process.env.SITE_URL || "https://aimagino-realestate.netlify.app",

  /**
   * Google Search Console → Add property → URL prefix → "HTML tag" method.
   * Paste ONLY the content value, e.g. for
   *   <meta name="google-site-verification" content="AbC123xyz..." />
   * paste "AbC123xyz...".
   */
  googleSiteVerification: process.env.GOOGLE_SITE_VERIFICATION || "",

  title: "AImagino AI Real Estate | AI Lead Agent for Real Estate Agencies",
  description:
    "AI-powered lead response, qualification, follow-up and CRM automation for real estate teams in Dubai and the UAE. Turn property enquiries into qualified appointments.",
};
