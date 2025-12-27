import type { EmailComponent, TailwindConfig, EmailGlobalStyles } from "@/types";

export interface DefaultTemplate {
  id: string;
  name: string;
  description: string;
  category: "verification" | "marketing" | "transactional" | "notification";
  components: EmailComponent[];
  // Optional Tailwind config for the template
  tailwindConfig?: TailwindConfig;
  // Whether this template uses Tailwind classes
  usesTailwind?: boolean;
  // Optional global styles for the template
  globalStyles?: EmailGlobalStyles;
}

// AWS Tailwind configuration
const awsTailwindConfig: TailwindConfig = {
  theme: {
    extend: {
      colors: {
        "aws-dark": "#252f3d",
        "aws-gray": "#eeeeee",
        "aws-text": "#333333",
        "aws-link": "#2754C5",
      },
      fontFamily: {
        aws: ["Amazon Ember", "Helvetica Neue", "Arial", "sans-serif"],
      },
    },
  },
};

// Twitch Tailwind configuration
const twitchTailwindConfig: TailwindConfig = {
  theme: {
    extend: {
      colors: {
        "twitch-purple": "#9147ff",
        "twitch-bg": "#efeef1",
        "twitch-text": "#0e0e10",
        "twitch-muted": "#706a7b",
      },
      fontFamily: {
        twitch: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
};

export const defaultTemplates: DefaultTemplate[] = [
  // ============================================
  // AIRBNB REVIEW EMAIL
  // ============================================
  {
    id: "airbnb-review",
    name: "Airbnb Review",
    description: "Review notification email",
    category: "notification",
    usesTailwind: false,
    components: [
      {
        id: "preview-1",
        type: "Preview",
        props: {
          children: "Read Alex's review",
        },
      },
      {
        id: "logo-1",
        type: "Image",
        props: {
          src: "https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_B%C3%A9lo.svg",
          alt: "Airbnb",
          width: "96",
          height: "30",
        },
      },
      {
        id: "author-image",
        type: "Image",
        props: {
          src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=96&h=96&fit=crop&crop=face",
          alt: "Alex",
          width: "96",
          height: "96",
          style: {
            borderRadius: "50%",
            margin: "0 auto 16px",
            display: "block",
          },
        },
      },
      {
        id: "heading-1",
        type: "Heading",
        props: {
          as: "h1",
          children: "Here's what Alex wrote",
          style: {
            fontSize: "32px",
            lineHeight: "1.3",
            fontWeight: "bold",
            color: "#484848",
            marginBottom: "16px",
          },
        },
      },
      {
        id: "review-text",
        type: "Text",
        props: {
          children: "\"Alan was a great guest! Easy communication, the apartment was left in great condition, very polite, and respectful of all house rules. He's welcome back anytime and would easily recommend him to any host!\"",
          style: {
            fontSize: "18px",
            lineHeight: "1.4",
            color: "#484848",
            padding: "24px",
            backgroundColor: "#f2f3f3",
            borderRadius: "4px",
            marginBottom: "16px",
          },
        },
      },
      {
        id: "text-1",
        type: "Text",
        props: {
          children: "Now that the review period is over, we've posted Alex's review to your Airbnb profile.",
          style: {
            fontSize: "18px",
            lineHeight: "1.4",
            color: "#484848",
            marginBottom: "16px",
          },
        },
      },
      {
        id: "text-2",
        type: "Text",
        props: {
          children: "While it's too late to write a review of your own, you can send your feedback to Alex using your Airbnb message thread.",
          style: {
            fontSize: "18px",
            lineHeight: "1.4",
            color: "#484848",
            marginBottom: "16px",
          },
        },
      },
      {
        id: "button-1",
        type: "Button",
        props: {
          href: "https://www.airbnb.com",
          children: "Send My Feedback",
          style: {
            backgroundColor: "#ff5a5f",
            borderRadius: "4px",
            color: "#ffffff",
            fontSize: "18px",
            padding: "19px 30px",
            textDecoration: "none",
            display: "inline-block",
            marginBottom: "20px",
          },
        },
      },
      {
        id: "divider-1",
        type: "Divider",
        props: {
          style: {
            borderColor: "#cccccc",
            margin: "20px 0",
          },
        },
      },
      {
        id: "heading-2",
        type: "Heading",
        props: {
          as: "h2",
          children: "Common questions",
          style: {
            fontSize: "18px",
            fontWeight: "bold",
            color: "#484848",
            marginBottom: "12px",
          },
        },
      },
      {
        id: "link-1",
        type: "Link",
        props: {
          href: "https://www.airbnb.com",
          children: "How do reviews work?",
          style: {
            fontSize: "18px",
            lineHeight: "1.4",
            color: "#ff5a5f",
            display: "block",
            marginBottom: "8px",
          },
        },
      },
      {
        id: "link-2",
        type: "Link",
        props: {
          href: "https://www.airbnb.com",
          children: "How do star ratings work?",
          style: {
            fontSize: "18px",
            lineHeight: "1.4",
            color: "#ff5a5f",
            display: "block",
            marginBottom: "8px",
          },
        },
      },
      {
        id: "link-3",
        type: "Link",
        props: {
          href: "https://www.airbnb.com",
          children: "Can I leave a review after 14 days?",
          style: {
            fontSize: "18px",
            lineHeight: "1.4",
            color: "#ff5a5f",
            display: "block",
            marginBottom: "20px",
          },
        },
      },
      {
        id: "divider-2",
        type: "Divider",
        props: {
          style: {
            borderColor: "#cccccc",
            margin: "20px 0",
          },
        },
      },
      {
        id: "text-footer",
        type: "Text",
        props: {
          children: "Airbnb, Inc., 888 Brannan St, San Francisco, CA 94103",
          style: {
            fontSize: "14px",
            lineHeight: "24px",
            color: "#9ca299",
            marginBottom: "10px",
          },
        },
      },
      {
        id: "link-footer",
        type: "Link",
        props: {
          href: "https://www.airbnb.com",
          children: "Report unsafe behavior",
          style: {
            fontSize: "14px",
            color: "#9ca299",
            textDecoration: "underline",
          },
        },
      },
    ],
  },
  // ============================================
  // AWS VERIFICATION - With Tailwind Classes
  // ============================================
  {
    id: "aws-verify",
    name: "AWS Verification",
    description: "Email verification with code (Tailwind)",
    category: "verification",
    usesTailwind: true,
    tailwindConfig: awsTailwindConfig,
    globalStyles: {
      bodyBackgroundColor: "#eeeeee",
      containerBackgroundColor: "#ffffff",
      maxWidth: "600px",
      fontFamily: "Amazon Ember, Helvetica Neue, Arial, sans-serif",
      textColor: "#333333",
      fontSize: "14px",
      containerPadding: "0",
    },
    components: [
      {
        id: "preview-1",
        type: "Preview",
        props: {
          children: "AWS Email Verification",
        },
      },
      {
        id: "container-1",
        type: "Container",
        className: "p-5 mx-auto bg-[#eee]",
        props: {},
        children: [
          {
            id: "section-main",
            type: "Section",
            className: "bg-white",
            props: {},
            children: [
              // Header Section with Logo
      {
        id: "section-header",
        type: "Section",
                className: "bg-[#252f3d] py-5 text-center",
                props: {},
                children: [
      {
        id: "logo-1",
        type: "Image",
                    className: "mx-auto",
        props: {
                      src: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Amazon_Web_Services_Logo.svg/300px-Amazon_Web_Services_Logo.svg.png",
          alt: "AWS Logo",
          width: "75",
          height: "45",
          },
        },
                ],
      },
              // Content Section
      {
        id: "section-content",
        type: "Section",
                className: "py-[25px] px-[35px]",
                props: {},
                children: [
      {
        id: "heading-1",
        type: "Heading",
                    className: "text-[#333] text-[20px] font-bold mb-[15px]",
        props: {
          as: "h1",
          children: "Verify your email address",
        },
      },
      {
        id: "text-1",
        type: "Text",
                    className: "text-[#333] text-[14px] leading-[24px] mt-6 mb-[14px] mx-0",
        props: {
          children: "Thanks for starting the new AWS account creation process. We want to make sure it's really you. Please enter the following verification code when prompted. If you don't want to create an account, you can ignore this message.",
                    },
                  },
                  // Verification Code Section
                  {
                    id: "section-code",
                    type: "Section",
                    className: "text-center",
                    props: {},
                    children: [
      {
        id: "text-label",
        type: "Text",
                        className: "text-[#333] m-0 font-bold text-center text-[14px]",
        props: {
          children: "Verification code",
        },
      },
      {
        id: "text-code",
        type: "Text",
                        className: "text-[#333] text-[36px] my-[10px] mx-0 font-bold text-center",
        props: {
          children: "596853",
        },
      },
      {
        id: "text-expiry",
        type: "Text",
                        className: "text-[#333] text-[14px] m-0 text-center",
        props: {
          children: "(This code is valid for 10 minutes)",
          },
        },
                    ],
                  },
                ],
      },
              // Divider
      {
        id: "divider-1",
                type: "Hr",
                props: {},
              },
              // Disclaimer Section
              {
                id: "section-disclaimer",
                type: "Section",
                className: "py-[25px] px-[35px]",
                props: {},
                children: [
      {
        id: "text-disclaimer",
        type: "Text",
                    className: "text-[#333] text-[14px] m-0",
        props: {
          children: "Amazon Web Services will never email you and ask you to disclose or verify your password, credit card, or banking account number.",
                    },
                  },
                ],
              },
            ],
          },
          // Footer
          {
            id: "text-footer",
            type: "Text",
            className: "text-[#333] text-[12px] my-[24px] mx-0 px-5 py-0",
            props: {
              children: "This message was produced and distributed by Amazon Web Services, Inc., 410 Terry Ave. North, Seattle, WA 98109. © 2024, Amazon Web Services, Inc. All rights reserved. AWS is a registered trademark of Amazon.com, Inc.",
          },
        },
        ],
      },
    ],
  },
  {
    id: "linear-login",
    name: "Linear Login Code",
    description: "Magic link with login code",
    category: "verification",
    usesTailwind: false,
    components: [
      {
        id: "preview-1",
        type: "Preview",
        props: {
          children: "Your login code for Linear",
        },
      },
      {
        id: "container-1",
        type: "Container",
        props: {
          style: {
            maxWidth: "560px",
            margin: "0 auto",
            padding: "20px 0 48px 0",
          },
        },
      },
      {
        id: "logo-1",
        type: "Image",
        props: {
          src: "https://asset.brandfetch.io/iduDa181eM/idYYbqOlKi.png",
          alt: "Linear",
          width: "42",
          height: "42",
          style: {
            borderRadius: "24px",
          },
        },
      },
      {
        id: "heading-1",
        type: "Heading",
        props: {
          as: "h1",
          children: "Your login code for Linear",
          style: {
            fontSize: "24px",
            fontWeight: "400",
            color: "#484848",
            letterSpacing: "-0.5px",
            lineHeight: "1.3",
            paddingTop: "17px",
          },
        },
      },
      {
        id: "button-1",
        type: "Button",
        props: {
          href: "https://linear.app",
          children: "Login to Linear",
          style: {
            backgroundColor: "#5e6ad2",
            color: "#ffffff",
            padding: "11px 23px",
            borderRadius: "4px",
            fontSize: "15px",
            fontWeight: "600",
            textDecoration: "none",
            display: "inline-block",
            marginTop: "27px",
            marginBottom: "27px",
          },
        },
      },
      {
        id: "text-1",
        type: "Text",
        props: {
          children: "This link and code will only be valid for the next 5 minutes. If the link does not work, you can use the login verification code directly:",
          style: {
            fontSize: "15px",
            lineHeight: "1.4",
            color: "#3c4149",
            marginBottom: "15px",
          },
        },
      },
      {
        id: "text-code",
        type: "Text",
        props: {
          children: "tt226-5398x",
          style: {
            fontSize: "21px",
            fontWeight: "bold",
            fontFamily: "monospace",
            backgroundColor: "#dfe1e4",
            padding: "4px 8px",
            borderRadius: "4px",
            color: "#3c4149",
          },
        },
      },
      {
        id: "divider-1",
        type: "Divider",
        props: {
          style: {
            borderColor: "#dfe1e4",
            margin: "42px 0 26px 0",
          },
        },
      },
      {
        id: "link-1",
        type: "Link",
        props: {
          href: "https://linear.app",
          children: "Linear",
          style: {
            fontSize: "14px",
            color: "#b4becc",
          },
        },
      },
    ],
  },
  {
    id: "notion-magic-link",
    name: "Notion Magic Link",
    description: "Simple magic link login",
    category: "verification",
    usesTailwind: false,
    components: [
      {
        id: "preview-1",
        type: "Preview",
        props: {
          children: "Log in with this magic link",
        },
      },
      {
        id: "container-1",
        type: "Container",
        props: {
          style: {
            maxWidth: "600px",
            margin: "0 auto",
            padding: "0 12px",
          },
        },
      },
      {
        id: "heading-1",
        type: "Heading",
        props: {
          as: "h1",
          children: "Login",
          style: {
            fontSize: "24px",
            color: "#333333",
            margin: "40px 0",
            padding: "0",
          },
        },
      },
      {
        id: "link-magic",
        type: "Link",
        props: {
          href: "https://notion.so",
          children: "Click here to log in with this magic link",
          style: {
            fontSize: "14px",
            color: "#2754C5",
            textDecoration: "underline",
            marginBottom: "16px",
            display: "block",
          },
        },
      },
      {
        id: "text-1",
        type: "Text",
        props: {
          children: "Or, copy and paste this temporary login code:",
          style: {
            fontSize: "14px",
            color: "#333333",
            marginBottom: "14px",
          },
        },
      },
      {
        id: "text-code",
        type: "Text",
        props: {
          children: "sparo-ndigo-amurt-secan",
          style: {
            fontSize: "16px",
            fontFamily: "monospace",
            backgroundColor: "#f4f4f4",
            padding: "16px",
            borderRadius: "6px",
            border: "1px solid #eeeeee",
            color: "#333333",
          },
        },
      },
      {
        id: "text-2",
        type: "Text",
        props: {
          children: "If you didn't try to login, you can safely ignore this email.",
          style: {
            fontSize: "14px",
            color: "#ababab",
            marginTop: "14px",
          },
        },
      },
      {
        id: "text-3",
        type: "Text",
        props: {
          children: "Hint: You can set a permanent password in Settings & members → My account.",
          style: {
            fontSize: "14px",
            color: "#ababab",
            marginBottom: "38px",
          },
        },
      },
      {
        id: "logo-1",
        type: "Image",
        props: {
          src: "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png",
          alt: "Notion's Logo",
          width: "32",
          height: "32",
        },
      },
      {
        id: "text-footer",
        type: "Text",
        props: {
          children: "Notion.so, the all-in-one-workspace for your notes, tasks, wikis, and databases.",
          style: {
            fontSize: "12px",
            lineHeight: "22px",
            color: "#898989",
            marginTop: "12px",
          },
        },
      },
    ],
  },
  // ============================================
  // TWITCH PASSWORD RESET - With Tailwind Classes
  // ============================================
  {
    id: "twitch-password-reset",
    name: "Twitch Password Reset",
    description: "Password update notification (Tailwind)",
    category: "transactional",
    usesTailwind: true,
    tailwindConfig: twitchTailwindConfig,
    components: [
      {
        id: "preview-1",
        type: "Preview",
        props: {
          children: "You updated the password for your Twitch account",
        },
      },
      {
        id: "container-1",
        type: "Container",
        className: "max-w-[580px] my-[30px] mx-auto bg-white",
        props: {},
        children: [
          // Logo Section
          {
            id: "section-logo",
            type: "Section",
            className: "p-[30px]",
            props: {},
            children: [
              {
                id: "logo-1",
                type: "Image",
                className: "mx-auto",
                props: {
                  src: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Twitch_logo.svg/200px-Twitch_logo.svg.png",
                  alt: "Twitch",
                  width: "114",
                  height: "38",
                },
              },
            ],
          },
          // Purple Accent Divider
          {
            id: "section-divider",
            type: "Section",
            className: "w-full",
            props: {},
            children: [
              {
                id: "row-divider",
                type: "Row",
                props: {},
                children: [
                  {
                    id: "col-left",
                    type: "Column",
                    className: "border-b border-[#eeeeee] w-[239px]",
                    props: {},
                  },
                  {
                    id: "col-center",
                    type: "Column",
                    className: "border-b-2 border-[#9147ff] w-[102px]",
                    props: {},
                  },
                  {
                    id: "col-right",
                    type: "Column",
                    className: "border-b border-[#eeeeee] w-[239px]",
                    props: {},
                  },
                ],
              },
            ],
          },
          // Content Section
          {
            id: "section-content",
            type: "Section",
            className: "pt-[5px] px-5 pb-[10px]",
            props: {},
            children: [
              {
                id: "text-greeting",
                type: "Text",
                className: "text-[14px] leading-[1.5] text-[#0e0e10]",
                props: {
                  children: "Hi alanturing,",
                },
              },
              {
                id: "text-1",
                type: "Text",
                className: "text-[14px] leading-[1.5] text-[#0e0e10]",
                props: {
                  children: "You updated the password for your Twitch account on June 23, 2022 at 4:06:00 PM. If this was you, then no further action is required.",
                },
              },
              {
                id: "text-2",
                type: "Text",
                className: "text-[14px] leading-[1.5] text-[#0e0e10]",
                props: {
                  children: "However if you did NOT perform this password change, please reset your account password immediately.",
                },
              },
              {
                id: "link-reset",
                type: "Link",
                className: "text-[#9147ff] underline text-[14px]",
                props: {
                  href: "https://www.twitch.tv/password/reset",
                  children: "Reset your account password →",
                },
              },
              {
                id: "text-3",
                type: "Text",
                className: "text-[14px] leading-[1.5] text-[#0e0e10] mt-4",
                props: {
                  children: "Remember to use a password that is both strong and unique to your Twitch account. To learn more about how to create a strong and unique password, click here.",
                },
              },
              {
                id: "text-4",
                type: "Text",
                className: "text-[14px] leading-[1.5] text-[#0e0e10]",
                props: {
                  children: "Still have questions? Please contact Twitch Support.",
                },
              },
              {
                id: "link-support",
                type: "Link",
                className: "text-[#9147ff] underline text-[14px]",
                props: {
                  href: "https://help.twitch.tv",
                  children: "Twitch Support",
                },
              },
              {
                id: "text-signoff",
                type: "Text",
                className: "text-[14px] leading-[1.5] text-[#0e0e10] mt-4",
                props: {
                  children: "Thanks,\nTwitch Support Team",
                },
              },
            ],
          },
        ],
      },
      // Footer Section
      {
        id: "section-footer",
        type: "Section",
        className: "max-w-[580px] mx-auto",
        props: {},
        children: [
          {
            id: "row-social",
            type: "Row",
            className: "mb-4",
            props: {},
            children: [
              {
                id: "col-twitter",
                type: "Column",
                className: "w-1/2 text-right pr-2",
                props: {},
                children: [
                  {
                    id: "img-twitter",
                    type: "Image",
                    props: {
                      src: "https://cdn-icons-png.flaticon.com/24/733/733579.png",
                      alt: "Twitter",
                      width: "24",
                      height: "24",
                    },
                  },
                ],
              },
              {
                id: "col-facebook",
                type: "Column",
                className: "w-1/2 text-left pl-2",
                props: {},
                children: [
                  {
                    id: "img-facebook",
                    type: "Image",
                    props: {
                      src: "https://cdn-icons-png.flaticon.com/24/733/733547.png",
                      alt: "Facebook",
                      width: "24",
                      height: "24",
                    },
                  },
                ],
              },
            ],
          },
          {
            id: "text-copyright",
            type: "Text",
            className: "text-center text-[#706a7b] text-[12px]",
            props: {
              children: "© 2024 Twitch, All Rights Reserved\n350 Bush Street, 2nd Floor, San Francisco, CA, 94104 - USA",
            },
          },
        ],
      },
    ],
  },
];

export const getTemplatesByCategory = () => {
  const categories: Record<string, DefaultTemplate[]> = {
    verification: [],
    marketing: [],
    transactional: [],
    notification: [],
  };

  defaultTemplates.forEach((template) => {
    const category = categories[template.category];
    if (category) {
      category.push(template);
    }
  });

  return categories;
};

