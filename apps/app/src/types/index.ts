export interface EmailComponent {
  id: string;
  type: string;
  props: Record<string, any>;
  children?: EmailComponent[];
  // Support for Tailwind classes
  className?: string;
}

// Global styles for the entire email
export interface EmailGlobalStyles {
  // Body/wrapper background color
  bodyBackgroundColor?: string;
  // Email container background color
  containerBackgroundColor?: string;
  // Max width of the email container
  maxWidth?: string;
  // Base font family
  fontFamily?: string;
  // Base text color
  textColor?: string;
  // Base font size
  fontSize?: string;
  // Container padding
  containerPadding?: string;
}

export interface EmailTemplateData {
  components: EmailComponent[];
  // Tailwind config for the template
  tailwindConfig?: TailwindConfig;
  // Global email styles
  globalStyles?: EmailGlobalStyles;
}

export interface TailwindConfig {
  theme?: {
    extend?: {
      colors?: Record<string, string>;
      fontFamily?: Record<string, string[]>;
      fontSize?: Record<string, string>;
      [key: string]: any;
    };
  };
  [key: string]: any;
}

// Child component definition for defaultChildren
export interface DefaultChildComponent {
  type: string;
  props: Record<string, any>;
  children?: DefaultChildComponent[];
}

export interface ComponentMetadata {
  name: string;
  type: string;
  icon?: string;
  defaultProps: Record<string, any>;
  editableProps: string[];
  category: "layout" | "content" | "media" | "action" | "footer";
  // Support for Tailwind class editing
  supportsTailwind?: boolean;
  // Pre-built children components
  defaultChildren?: DefaultChildComponent[];
}

