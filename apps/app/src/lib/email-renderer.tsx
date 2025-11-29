import { render } from "@react-email/render";
import React from "react";
import type { EmailComponent, TailwindConfig, EmailGlobalStyles } from "@/types";
import {
  Container,
  Section,
  Row,
  Column,
  Heading,
  Text,
  Button,
  Link,
  Img,
  Hr,
  Html,
  Head,
  Body,
  Preview,
  Tailwind,
} from "@react-email/components";

const componentMap: Record<string, React.ComponentType<any>> = {
  Container,
  Section,
  Row,
  Column,
  Heading,
  Text,
  Button,
  Link,
  Image: Img,
  Hr,
  Divider: Hr, // Alias for Divider component
  Preview,
};

// Social platforms data for rendering
const SOCIAL_PLATFORMS_DATA: Record<string, { name: string; color: string; icon: string }> = {
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
  whatsapp: { name: "WhatsApp", color: "#25D366", icon: "https://cdn.simpleicons.org/whatsapp/white" },
  telegram: { name: "Telegram", color: "#26A5E4", icon: "https://cdn.simpleicons.org/telegram/white" },
  threads: { name: "Threads", color: "#000000", icon: "https://cdn.simpleicons.org/threads/white" },
  mastodon: { name: "Mastodon", color: "#6364FF", icon: "https://cdn.simpleicons.org/mastodon/white" },
  bluesky: { name: "Bluesky", color: "#0085FF", icon: "https://cdn.simpleicons.org/bluesky/white" },
  spotify: { name: "Spotify", color: "#1DB954", icon: "https://cdn.simpleicons.org/spotify/white" },
  dribbble: { name: "Dribbble", color: "#EA4C89", icon: "https://cdn.simpleicons.org/dribbble/white" },
  behance: { name: "Behance", color: "#1769FF", icon: "https://cdn.simpleicons.org/behance/white" },
  medium: { name: "Medium", color: "#000000", icon: "https://cdn.simpleicons.org/medium/white" },
  slack: { name: "Slack", color: "#4A154B", icon: "https://cdn.simpleicons.org/slack/white" },
};

export function renderComponent(component: EmailComponent): React.ReactElement {
  // Special handling for SocialIcons component
  if (component.type === "SocialIcons") {
    const platforms = component.props?.platforms || [];
    const iconSize = component.props?.iconSize || 32;
    const iconShape = component.props?.iconShape || "circle";
    const iconStyle = component.props?.iconStyle || "colored";
    const spacing = component.props?.spacing || 12;
    const style = component.props?.style || {};
    
    const getBorderRadius = () => {
      if (iconShape === "circle") return "50%";
      if (iconShape === "rounded") return "6px";
      return "0";
    };
    
    const getIconBg = (platformKey: string) => {
      const platform = SOCIAL_PLATFORMS_DATA[platformKey];
      if (!platform) return "#888";
      if (iconStyle === "colored") return platform.color;
      if (iconStyle === "dark") return "#1a1a1a";
      return "#f0f0f0";
    };
    
    const alignment = style.textAlign === "center" ? "center" : style.textAlign === "right" ? "right" : "left";
    
    return React.createElement(
      Section,
      { 
        key: component.id,
        style: { 
          textAlign: alignment as any,
          padding: style.padding || "16px 0",
        }
      },
      platforms.map((p: { platform: string; url: string }, i: number) => {
        const platformData = SOCIAL_PLATFORMS_DATA[p.platform];
        if (!platformData) return null;
        return React.createElement(
          Link,
          {
            key: i,
            href: p.url || "#",
            style: {
              display: "inline-block",
              width: iconSize,
              height: iconSize,
              backgroundColor: getIconBg(p.platform),
              borderRadius: getBorderRadius(),
              textDecoration: "none",
              marginRight: i < platforms.length - 1 ? spacing : 0,
              verticalAlign: "middle",
            }
          },
          React.createElement(Img, {
            src: platformData.icon,
            alt: platformData.name,
            width: Math.round(iconSize * 0.55),
            height: Math.round(iconSize * 0.55),
            style: {
              display: "block",
              margin: "auto",
              paddingTop: Math.round(iconSize * 0.225),
            }
          })
        );
      })
    );
  }
  
  const Component = componentMap[component.type];
  if (!Component) {
    return React.createElement(Text, { key: component.id }, `Unknown component: ${component.type}`);
  }

  const props: Record<string, any> = { ...component.props, key: component.id };
  
  // Add className support for Tailwind
  if (component.className) {
    props.className = component.className;
  }
  
  // Handle nested children components
  if (component.children && component.children.length > 0) {
    props.children = component.children.map((child) => renderComponent(child));
  } else if (props.children && typeof props.children === "string") {
    // Keep string children as-is
  }

  return React.createElement(Component, props);
}

// Default Tailwind config for email templates
const defaultTailwindConfig: TailwindConfig = {
  theme: {
    extend: {
      colors: {
        brand: "#1e9df1",
        "brand-dark": "#1a8dd8",
      },
      fontFamily: {
        sans: ["Open Sans", "Helvetica Neue", "Arial", "sans-serif"],
        aws: ["Amazon Ember", "Helvetica Neue", "Arial", "sans-serif"],
      },
    },
  },
};

export async function renderEmailTemplate(
  components: EmailComponent[],
  options?: {
    tailwindConfig?: TailwindConfig;
    useTailwind?: boolean;
    globalStyles?: EmailGlobalStyles;
  }
): Promise<string> {
  if (components.length === 0) {
    return "<!-- No components added yet -->";
  }

  const useTailwind = options?.useTailwind ?? true;
  const tailwindConfig = options?.tailwindConfig ?? defaultTailwindConfig;
  const globalStyles = options?.globalStyles;

  // Build the email content
  const renderedComponents = components.map((component) => renderComponent(component));

  // Extract global style values with defaults
  const bodyBg = globalStyles?.bodyBackgroundColor || "#f4f4f5";
  const containerBg = globalStyles?.containerBackgroundColor || "#ffffff";
  const maxWidth = globalStyles?.maxWidth || "600px";
  const fontFamily = globalStyles?.fontFamily || "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  const textColor = globalStyles?.textColor || "#1a1a1a";
  const fontSize = globalStyles?.fontSize || "16px";
  const containerPadding = globalStyles?.containerPadding || "20px";

  const emailContent = useTailwind ? (
    <Html>
      <Head />
      <Tailwind config={tailwindConfig}>
        <Body 
          style={{ 
            fontFamily,
            fontSize,
            color: textColor,
            backgroundColor: bodyBg,
            margin: 0, 
            padding: 0,
          }}
        >
          <Container 
            style={{ 
              maxWidth, 
              margin: "0 auto",
              backgroundColor: containerBg,
              padding: containerPadding,
            }}
          >
            {renderedComponents}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  ) : (
    <Html>
      <Head />
      <Body 
        style={{ 
          fontFamily,
          fontSize,
          color: textColor,
          backgroundColor: bodyBg,
          margin: 0, 
          padding: 0,
        }}
      >
        <Container 
          style={{ 
            maxWidth, 
            margin: "0 auto",
            backgroundColor: containerBg,
            padding: containerPadding,
          }}
        >
          {renderedComponents}
        </Container>
      </Body>
    </Html>
  );

  try {
    const html = await render(emailContent);
    return html;
  } catch (error) {
    console.error("Error rendering email:", error);
    return "<!-- Error rendering email -->";
  }
}

export function componentsToJSX(components: EmailComponent[], indent = 0): string {
  const spaces = "  ".repeat(indent);
  let jsx = "";

  components.forEach((component) => {
    // Map component types to their JSX equivalents
    let componentType = component.type;
    if (componentType === "Image") componentType = "Img";
    if (componentType === "Divider") componentType = "Hr";
    const props = component.props || {};
    
    // Format props
    const propsArray: string[] = [];
    
    // Add className if present
    if (component.className) {
      propsArray.push(`className="${component.className}"`);
    }
    
    Object.entries(props).forEach(([key, value]) => {
      if (key === "children") return;
      
      if (typeof value === "string") {
        propsArray.push(`${key}="${value}"`);
      } else if (typeof value === "object" && value !== null) {
        const styleString = Object.entries(value as Record<string, any>)
          .map(([k, v]) => `${k}: "${v}"`)
          .join(", ");
        propsArray.push(`${key}={{ ${styleString} }}`);
      } else {
        propsArray.push(`${key}={${JSON.stringify(value)}}`);
      }
    });
    
    const propsString = propsArray.join(" ");

    if (component.children && component.children.length > 0) {
      jsx += `${spaces}<${componentType}${propsString ? ` ${propsString}` : ""}>\n`;
      jsx += componentsToJSX(component.children, indent + 1);
      jsx += `${spaces}</${componentType}>\n`;
    } else if (props.children && typeof props.children === "string") {
      jsx += `${spaces}<${componentType}${propsString ? ` ${propsString}` : ""}>\n`;
      jsx += `${spaces}  ${props.children}\n`;
      jsx += `${spaces}</${componentType}>\n`;
    } else {
      jsx += `${spaces}<${componentType}${propsString ? ` ${propsString}` : ""} />\n`;
    }
  });

  return jsx;
}

// Generate full email JSX including Tailwind wrapper
export function generateFullEmailJSX(
  components: EmailComponent[],
  options?: { useTailwind?: boolean; tailwindConfig?: TailwindConfig; globalStyles?: EmailGlobalStyles }
): string {
  const useTailwind = options?.useTailwind ?? true;
  const config = options?.tailwindConfig ?? defaultTailwindConfig;
  const gs = options?.globalStyles;
  
  const componentsJSX = componentsToJSX(components, useTailwind ? 4 : 3);
  
  // Global style values
  const bodyBg = gs?.bodyBackgroundColor || "#f4f4f5";
  const containerBg = gs?.containerBackgroundColor || "#ffffff";
  const maxWidth = gs?.maxWidth || "600px";
  const fontFamily = gs?.fontFamily || "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  const textColor = gs?.textColor || "#1a1a1a";
  const fontSize = gs?.fontSize || "16px";
  const containerPadding = gs?.containerPadding || "20px";
  
  if (useTailwind) {
    const configStr = JSON.stringify(config, null, 2)
      .split('\n')
      .map((line, i) => i === 0 ? line : '        ' + line)
      .join('\n');
    
    return `import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Heading,
  Text,
  Button,
  Link,
  Img,
  Hr,
  Preview,
  Tailwind,
} from "@react-email/components";

export default function EmailTemplate() {
  return (
    <Html>
      <Head />
      <Tailwind config={${configStr}}>
        <Body style={{ fontFamily: "${fontFamily}", fontSize: "${fontSize}", color: "${textColor}", backgroundColor: "${bodyBg}", margin: 0, padding: 0 }}>
          <Container style={{ maxWidth: "${maxWidth}", margin: "0 auto", backgroundColor: "${containerBg}", padding: "${containerPadding}" }}>
${componentsJSX}          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
`;
  }
  
  return `import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Heading,
  Text,
  Button,
  Link,
  Img,
  Hr,
  Preview,
} from "@react-email/components";

export default function EmailTemplate() {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "${fontFamily}", fontSize: "${fontSize}", color: "${textColor}", backgroundColor: "${bodyBg}", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: "${maxWidth}", margin: "0 auto", backgroundColor: "${containerBg}", padding: "${containerPadding}" }}>
${componentsJSX}        </Container>
      </Body>
    </Html>
  );
}
`;
}
