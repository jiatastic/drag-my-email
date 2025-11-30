import type { ComponentMetadata } from "@/types";
import {
  Type,
  Image as ImageIcon,
  Heading as HeadingIcon,
  FileText,
  Link as LinkIcon,
  Square,
  Container as ContainerIcon,
  Grid3x3,
  Minus,
  Mail,
  Eye,
  MousePointer,
  Columns,
  Rows,
  PanelBottom,
  Share2,
  Code,
  FileCode,
  FileType,
  BarChart3,
  ListOrdered,
  LayoutGrid,
  Megaphone,
} from "lucide-react";

// Social media platforms with their brand colors and icons
export const SOCIAL_PLATFORMS = {
  facebook: { name: "Facebook", color: "#1877F2", icon: "https://cdn.simpleicons.org/facebook/white" },
  twitter: { name: "Twitter / X", color: "#000000", icon: "https://cdn.simpleicons.org/x/white" },
  instagram: { name: "Instagram", color: "#E4405F", icon: "https://cdn.simpleicons.org/instagram/white" },
  linkedin: { name: "LinkedIn", color: "#0A66C2", icon: "https://cdn.simpleicons.org/linkedin/white" },
  youtube: { name: "YouTube", color: "#FF0000", icon: "https://cdn.simpleicons.org/youtube/white" },
  tiktok: { name: "TikTok", color: "#000000", icon: "https://cdn.simpleicons.org/tiktok/white" },
  github: { name: "GitHub", color: "#181717", icon: "https://cdn.simpleicons.org/github/white" },
  discord: { name: "Discord", color: "#5865F2", icon: "https://cdn.simpleicons.org/discord/white" },
  twitch: { name: "Twitch", color: "#9146FF", icon: "https://cdn.simpleicons.org/twitch/white" },
  reddit: { name: "Reddit", color: "#FF4500", icon: "https://cdn.simpleicons.org/reddit/white" },
  pinterest: { name: "Pinterest", color: "#BD081C", icon: "https://cdn.simpleicons.org/pinterest/white" },
  snapchat: { name: "Snapchat", color: "#FFFC00", icon: "https://cdn.simpleicons.org/snapchat/black" },
  whatsapp: { name: "WhatsApp", color: "#25D366", icon: "https://cdn.simpleicons.org/whatsapp/white" },
  telegram: { name: "Telegram", color: "#26A5E4", icon: "https://cdn.simpleicons.org/telegram/white" },
  slack: { name: "Slack", color: "#4A154B", icon: "https://cdn.simpleicons.org/slack/white" },
  dribbble: { name: "Dribbble", color: "#EA4C89", icon: "https://cdn.simpleicons.org/dribbble/white" },
  behance: { name: "Behance", color: "#1769FF", icon: "https://cdn.simpleicons.org/behance/white" },
  medium: { name: "Medium", color: "#000000", icon: "https://cdn.simpleicons.org/medium/white" },
  spotify: { name: "Spotify", color: "#1DB954", icon: "https://cdn.simpleicons.org/spotify/white" },
  applepodcasts: { name: "Apple Podcasts", color: "#9933CC", icon: "https://cdn.simpleicons.org/applepodcasts/white" },
  threads: { name: "Threads", color: "#000000", icon: "https://cdn.simpleicons.org/threads/white" },
  mastodon: { name: "Mastodon", color: "#6364FF", icon: "https://cdn.simpleicons.org/mastodon/white" },
  bluesky: { name: "Bluesky", color: "#0085FF", icon: "https://cdn.simpleicons.org/bluesky/white" },
} as const;

export type SocialPlatform = keyof typeof SOCIAL_PLATFORMS;

export const componentRegistry: Record<string, ComponentMetadata> = {
  // Layout Components
  Container: {
    name: "Container",
    type: "Container",
    icon: "Container",
    category: "layout",
    supportsTailwind: true,
    defaultProps: {
      style: {
        maxWidth: "600px",
        margin: "0 auto",
        padding: "20px",
        backgroundColor: "#ffffff",
      },
    },
    editableProps: ["className", "style.maxWidth", "style.margin", "style.padding", "style.backgroundColor"],
  },
  Section: {
    name: "Section",
    type: "Section",
    icon: "Square",
    category: "layout",
    supportsTailwind: true,
    defaultProps: {
      style: {
        padding: "24px",
        backgroundColor: "#f5f8fa",
      },
    },
    editableProps: ["className", "style.padding", "style.backgroundColor"],
  },
  Row: {
    name: "Row",
    type: "Row",
    icon: "Rows",
    category: "layout",
    supportsTailwind: true,
    defaultProps: {
      style: {
        width: "100%",
      },
    },
    editableProps: ["className", "style.width"],
  },
  // Configurable columns layout
  Columns: {
    name: "Columns",
    type: "Row",
    icon: "Columns",
    category: "layout",
    supportsTailwind: true,
    defaultProps: {
      columnCount: 2,
      columnGap: 20,
      style: {
        width: "100%",
      },
    },
    defaultChildren: [
      {
        type: "Column",
        props: {
          style: { verticalAlign: "top", paddingRight: "10px" },
        },
      },
      {
        type: "Column",
        props: {
          style: { verticalAlign: "top", paddingLeft: "10px" },
        },
      },
    ],
    editableProps: ["columnCount", "columnGap", "className", "style.width"],
  },
  Column: {
    name: "Column",
    type: "Column",
    icon: "Columns",
    category: "layout",
    supportsTailwind: true,
    defaultProps: {
      style: {
        width: "50%",
        verticalAlign: "top",
      },
    },
    editableProps: ["className", "style.width", "style.verticalAlign"],
  },

  // Content Components
  Heading: {
    name: "Heading",
    type: "Heading",
    icon: "Heading",
    category: "content",
    supportsTailwind: true,
    defaultProps: {
      as: "h1",
      children: "Welcome to Our Newsletter",
      style: {
        fontSize: "28px",
        fontWeight: "bold",
        color: "#14171a",
        margin: "0 0 16px 0",
      },
    },
    editableProps: ["className", "as", "children", "style.fontSize", "style.fontWeight", "style.color", "style.textAlign"],
  },
  Text: {
    name: "Text",
    type: "Text",
    icon: "FileText",
    category: "content",
    supportsTailwind: true,
    defaultProps: {
      children: "Thank you for subscribing to our newsletter. We're excited to share the latest updates, tips, and exclusive offers with you. Stay tuned for more!",
      style: {
        fontSize: "16px",
        lineHeight: "1.6",
        color: "#657786",
        margin: "0 0 16px 0",
      },
    },
    editableProps: ["className", "children", "style.fontSize", "style.lineHeight", "style.color", "style.textAlign"],
  },
  // Code Components
  CodeBlock: {
    name: "Code Block",
    type: "CodeBlock",
    icon: "FileCode",
    category: "content",
    supportsTailwind: true,
    defaultProps: {
      code: `function greet(name) {
  return \`Hello, \${name}!\`;
}`,
      language: "javascript",
      theme: "dracula",
      showLineNumbers: true,
      style: {
        margin: "16px 0",
      },
    },
    editableProps: ["code", "language", "theme", "showLineNumbers", "style.margin"],
  },
  CodeInline: {
    name: "Code Inline",
    type: "CodeInline",
    icon: "Code",
    category: "content",
    supportsTailwind: true,
    defaultProps: {
      children: "npm install @react-email/components",
      style: {
        backgroundColor: "#f4f4f5",
        padding: "2px 6px",
        borderRadius: "4px",
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#18181b",
      },
    },
    editableProps: ["children", "style.backgroundColor", "style.padding", "style.borderRadius", "style.fontSize", "style.color"],
  },
  Markdown: {
    name: "Markdown",
    type: "Markdown",
    icon: "FileType",
    category: "content",
    supportsTailwind: true,
    defaultProps: {
      children: `# Welcome

This is a **markdown** component that supports:

- Bold and *italic* text
- [Links](https://example.com)
- Lists and more!`,
      markdownContainerStyles: {
        padding: "16px 0",
      },
    },
    editableProps: ["children", "markdownContainerStyles.padding"],
  },
  // Preview is a meta component (email preview text), not shown in palette
  // It's automatically added to templates but users don't drag it
  Divider: {
    name: "Divider",
    type: "Hr",
    icon: "Minus",
    category: "content",
    supportsTailwind: true,
    defaultProps: {
      style: {
        border: "none",
        borderTop: "1px solid #e1e8ed",
        margin: "24px 0",
      },
    },
    editableProps: ["className", "style.borderTop", "style.margin"],
  },
  Stats: {
    name: "Stats",
    type: "Stats",
    icon: "BarChart3",
    category: "content",
    supportsTailwind: true,
    defaultProps: {
      stats: [
        { value: "42", title: "The Answer", description: "" },
        { value: "10M", title: "Days for Earth Mark II", description: "" },
        { value: "2^276,709:1", title: "Improbability Drive odds", description: "" },
      ],
      style: {
        padding: "24px 0",
      },
    },
    editableProps: ["stats", "className", "style.padding"],
  },
  NumberedList: {
    name: "Numbered List",
    type: "NumberedList",
    icon: "ListOrdered",
    category: "content",
    supportsTailwind: true,
    defaultProps: {
      items: [
        { title: "Innovative Solutions", description: "We deliver innovative solutions that drive success and growth." },
        { title: "Exceptional Performance", description: "Our services deliver high-quality performance and efficiency." },
        { title: "Reliable Support", description: "We have robust support to keep your operations running smoothly." },
      ],
      numberBgColor: "#4f46e5",
      style: {
        padding: "0",
      },
    },
    editableProps: ["items", "numberBgColor", "className", "style.padding"],
  },
  Gallery: {
    name: "Gallery",
    type: "Gallery",
    icon: "LayoutGrid",
    category: "content",
    supportsTailwind: true,
    defaultProps: {
      sectionTitle: "Our products",
      headline: "Elegant Style",
      description: "We spent two years in development to bring you the next generation of our award-winning home brew grinder. From the finest pour-overs to the coarsest cold brews, your coffee will never be the same again.",
      titleColor: "#4f46e5",
      headlineColor: "#111827",
      descriptionColor: "#6b7280",
      images: [
        { src: "https://react.email/static/stagg-eletric-kettle.jpg", alt: "Stagg Electric Kettle", href: "#" },
        { src: "https://react.email/static/ode-grinder.jpg", alt: "Ode Grinder", href: "#" },
        { src: "https://react.email/static/atmos-vacuum-canister.jpg", alt: "Atmos Vacuum Canister", href: "#" },
        { src: "https://react.email/static/clyde-electric-kettle.jpg", alt: "Clyde Electric Kettle", href: "#" },
      ],
      columns: 2,
      imageHeight: 288,
      borderRadius: "12px",
      gap: "16px",
      style: {
        padding: "16px 0",
      },
    },
    editableProps: ["sectionTitle", "headline", "description", "titleColor", "headlineColor", "descriptionColor", "images", "columns", "imageHeight", "borderRadius", "gap", "style.padding"],
  },
  Marketing: {
    name: "Marketing",
    type: "Marketing",
    icon: "Megaphone",
    category: "content",
    supportsTailwind: true,
    defaultProps: {
      headerBgColor: "#292524",
      headerTitle: "Coffee Storage",
      headerDescription: "Keep your coffee fresher for longer with innovative technology.",
      headerLinkText: "Shop now →",
      headerLinkUrl: "#",
      headerImage: "https://react.email/static/coffee-bean-storage.jpg",
      headerImageAlt: "Coffee Bean Storage",
      products: [
        {
          imageUrl: "https://react.email/static/atmos-vacuum-canister.jpg",
          altText: "Auto-Sealing Vacuum Canister",
          title: "Auto-Sealing Vacuum Canister",
          description: "A container that automatically creates an airtight seal with a button press.",
          linkUrl: "#",
        },
        {
          imageUrl: "https://react.email/static/vacuum-canister-clear-glass-bundle.jpg",
          altText: "3-Pack Vacuum Containers",
          title: "3-Pack Vacuum Containers",
          description: "Keep your coffee fresher for longer with this set of high-performance vacuum containers.",
          linkUrl: "#",
        },
      ],
      containerBgColor: "#ffffff",
      borderRadius: "8px",
      style: {
        padding: "0",
      },
    },
    editableProps: ["headerBgColor", "headerTitle", "headerDescription", "headerLinkText", "headerLinkUrl", "headerImage", "headerImageAlt", "products", "containerBgColor", "borderRadius", "style.padding"],
  },

  // Action Components
  Button: {
    name: "Button",
    type: "Button",
    icon: "MousePointer",
    category: "action",
    supportsTailwind: true,
    defaultProps: {
      href: "https://example.com",
      children: "Get Started",
      style: {
        backgroundColor: "#1e9df1",
        color: "#ffffff",
        padding: "14px 28px",
        borderRadius: "8px",
        fontWeight: "600",
        fontSize: "16px",
        textDecoration: "none",
        display: "inline-block",
      },
    },
    editableProps: ["className", "href", "children", "style.backgroundColor", "style.color", "style.padding", "style.borderRadius", "style.fontSize"],
  },
  Link: {
    name: "Link",
    type: "Link",
    icon: "Link",
    category: "action",
    supportsTailwind: true,
    defaultProps: {
      href: "https://example.com",
      children: "Learn more about our services →",
      style: {
        color: "#1e9df1",
        textDecoration: "underline",
        fontSize: "14px",
      },
    },
    editableProps: ["className", "href", "children", "style.color", "style.textDecoration", "style.fontSize"],
  },

  // Media Components
  Image: {
    name: "Image",
    type: "Image",
    icon: "Image",
    category: "media",
    supportsTailwind: true,
    defaultProps: {
      src: "/logo.svg",
      alt: "Logo",
      width: "32",
      height: "32",
      style: {
        borderRadius: "0",
        maxWidth: "100%",
      },
    },
    editableProps: ["className", "src", "alt", "width", "height", "style.borderRadius"],
  },

  // Social Icons Component
  SocialIcons: {
    name: "Social Icons",
    type: "SocialIcons",
    icon: "Share2",
    category: "action",
    supportsTailwind: true,
    defaultProps: {
      platforms: [
        { platform: "facebook", url: "https://facebook.com" },
        { platform: "twitter", url: "https://twitter.com" },
        { platform: "instagram", url: "https://instagram.com" },
        { platform: "linkedin", url: "https://linkedin.com" },
      ],
      iconSize: 32,
      iconShape: "circle", // circle, rounded, square
      iconStyle: "colored", // colored, dark, light
      spacing: 12,
      style: {
        textAlign: "center",
        padding: "16px 0",
      },
    },
    editableProps: [
      "platforms",
      "iconSize",
      "iconShape",
      "iconStyle",
      "spacing",
      "style.textAlign",
      "style.padding",
    ],
  },

  // Footer Components - Complete footer with pre-built content
  Footer: {
    name: "Footer",
    type: "Section",
    icon: "PanelBottom",
    category: "footer",
    supportsTailwind: true,
    defaultProps: {
      style: {
        backgroundColor: "#ffffff",
        padding: "40px 24px",
        textAlign: "center",
        borderTop: "1px solid #e6ebf1",
      },
    },
    // Pre-built children for the footer
    defaultChildren: [
      {
        type: "Image",
        props: {
          src: "https://react.email/static/logo-without-background.png",
          alt: "Company Logo",
          width: "42",
          height: "42",
          style: { margin: "0 auto 16px auto", display: "block" },
        },
      },
      {
        type: "Heading",
        props: {
          as: "h3",
          children: "Acme Corporation",
          style: { fontSize: "16px", fontWeight: "bold", color: "#1a1a1a", margin: "0 0 4px 0", textAlign: "center" },
        },
      },
      {
        type: "Text",
        props: {
          children: "Think different",
          style: { fontSize: "14px", color: "#666666", margin: "0 0 20px 0", textAlign: "center" },
        },
      },
      {
        type: "Text",
        props: {
          children: "📘  𝕏  📷",
          style: { fontSize: "20px", color: "#666666", margin: "0 0 20px 0", textAlign: "center", letterSpacing: "12px" },
        },
      },
      {
        type: "Text",
        props: {
          children: "123 Main Street, Anytown, CA 12345",
          style: { fontSize: "12px", color: "#8898aa", margin: "0 0 4px 0", textAlign: "center" },
        },
      },
      {
        type: "Text",
        props: {
          children: "mail@example.com • +1 234 567 89",
          style: { fontSize: "12px", color: "#8898aa", margin: "0", textAlign: "center" },
        },
      },
    ],
    editableProps: ["className", "style.backgroundColor", "style.padding", "style.textAlign", "style.borderTop"],
  },
  FooterSimple: {
    name: "Simple Footer",
    type: "Section",
    icon: "PanelBottom",
    category: "footer",
    supportsTailwind: true,
    defaultProps: {
      style: {
        backgroundColor: "#f6f9fc",
        padding: "32px 24px",
        textAlign: "center",
      },
    },
    defaultChildren: [
      {
        type: "Text",
        props: {
          children: "Unsubscribe • Privacy Policy • Terms of Service",
          style: { fontSize: "12px", color: "#8898aa", margin: "0 0 12px 0", textAlign: "center" },
        },
      },
      {
        type: "Text",
        props: {
          children: "© 2024 Your Company. All rights reserved.",
          style: { fontSize: "12px", color: "#8898aa", margin: "0", textAlign: "center" },
        },
      },
    ],
    editableProps: ["className", "style.backgroundColor", "style.padding", "style.textAlign"],
  },
  FooterTwoColumn: {
    name: "Two Column Footer",
    type: "Row",
    icon: "PanelBottom",
    category: "footer",
    supportsTailwind: true,
    defaultProps: {
      style: {
        backgroundColor: "#ffffff",
        padding: "40px 24px",
        borderTop: "1px solid #e6ebf1",
      },
    },
    defaultChildren: [
      {
        type: "Column",
        props: {
          style: { width: "50%", verticalAlign: "top", paddingRight: "20px" },
        },
        children: [
          {
            type: "Image",
            props: {
              src: "https://react.email/static/logo-without-background.png",
              alt: "Logo",
              width: "32",
              height: "32",
              style: { marginBottom: "12px" },
            },
          },
          {
            type: "Heading",
            props: {
              as: "h4",
              children: "Acme Corporation",
              style: { fontSize: "14px", fontWeight: "bold", color: "#1a1a1a", margin: "0 0 4px 0" },
            },
          },
          {
            type: "Text",
            props: {
              children: "Think different",
              style: { fontSize: "12px", color: "#666666", margin: "0" },
            },
          },
        ],
      },
      {
        type: "Column",
        props: {
          style: { width: "50%", verticalAlign: "top", paddingLeft: "20px" },
        },
        children: [
          {
            type: "Text",
            props: {
              children: "📘  𝕏  📷",
              style: { fontSize: "16px", color: "#666666", margin: "0 0 12px 0", letterSpacing: "8px" },
            },
          },
          {
            type: "Text",
            props: {
              children: "123 Main Street, Anytown, CA 12345",
              style: { fontSize: "12px", color: "#8898aa", margin: "0 0 4px 0" },
            },
          },
          {
            type: "Text",
            props: {
              children: "mail@example.com • +1 234 567 89",
              style: { fontSize: "12px", color: "#8898aa", margin: "0" },
            },
          },
        ],
      },
    ],
    editableProps: ["className", "style.backgroundColor", "style.padding"],
  },
};

export const getComponentIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    Container: ContainerIcon,
    Square: Square,
    Grid3x3: Grid3x3,
    Rows: Rows,
    Columns: Columns,
    Heading: HeadingIcon,
    FileText: FileText,
    Link: LinkIcon,
    Image: ImageIcon,
    Minus: Minus,
    Type: Type,
    Eye: Eye,
    MousePointer: MousePointer,
    PanelBottom: PanelBottom,
    Share2: Share2,
    Code: Code,
    FileCode: FileCode,
    FileType: FileType,
    BarChart3: BarChart3,
    ListOrdered: ListOrdered,
    LayoutGrid: LayoutGrid,
    Megaphone: Megaphone,
  };
  return icons[iconName] || Type;
};

export const getComponentsByCategory = () => {
  const categories: Record<string, ComponentMetadata[]> = {
    layout: [],
    content: [],
    action: [],
    media: [],
    footer: [],
  };

  Object.values(componentRegistry).forEach((component) => {
    const categoryArray = categories[component.category];
    if (categoryArray) {
      categoryArray.push(component);
    }
  });

  return categories;
};
