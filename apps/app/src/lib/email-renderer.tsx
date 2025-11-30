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
// @ts-expect-error - Package types not properly exported
import { ResponsiveRow, ResponsiveColumn } from "@responsive-email/react-email";

const componentMap: Record<string, React.ComponentType<any>> = {
  Container,
  Section,
  // Use responsive Row/Column for better mobile support
  Row: ResponsiveRow,
  Column: ResponsiveColumn,
  Heading,
  Text,
  Button,
  Link,
  Image: Img,
  Hr,
  Divider: Hr, // Alias for Divider component
  Preview,
};

// Social platforms data for rendering (embedded SVG icons for reliability)
const SOCIAL_PLATFORMS_DATA: Record<string, { name: string; color: string; icon: string }> = {
  facebook: { name: "Facebook", color: "#1877F2", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z'/%3E%3C/svg%3E" },
  twitter: { name: "Twitter / X", color: "#000000", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z'/%3E%3C/svg%3E" },
  instagram: { name: "Instagram", color: "#E4405F", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077'/%3E%3C/svg%3E" },
  linkedin: { name: "LinkedIn", color: "#0A66C2", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'/%3E%3C/svg%3E" },
  youtube: { name: "YouTube", color: "#FF0000", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'/%3E%3C/svg%3E" },
  tiktok: { name: "TikTok", color: "#000000", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z'/%3E%3C/svg%3E" },
  github: { name: "GitHub", color: "#181717", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12'/%3E%3C/svg%3E" },
  discord: { name: "Discord", color: "#5865F2", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z'/%3E%3C/svg%3E" },
  twitch: { name: "Twitch", color: "#9146FF", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z'/%3E%3C/svg%3E" },
  reddit: { name: "Reddit", color: "#FF4500", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 0C5.373 0 0 5.373 0 12c0 6.628 5.373 12 12 12s12-5.372 12-12c0-6.627-5.373-12-12-12zm6.066 13.066c.132.323.198.676.198 1.035 0 2.708-3.138 4.899-7.007 4.899-3.869 0-7.007-2.191-7.007-4.899 0-.359.066-.712.198-1.035A1.783 1.783 0 0 1 3.5 11.5a1.775 1.775 0 0 1 2.98-1.31 8.676 8.676 0 0 1 4.68-1.476l.888-4.168a.38.38 0 0 1 .153-.222.39.39 0 0 1 .268-.055l2.961.62a1.214 1.214 0 1 1-.125.598l-2.651-.555-.792 3.732a8.63 8.63 0 0 1 4.598 1.476 1.773 1.773 0 0 1 2.98 1.31 1.783 1.783 0 0 1-.948 1.566zm-9.463.732a1.203 1.203 0 1 0 0-2.406 1.203 1.203 0 0 0 0 2.406zm5.398 3.158c-.155.154-.646.456-1.973.456-1.328 0-1.818-.302-1.973-.456a.269.269 0 0 0-.38.381c.21.209.878.582 2.353.582s2.144-.373 2.353-.582a.269.269 0 0 0-.38-.381zm-.486-1.949a1.203 1.203 0 1 0 0-2.406 1.203 1.203 0 0 0 0 2.406z'/%3E%3C/svg%3E" },
  pinterest: { name: "Pinterest", color: "#BD081C", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z'/%3E%3C/svg%3E" },
  whatsapp: { name: "WhatsApp", color: "#25D366", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z'/%3E%3C/svg%3E" },
  telegram: { name: "Telegram", color: "#26A5E4", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z'/%3E%3C/svg%3E" },
  threads: { name: "Threads", color: "#000000", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.332-3.023.869-.72 2.082-1.137 3.514-1.208 1.075-.053 2.083.03 3.006.249-.055-.988-.396-1.756-.987-2.221-.645-.507-1.6-.771-2.84-.785h-.033c-.995.007-1.862.205-2.573.59-.558.3-.975.685-1.242 1.138l-1.72-1.065c.396-.67.959-1.231 1.673-1.668 1.012-.62 2.236-.946 3.64-.97h.04c1.694.02 3.076.456 4.105 1.295 1.003.818 1.586 1.996 1.735 3.502.464.108.91.243 1.337.408 1.373.53 2.48 1.396 3.199 2.503.863 1.332 1.123 2.964.732 4.59-.533 2.22-1.958 3.986-4.121 5.106C17.123 23.467 14.835 24 12.186 24zM10.075 13.9c-1.048.053-1.862.333-2.362.81-.427.408-.623.893-.584 1.442.055.757.445 1.333 1.16 1.713.613.327 1.4.464 2.22.422 1.139-.062 2.05-.473 2.633-1.2.458-.57.752-1.363.858-2.322-.776-.18-1.626-.26-2.526-.212-.474.023-.936.073-1.399.147z'/%3E%3C/svg%3E" },
  mastodon: { name: "Mastodon", color: "#6364FF", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.02-.041.053.053 0 0 0-.046-.01 20.282 20.282 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.053.053 0 0 1 .066-.054c1.517.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.668-1.67 1.977v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z'/%3E%3C/svg%3E" },
  bluesky: { name: "Bluesky", color: "#0085FF", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z'/%3E%3C/svg%3E" },
  spotify: { name: "Spotify", color: "#1DB954", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z'/%3E%3C/svg%3E" },
  dribbble: { name: "Dribbble", color: "#EA4C89", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.04 6.4 1.73 1.358 3.92 2.166 6.29 2.166 1.42 0 2.77-.29 4-.814zm-11.62-2.58c.232-.4 3.045-5.055 8.332-6.765.135-.045.27-.084.405-.12-.26-.585-.54-1.167-.832-1.74C7.17 11.775 2.206 11.71 1.756 11.7l-.004.312c0 2.633.998 5.037 2.634 6.855zm-2.42-8.955c.46.008 4.683.026 9.477-1.248-1.698-3.018-3.53-5.558-3.8-5.928-2.868 1.35-5.01 3.99-5.676 7.17zM9.6 2.052c.282.38 2.145 2.914 3.822 6 3.645-1.365 5.19-3.44 5.373-3.702-1.81-1.61-4.19-2.586-6.795-2.586-.825 0-1.63.1-2.4.285zm10.335 3.483c-.218.29-1.935 2.493-5.724 4.04.24.49.47.985.68 1.486.08.18.15.36.22.53 3.41-.428 6.8.26 7.14.33-.02-2.42-.88-4.64-2.31-6.38z'/%3E%3C/svg%3E" },
  behance: { name: "Behance", color: "#1769FF", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M6.938 4.503c.702 0 1.34.06 1.92.188.577.13 1.07.33 1.485.61.41.28.733.65.96 1.12.225.47.34 1.05.34 1.73 0 .74-.17 1.36-.507 1.86-.338.5-.837.9-1.502 1.22.906.26 1.576.72 2.022 1.37.448.66.665 1.45.665 2.36 0 .75-.13 1.39-.41 1.93-.28.55-.67 1-1.16 1.35-.48.348-1.05.6-1.67.767-.61.165-1.252.254-1.91.254H0V4.51h6.938v-.007zM6.545 9.66c.538 0 .97-.12 1.3-.357.33-.238.49-.614.49-1.127 0-.29-.06-.53-.17-.723-.116-.19-.27-.35-.466-.453-.2-.105-.41-.176-.654-.21-.24-.036-.5-.052-.76-.052H3.167v2.93H6.54l.005-.007zm.246 5.41c.29 0 .56-.028.84-.088.275-.058.51-.16.72-.295.21-.135.375-.32.505-.546.13-.228.19-.516.19-.865 0-.67-.2-1.15-.6-1.45-.395-.3-.92-.45-1.57-.45H3.166v3.69h3.62l.005.004zm6.98-8.4h5.99v1.36h-5.99V6.67zm2.96 10.27c.51.49 1.24.735 2.18.735.674 0 1.26-.165 1.755-.5.49-.33.79-.69.9-1.08h2.99c-.48 1.52-1.2 2.59-2.18 3.21-.98.625-2.16.93-3.54.93-.946 0-1.8-.15-2.56-.455-.757-.3-1.4-.72-1.93-1.27-.53-.547-.93-1.2-1.22-1.96-.29-.757-.434-1.59-.434-2.5 0-.87.147-1.68.44-2.42.295-.74.7-1.38 1.22-1.92.518-.54 1.14-.96 1.87-1.27.725-.3 1.52-.46 2.39-.46.98 0 1.84.19 2.58.577.74.387 1.35.91 1.84 1.57.49.66.84 1.42 1.07 2.29.23.866.306 1.78.23 2.74h-8.86c.06 1.01.38 1.8.89 2.29zm3.79-6.6c-.395-.42-1.02-.63-1.88-.63-.56 0-1.03.09-1.41.28-.377.19-.67.43-.89.73-.22.3-.37.61-.45.95-.08.34-.12.64-.14.9h5.57c-.14-.89-.41-1.55-.8-1.97v-.26z'/%3E%3C/svg%3E" },
  medium: { name: "Medium", color: "#000000", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z'/%3E%3C/svg%3E" },
  slack: { name: "Slack", color: "#4A154B", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z'/%3E%3C/svg%3E" },
};

export function renderComponent(component: EmailComponent): React.ReactElement {
  // Special handling for Image component with alignment
  if (component.type === "Image") {
    const imageProps = component.props || {};
    const textAlign = imageProps.style?.textAlign || "center";
    
    // Wrap Image in Section with textAlign for proper email alignment
    return React.createElement(
      Section,
      {
        key: component.id,
        style: {
          textAlign: textAlign as any,
          padding: "0",
        }
      },
      React.createElement(Img, {
        src: imageProps.src || "",
        alt: imageProps.alt || "",
        width: imageProps.width,
        height: imageProps.height,
        style: {
          ...imageProps.style,
          display: "block",
          margin: textAlign === "center" ? "0 auto" : textAlign === "right" ? "0 0 0 auto" : "0",
        }
      })
    );
  }
  
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
  
  // Special handling for Stats component using ResponsiveRow/ResponsiveColumn
  if (component.type === "Stats") {
    const stats = component.props?.stats || [];
    const style = component.props?.style || {};
    
    return React.createElement(
      Section,
      {
        key: component.id,
        style: {
          padding: style.padding || "24px 0",
        }
      },
      React.createElement(
        ResponsiveRow,
        {},
        stats.map((stat: { value: string; title: string; description?: string }, i: number) => {
          return React.createElement(
            ResponsiveColumn,
            {
              key: i,
            },
            React.createElement(
              Text,
              {
                className: "m-0 text-left text-[18px] leading-[24px] font-bold tracking-tight text-gray-900 tabular-nums",
              },
              stat.value
            ),
            React.createElement(
              Text,
              {
                className: "m-0 text-left text-[12px] leading-[18px] text-gray-500",
              },
              stat.title
            ),
            stat.description && stat.description.trim() ? React.createElement(
              Text,
              {
                className: "m-0 text-left text-[12px] leading-[18px] text-gray-400 mt-1",
              },
              stat.description
            ) : null
          );
        })
      )
    );
  }
  
  // Special handling for NumberedList component - using official react.email structure
  if (component.type === "NumberedList") {
    const items = component.props?.items || [];
    const numberBgColor = component.props?.numberBgColor || "#4f46e5";
    const style = component.props?.style || {};
    
    // Convert hex color to Tailwind-compatible format for className
    const bgColorClass = numberBgColor === "#4f46e5" ? "bg-indigo-600" : `bg-[${numberBgColor}]`;
    
    return React.createElement(
      "div",
      {
        key: component.id,
        style: {
          padding: style.padding || "0",
        }
      },
      items.map((item: { title: string; description: string }, i: number) => {
        return React.createElement(
          Section,
          {
            key: i,
            className: "mb-[36px]",
          },
          React.createElement(
            Row as any,
            {
              className: "pr-[32px] pl-[12px]",
            },
            // Number circle column - exactly like official example
            React.createElement(
              Column as any,
              {
                width: "24",
                height: "24",
                align: "center",
                valign: "top",
                className: "pr-[18px] h-[24px] w-[24px]",
              },
              React.createElement(
                Row as any,
                {},
                React.createElement(
                  Column as any,
                  {
                    align: "center",
                    valign: "middle",
                    width: "24",
                    height: "24",
                    className: `h-[24px] w-[24px] rounded-full ${bgColorClass} font-semibold text-white text-[12px] leading-none`,
                  },
                  String(i + 1)
                )
              )
            ),
            // Content column
            React.createElement(
              Column as any,
              {
                valign: "top",
              },
              React.createElement(
                Heading,
                {
                  as: "h2",
                  className: "mt-[0px] mb-[8px] text-gray-900 text-[18px] leading-[28px]",
                },
                item.title
              ),
              React.createElement(
                Text,
                {
                  className: "m-0 text-gray-500 text-[14px] leading-[24px]",
                },
                item.description
              )
            )
          )
        );
      })
    );
  }

  // Special handling for Gallery component - exact match to react.email template
  if (component.type === "Gallery") {
    const props = component.props || {};
    const sectionTitle = props.sectionTitle || "Our products";
    const headline = props.headline || "Elegant Style";
    const description = props.description || "";
    const titleColor = props.titleColor || "#4f46e5";
    const headlineColor = props.headlineColor || "#111827";
    const descriptionColor = props.descriptionColor || "#6b7280";
    const images = props.images || [];
    const columns = props.columns || 2;
    const imageHeight = props.imageHeight || 288;
    const borderRadius = props.borderRadius || "12px";
    const gap = props.gap || "16px";
    const style = props.style || {};

    // Split images into rows
    const rows: typeof images[] = [];
    for (let i = 0; i < images.length; i += columns) {
      rows.push(images.slice(i, i + columns));
    }

    const columnWidth = `${Math.floor(100 / columns)}%`;
    const halfGap = `${parseInt(gap) / 2}px`;

    return React.createElement(
      Section,
      {
        key: component.id,
        className: "my-[16px]",
        style: { padding: style.padding || "16px 0" },
      },
      // Header section
      React.createElement(
        Section,
        { className: "mt-[42px]" },
        React.createElement(
          "div",
          {},
          React.createElement(
            Text,
            {
              className: "m-0 font-semibold text-[16px] leading-[24px]",
              style: { color: titleColor },
            },
            sectionTitle
          ),
          React.createElement(
            Text,
            {
              className: "m-0 mt-[8px] font-semibold text-[24px] leading-[32px]",
              style: { color: headlineColor },
            },
            headline
          ),
          React.createElement(
            Text,
            {
              className: "mt-[8px] text-[16px] leading-[24px]",
              style: { color: descriptionColor },
            },
            description
          )
        )
      ),
      // Image grid
      React.createElement(
        Section,
        { className: "mt-[16px]" },
        rows.map((row: { src: string; alt: string; href: string }[], rowIdx: number) =>
          React.createElement(
            "div",
            { key: rowIdx, style: { display: "flex", marginTop: "16px" } },
            row.map((img: { src: string; alt: string; href: string }, colIdx: number) =>
              React.createElement(
                "div",
                {
                  key: colIdx,
                  style: {
                    width: columnWidth,
                    paddingLeft: colIdx === 0 ? "0" : halfGap,
                    paddingRight: colIdx === row.length - 1 ? "0" : halfGap,
                  },
                },
                React.createElement(
                  Link,
                  { href: img.href || "#" },
                  React.createElement(Img, {
                    alt: img.alt || "",
                    className: "w-full object-cover",
                    height: imageHeight,
                    src: img.src || "",
                    style: {
                      borderRadius: borderRadius,
                      width: "100%",
                      objectFit: "cover" as const,
                    },
                  })
                )
              )
            )
          )
        )
      )
    );
  }

  // Special handling for Marketing component - exact match to react.email template
  if (component.type === "Marketing") {
    const props = component.props || {};
    const headerBgColor = props.headerBgColor || "#292524";
    const headerTitle = props.headerTitle || "Coffee Storage";
    const headerDescription = props.headerDescription || "";
    const headerLinkText = props.headerLinkText || "Shop now →";
    const headerLinkUrl = props.headerLinkUrl || "#";
    const headerImage = props.headerImage || "";
    const headerImageAlt = props.headerImageAlt || "";
    const products = props.products || [];
    const containerBgColor = props.containerBgColor || "#ffffff";
    const borderRadius = props.borderRadius || "8px";
    const style = props.style || {};

    return React.createElement(
      Section,
      {
        key: component.id,
        style: { padding: style.padding || "0" },
      },
      React.createElement(
        Container,
        {
          className: "mx-auto max-w-[900px] overflow-hidden p-0",
          style: {
            backgroundColor: containerBgColor,
            borderRadius: borderRadius,
          },
        },
        // Header row with background
        React.createElement(
          Section,
          {},
          React.createElement(
            "div",
            {
              style: {
                backgroundColor: headerBgColor,
                display: "flex",
                padding: "24px",
              },
            },
            // Text column
            React.createElement(
              "div",
              { style: { flex: 1, paddingLeft: "12px" } },
              React.createElement(
                Heading,
                {
                  as: "h1",
                  className: "text-white text-[28px] font-bold mb-[10px]",
                },
                headerTitle
              ),
              React.createElement(
                Text,
                {
                  className: "text-[14px] leading-[20px] m-0",
                  style: { color: "rgba(255,255,255,0.6)" },
                },
                headerDescription
              ),
              React.createElement(
                Link,
                {
                  href: headerLinkUrl,
                  className: "block text-[14px] leading-[20px] font-semibold mt-[12px] no-underline",
                  style: { color: "rgba(255,255,255,0.8)" },
                },
                headerLinkText
              )
            ),
            // Image column
            React.createElement(
              "div",
              { style: { width: "42%", height: "250px" } },
              React.createElement(Img, {
                src: headerImage,
                alt: headerImageAlt,
                className: "h-full -mr-[6px] object-cover object-center w-full",
                style: { borderRadius: "4px" },
              })
            )
          )
        ),
        // Products section
        React.createElement(
          Section,
          { className: "mb-[24px]" },
          React.createElement(
            "div",
            {
              style: { display: "flex", gap: "24px", padding: "12px" },
            },
            products.map((product: { imageUrl: string; altText: string; title: string; description: string; linkUrl: string }, idx: number) =>
              React.createElement(
                "div",
                {
                  key: idx,
                  style: { flex: 1, maxWidth: "180px", margin: "0 auto" },
                },
                React.createElement(Img, {
                  src: product.imageUrl,
                  alt: product.altText,
                  className: "mb-[18px] w-full",
                  style: { borderRadius: "4px" },
                }),
                React.createElement(
                  "div",
                  {},
                  React.createElement(
                    Heading,
                    {
                      as: "h2",
                      className: "text-[14px] leading-[20px] font-bold mb-[8px]",
                    },
                    product.title
                  ),
                  React.createElement(
                    Text,
                    {
                      className: "text-gray-500 text-[12px] leading-[20px] m-0 pr-[12px]",
                    },
                    product.description
                  )
                )
              )
            )
          )
        )
      )
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
    // Use responsive Row/Column for better mobile support
    if (componentType === "Row") componentType = "ResponsiveRow";
    if (componentType === "Column") componentType = "ResponsiveColumn";
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
  Heading,
  Text,
  Button,
  Link,
  Img,
  Hr,
  Preview,
  Tailwind,
} from "@react-email/components";
import { ResponsiveRow, ResponsiveColumn } from "@responsive-email/react-email";

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
  Heading,
  Text,
  Button,
  Link,
  Img,
  Hr,
  Preview,
} from "@react-email/components";
import { ResponsiveRow, ResponsiveColumn } from "@responsive-email/react-email";

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
