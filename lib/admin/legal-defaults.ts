/**
 * Seed HTML for the editable Terms & Privacy pages - imported from the
 * original hardcoded pages. After first run, the database is the source of truth.
 */

// Defaults follow the v3 design's expanded drafts (July 2026). A document saved in
// Admin → Legal always overrides these. Drafts for review, not legal advice.
export const TERMS_DEFAULT_HTML = `
<h2>Agreement to terms</h2>
<p>By accessing and using the Marrelay website, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
<h2>Services</h2>
<p>Marrelay provides digital services including web development, data analytics, social media marketing, SEO and engineering drawings. All services are subject to separate service agreements.</p>
<h2>Payment terms</h2>
<p>Payment terms are set out in each service agreement. Generally, payments are due according to the schedule agreed in your project contract.</p>
<h2>Intellectual property</h2>
<p>All content on this website, including designs, text, graphics and logos, is the property of Marrelay and is protected by copyright and trademark laws. Work we create for you under a project agreement is transferred to you as set out in that agreement.</p>
<h2>Limitation of liability</h2>
<p>Marrelay shall not be liable for any indirect, incidental or consequential damages arising from the use of our services or website.</p>
<h2>Contact us</h2>
<p>For questions about these terms, please contact us at <a href="mailto:hello@marrelay.com">hello@marrelay.com</a>.</p>
`.trim()

export const PRIVACY_DEFAULT_HTML = `
<h2>Introduction</h2>
<p>At Marrelay, we respect your privacy and are committed to protecting your personal data. This policy explains how we collect, use and safeguard your information when you visit our website or get in touch.</p>
<h2>Information we collect</h2>
<p>We may collect the following types of information:</p>
<ul><li>Name and contact information, such as email and phone number</li><li>Company information</li><li>Project details you share with us</li><li>Website usage data</li></ul>
<h2>How we use your information</h2>
<p>We use your information to:</p>
<ul><li>Provide and improve our services</li><li>Respond to your enquiries and requests</li><li>Send relevant updates about your projects</li><li>Improve our website experience</li></ul>
<h2>Cookies and analytics</h2>
<p>We use Google Analytics and Google Tag Manager to understand how the site is used. Measurement only runs after you give consent through our cookie banner, and you can change your choice at any time.</p>
<h2>Data protection</h2>
<p>We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, alteration, disclosure or destruction.</p>
<h2>Your choices</h2>
<p>You can ask us to show you, correct or delete the personal information we hold about you. Email us and we will respond within 30 days.</p>
<h2>Contact us</h2>
<p>If you have questions about this privacy policy, please contact us at <a href="mailto:hello@marrelay.com">hello@marrelay.com</a>.</p>
`.trim()

/** "July 19, 2026, Sunday" */
export function formatLegalDate(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' })
  return `${date}, ${weekday}`
}

/** Very small allowlist-based sanitizer for admin-authored rich text. */
export function sanitizeHtml(html: string): string {
  return String(html)
    .replace(/<\s*script[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/<\s*(iframe|object|embed|form|input|link|meta)[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript\s*:/gi, '')
}
