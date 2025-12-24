import { gateway } from "ai";
import { streamText, type ModelMessage } from "ai";

import { componentRegistry } from "@/lib/component-registry";
import type { EmailComponent, EmailGlobalStyles } from "@/types";

export const maxDuration = 30;

// Professional placeholder images for different contexts - using "Acme" branding (standard SaaS demo brand)
const PLACEHOLDER_IMAGES = {
  // Email-safe hero at 16:9 (600x338) to match typical 600px email width.
  hero: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=338&fit=crop",
  product: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
  product2: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
  product3: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop",
  team: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop",
  office: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
  avatar2: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
  logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='40' viewBox='0 0 120 40'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23818cf8'/%3E%3Cstop offset='100%25' stop-color='%234f46e5'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='120' height='40' rx='8' fill='%231a1a1a'/%3E%3Ccircle cx='20' cy='20' r='12' fill='url(%23g)'/%3E%3Cpath d='M16 26L20 14L24 26M17.5 22H22.5' stroke='white' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ctext x='40' y='25' fill='white' font-family='system-ui,-apple-system,sans-serif' font-size='14' font-weight='600'%3EACME%3C/text%3E%3C/svg%3E",
  logoLight: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='40' viewBox='0 0 120 40'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23818cf8'/%3E%3Cstop offset='100%25' stop-color='%234f46e5'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='120' height='40' rx='8' fill='%23f8fafc'/%3E%3Ccircle cx='20' cy='20' r='12' fill='url(%23g)'/%3E%3Cpath d='M16 26L20 14L24 26M17.5 22H22.5' stroke='white' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ctext x='40' y='25' fill='%231a1a1a' font-family='system-ui,-apple-system,sans-serif' font-size='14' font-weight='600'%3EACME%3C/text%3E%3C/svg%3E",
  logoIcon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23818cf8'/%3E%3Cstop offset='100%25' stop-color='%234f46e5'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='48' height='48' rx='12' fill='url(%23g)'/%3E%3Cpath d='M18 32L24 16L30 32M20.5 27H27.5' stroke='white' stroke-width='2.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E",
  banner: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=600&h=200&fit=crop",
  feature: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=300&h=200&fit=crop",
  feature2: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=200&fit=crop",
  ecommerce: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop",
};

// Default content for components - ensures AI always generates meaningful mockup text
const DEFAULT_CONTENT = {
  companyName: "Acme Inc.",
  tagline: "Building the future, one product at a time.",
  address: "123 Innovation Drive, San Francisco, CA 94102",
  email: "hello@acme.com",
  phone: "+1 (555) 123-4567",
  numberedListItems: [
    { title: "Lightning Fast Performance", description: "Experience blazing fast speeds with our optimized infrastructure. Your workflows will be 10x more efficient." },
    { title: "Enterprise-Grade Security", description: "Bank-level encryption and SOC 2 compliance keep your data safe. We take security seriously." },
    { title: "24/7 Priority Support", description: "Our dedicated support team is available around the clock to help you succeed. Average response time under 2 hours." },
  ],
  featureListItems: [
    { title: "Automated Workflows", description: "Set up powerful automations that save hours of manual work every week." },
    { title: "Real-time Analytics", description: "Get instant insights with our comprehensive dashboard and reporting tools." },
    { title: "Seamless Integrations", description: "Connect with 100+ popular tools including Slack, Salesforce, and Zapier." },
    { title: "Team Collaboration", description: "Work together efficiently with shared workspaces and real-time editing." },
  ],
  statsItems: [
    { value: "10M+", title: "Active Users", description: "Trusted by millions worldwide" },
    { value: "99.9%", title: "Uptime", description: "Enterprise reliability" },
    { value: "150+", title: "Countries", description: "Global presence" },
  ],
  testimonials: [
    { quote: "Acme has transformed how our team works. We've seen a 40% increase in productivity since switching.", author: "Sarah Chen", title: "VP of Operations, TechCorp" },
    { quote: "The best investment we've made this year. The ROI was immediate and the support is world-class.", author: "Michael Roberts", title: "CEO, StartupXYZ" },
  ],
  ctaTexts: ["Get Started Free", "Start Your Trial", "Request a Demo", "Learn More", "Join Now"],
  headings: {
    welcome: "Welcome to Acme",
    features: "Why Choose Acme?",
    howItWorks: "How It Works",
    testimonials: "What Our Customers Say",
    pricing: "Simple, Transparent Pricing",
    cta: "Ready to Get Started?",
  },
};

const SYSTEM_PROMPT = `
You are a senior email designer at a top-tier agency, with expertise in creating emails for brands like Amazon, Airbnb, Stripe, and Apple. Your emails are visually polished, conversion-optimized, and follow industry best practices.

## Default Brand: Acme Inc.
When generating emails, use "Acme" as the default brand name (this is the standard SaaS demo convention). 
- Company: ${DEFAULT_CONTENT.companyName}
- Tagline: ${DEFAULT_CONTENT.tagline}
- Address: ${DEFAULT_CONTENT.address}
- Email: ${DEFAULT_CONTENT.email}

## Design Philosophy
- **Visual Hierarchy**: Clear sections with proper spacing (32-48px between sections)
- **Mobile-First**: Design for 600px width, use adequate padding (24-32px sides)
- **Scannable Content**: Short paragraphs, bullet points when needed, clear CTAs
- **Brand Consistency**: Cohesive colors, consistent typography, professional imagery

## Email Structure Best Practices

### Marketing Emails (newsletters, promotions, announcements)
1. **Header Section** (subtle, not overwhelming)
   - Logo (small, 32-42px height)
   - Optional tagline or navigation links
   
2. **Hero Section** (attention-grabbing)
   - Bold headline (28-36px)
   - Supporting subtext (16px)
   - Hero image or illustration
   - Primary CTA button
   
3. **Content Sections** (value proposition)
   - Feature highlights with icons/images
   - Use 2-column layouts for features
   - Stats or social proof
   - Testimonials if relevant
   
4. **Secondary CTA Section**
   - Reinforce the main action
   - Create urgency when appropriate
   
5. **Footer**
   - Social links
   - Unsubscribe link
   - Company address
   - Legal text

### Transactional Emails (receipts, confirmations, notifications)
1. **Header**: Logo + Email type (e.g., "Order Confirmation")
2. **Summary Box**: Key info highlighted (order #, date, total)
3. **Details Section**: Line items, shipping info, etc.
4. **Next Steps**: What user should do/expect
5. **Support Info**: Help links, contact
6. **Footer**: Legal, unsubscribe

## Component Usage Guidelines
- **Section**: Use for major content blocks. Always set backgroundColor and padding (min 24px)
- **Row + Columns**: For side-by-side layouts. Column width as percentage (50%, 33%, etc.)
- **Heading**: h1 for hero (28-36px), h2 for section titles (22-28px), h3 for subsections (18-20px)
- **Text**: Body text 14-16px, muted text 12-14px in gray (#666 or #6b7280)
- **Button**: Min padding 14px 28px, clear contrast, actionable text
- **Image**: ALWAYS use professional placeholder images, never leave empty
- **Hero/Banner sizing (IMPORTANT)**:
  - Top-of-email hero image (16:9): set Image props width="600" height="338" and style.maxWidth="100%"
  - Top-of-email banner image: set Image props width="600" height="200" and style.maxWidth="100%"
  - Always set width and height to preserve layout across email clients.
- **NumberedList**: ALWAYS include realistic title AND description for each item - NEVER leave them empty

## Required Image URLs (USE THESE - Acme branding)
- Hero (16:9): ${PLACEHOLDER_IMAGES.hero}
- Banner (3:1): ${PLACEHOLDER_IMAGES.banner}
- Product images: ${PLACEHOLDER_IMAGES.product}, ${PLACEHOLDER_IMAGES.product2}, ${PLACEHOLDER_IMAGES.product3}
- Team/People: ${PLACEHOLDER_IMAGES.team}
- Avatar/Profile: ${PLACEHOLDER_IMAGES.avatar}, ${PLACEHOLDER_IMAGES.avatar2}
- Logo placeholder (dark): ${PLACEHOLDER_IMAGES.logo}
- Logo placeholder (light): ${PLACEHOLDER_IMAGES.logoLight}
- Logo icon: ${PLACEHOLDER_IMAGES.logoIcon}
- Feature images: ${PLACEHOLDER_IMAGES.feature}, ${PLACEHOLDER_IMAGES.feature2}
- E-commerce: ${PLACEHOLDER_IMAGES.ecommerce}

## Default Content for Components (ALWAYS USE THESE OR SIMILAR)

### For NumberedList items - ALWAYS include both title AND description:
${JSON.stringify(DEFAULT_CONTENT.numberedListItems, null, 2)}

### For Stats component:
${JSON.stringify(DEFAULT_CONTENT.statsItems, null, 2)}

### For feature lists:
${JSON.stringify(DEFAULT_CONTENT.featureListItems, null, 2)}

### Common CTA button text options:
${DEFAULT_CONTENT.ctaTexts.join(", ")}

### Common headings:
- Welcome: "${DEFAULT_CONTENT.headings.welcome}"
- Features: "${DEFAULT_CONTENT.headings.features}"
- How it works: "${DEFAULT_CONTENT.headings.howItWorks}"
- CTA: "${DEFAULT_CONTENT.headings.cta}"

## Color Schemes
- Primary actions: Bold colors (#2563eb blue, #16a34a green, #dc2626 red, #7c3aed purple)
- Backgrounds: Light grays (#f9fafb, #f3f4f6) or white
- Text: Dark (#111827 or #1f2937) for headings, medium (#4b5563 or #6b7280) for body
- Borders: Subtle (#e5e7eb or #d1d5db)

## Response Format
Return a SHORT natural summary (1-2 sentences) followed by the JSON block.

{{EMAIL_JSON}}
{
  "mode": "replace",
  "components": [
    {
      "type": "Section",
      "props": { "style": { "padding": "24px", "backgroundColor": "#ffffff" } },
      "children": [
        { "type": "Heading", "props": { "children": "Welcome to Acme", "as": "h1" } },
        { "type": "Text", "props": { "children": "Building the future, one product at a time." } }
      ]
    }
  ],
  "globalStyles": { "bodyBackgroundColor": "#f4f4f5" },
  "notes": "Built a [type] email with [key features]"
}
{{/EMAIL_JSON}}

## JSON Format Rules (STRICT)
- "components" MUST be an array of objects
- "children" MUST ALWAYS be an array (never a string or object), even for single child: "children": [{ ... }]
- Each component object MUST have "type" (string) and "props" (object)
- Text content goes in props.children as a STRING, e.g., { "type": "Text", "props": { "children": "Hello" } }
- DO NOT use "children" for text content - use props.children instead

CRITICAL RULES:
1. NEVER leave image src empty - always use placeholder URLs provided above
2. Create COMPLETE emails with all sections (header, content, footer)
3. Use realistic, professional copy that sounds like a real brand (use "Acme" as default)
4. Include at least 3-5 sections for marketing emails
5. Always include a clear primary CTA button
6. Use proper visual spacing between sections
7. "children" property MUST be an array of component objects, NEVER a string
8. ALWAYS include meaningful title AND description text for NumberedList items - NEVER leave them empty or with placeholder text like "Title" or "Description"
9. Use "Acme" branding for company name, logo text, and sender information
10. Every component with text content must have actual readable content, not empty strings
`;

type RequestBody = {
  messages: ModelMessage[];
  components?: EmailComponent[];
  mode?: "generate" | "edit";
  globalStyles?: EmailGlobalStyles;
  brandContext?: {
    name: string;
    domain: string;
    summary?: string;
    colorScheme?: "light" | "dark";
    colors?: Record<string, string>;
    fonts?: Array<{ family?: string }>;
    images?: {
      logo?: string;
      favicon?: string;
      ogImage?: string;
    };
    marketingAssets?: {
      hero?: string;
      banner?: string;
      socialPost?: string;
      logoVariant?: string;
      gallery?: string[];
    };
  };
};

const availableComponentsText = Object.values(componentRegistry)
  .map((meta) => {
    const props = Object.keys(meta.defaultProps || {}).join(", ") || "none";
    const usage = {
      Container: "Root wrapper for email content, max-width 600px",
      Section: "Content block with background and padding",
      Row: "Horizontal container for columns",
      Column: "Vertical column inside Row, use width %",
      Heading: "h1/h2/h3 headings with fontSize, color",
      Text: "Body text paragraphs",
      Button: "CTA button with href, backgroundColor, padding",
      Link: "Inline text link",
      Image: "Image with src (REQUIRED), alt, width, height",
      Hr: "Horizontal divider line",
      Footer: "Pre-built footer with logo, social, address",
      FooterSimple: "Minimal footer with links and copyright",
      SocialIcons: "Social media icon links",
      Stats: "Statistics display with value/title pairs",
      Gallery: "Image gallery grid",
      Marketing: "Product showcase section",
      Testimonial: "Quote with author info and image",
      NumberedList: "Numbered feature list",
    }[meta.type] || "";
    return `${meta.type}: ${usage} | props: ${props}`;
  })
  .join("\n");

const summarizeTree = (items?: EmailComponent[]): Array<Record<string, unknown>> | undefined => {
  if (!items) return undefined;
  return items.map((item) => ({
    id: item.id,
    type: item.type,
    props: item.props,
    children: summarizeTree(item.children),
  }));
};


export async function POST(req: Request) {
  try {
    const { messages, components, mode, globalStyles, brandContext }: RequestBody = await req.json();

    // Check for AI_GATEWAY_API_KEY (required for Vercel AI Gateway)
    if (!process.env.AI_GATEWAY_API_KEY) {
      console.error("Missing AI_GATEWAY_API_KEY environment variable");
      return new Response(
        JSON.stringify({ 
          error: "Missing AI_GATEWAY_API_KEY. Please set AI_GATEWAY_API_KEY environment variable for Vercel AI Gateway" 
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Log configuration (without exposing keys)
    console.log("AI Configuration:", {
      hasGatewayApiKey: !!process.env.AI_GATEWAY_API_KEY,
      usingGateway: true,
    });

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid messages format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const treeSummary = summarizeTree(components);

    const userMode = mode ?? (components && components.length > 0 ? "edit" : "generate");
    const generationInstruction =
      userMode === "generate"
        ? `User wants a COMPLETE, professional email from scratch. 
           
Think step-by-step like designing for a Fortune 500 company:
1. What type of email is this? (marketing/transactional/newsletter)
2. What sections does it need? (header, hero, features, CTA, footer - minimum 4-5 sections)
3. What images should I include? (use the placeholder URLs provided)
4. What makes this email feel premium and complete?

Generate a FULL email with realistic copy, proper images, and professional styling.`
        : `User wants edits to the current email. Analyze what they want changed and return the updated full components array.
           
Keep the existing structure intact unless explicitly asked to change it.
Maintain visual consistency with any existing styling.`;

    const brandInstruction = brandContext
      ? `\n\n## User Selected Brand Context\nThe user selected a brand. Use this brand context to guide design decisions.\n- Brand name: ${brandContext.name}\n- Domain: ${brandContext.domain}\n- Summary: ${brandContext.summary ?? "n/a"}\n- Color scheme: ${brandContext.colorScheme ?? "unknown"}\n- Colors: ${JSON.stringify(brandContext.colors ?? {}, null, 2)}\n- Fonts: ${JSON.stringify(brandContext.fonts ?? [], null, 2)}\n- Branding images: ${JSON.stringify(brandContext.images ?? {}, null, 2)}\n- Brand marketing assets (generated): ${JSON.stringify(brandContext.marketingAssets ?? {}, null, 2)}\n\n### Brand Application Rules (STRICT)\n- Prefer the brand's **primary color** for CTA buttons and highlights.\n- **When choosing Image src values, ALWAYS prefer brand marketing assets first**:\n  1) If you need a HERO or banner image, use brandContext.marketingAssets.hero or brandContext.marketingAssets.banner when available.\n  2) If you need additional supporting imagery, use brandContext.marketingAssets.socialPost or brandContext.marketingAssets.gallery when available.\n  3) Only if brand marketing assets are missing, fall back to the provided placeholder URLs.\n- If a component needs a logo image, use brandContext.images.logo when available.\n- Keep accessibility and readability (sufficient contrast).\n- If brand data is missing, fall back to the default placeholders and default content.\n`
      : "";

    try {
      const result = streamText({
        model: gateway("openai/gpt-5.1-instant"),
        system: `${SYSTEM_PROMPT}${brandInstruction}\n\n${generationInstruction}\n\nAvailable components:\n${availableComponentsText}\n\nCurrent tree (ids elided):\n${JSON.stringify(
          treeSummary ?? [],
          null,
          2
        )}\n\nCurrent global styles: ${JSON.stringify(globalStyles ?? {}, null, 2)}`,
        messages,
        temperature: 0.3,
      });

      // Use toTextStreamResponse() for manual frontend implementation
      return result.toTextStreamResponse();
    } catch (streamError: any) {
      console.error("Error in streamText:", streamError);
      throw streamError;
    }
  } catch (error: any) {
    console.error("Error in /api/ai-assistant:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
