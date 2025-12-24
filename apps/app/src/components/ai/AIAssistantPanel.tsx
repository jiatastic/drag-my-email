"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Sparkles, History, Plus, Trash2, ChevronLeft } from "lucide-react";

import { ChatContainerContent, ChatContainerRoot, ChatContainerScrollAnchor } from "../prompt-kit/chat-container";
import { Message, MessageContent } from "../prompt-kit/message";
import { PromptInputWithActions } from "../prompt-kit/prompt-input-with-actions";
import { componentRegistry } from "@/lib/component-registry";
import type { EmailComponent, EmailGlobalStyles } from "@/types";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useConvexAuth } from "convex/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@react-email-builder/ui";

// Define message type compatible with useChat (supports both string and parts array)
type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string | Array<{ type: string; text?: string }>;
};

// Helper to extract text content from message
function getMessageContent(content: string | Array<{ type: string; text?: string }>): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((part) => part.text || "").join("");
  }
  return "";
}

type BrandContext = {
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

// Email-safe image sizing for the 600px container layout.
// Intercom-style banner is typically 3:1 (600x200). Hero is 16:9 (600x338).
const EMAIL_CANVAS_WIDTH = 600;
const EMAIL_HERO_HEIGHT = 338; // round(600 * 9 / 16)
const EMAIL_BANNER_HEIGHT = 200; // 3:1

function normalizeEmailImagesForEmailFit(
  components: EmailComponent[],
  brandContext?: BrandContext
): EmailComponent[] {
  const heroUrl = brandContext?.marketingAssets?.hero;
  const bannerUrl = brandContext?.marketingAssets?.banner;

  const looksLikeUnsplashSize = (src: string, w: number, h: number) => {
    // We match the common URL shape used in our placeholders.
    return src.includes("images.unsplash.com") && src.includes(`w=${w}`) && src.includes(`h=${h}`);
  };

  const normalizeOne = (component: EmailComponent): EmailComponent => {
    const next: EmailComponent = {
      ...component,
      props: { ...(component.props || {}) },
      ...(component.children ? { children: component.children.map(normalizeOne) } : {}),
    };

    if (next.type === "Image") {
      const src = String(next.props?.src || "");
      const isHero =
        (!!heroUrl && src === heroUrl) ||
        looksLikeUnsplashSize(src, 600, 338) ||
        // Back-compat: older prompts used 600x300 (2:1) as "hero" — fix to 16:9.
        looksLikeUnsplashSize(src, 600, 300);
      const isBanner = (!!bannerUrl && src === bannerUrl) || looksLikeUnsplashSize(src, 600, 200);

      if (isHero || isBanner) {
        const height = isBanner ? EMAIL_BANNER_HEIGHT : EMAIL_HERO_HEIGHT;
        next.props.width = String(EMAIL_CANVAS_WIDTH);
        next.props.height = String(height);
        next.props.style = {
          ...(next.props.style || {}),
          maxWidth: "100%",
          height: "auto",
        };
      }
    }

    return next;
  };

  return components.map(normalizeOne);
}

function safeJsonParse<T>(value: string | undefined | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

type Props = {
  components: EmailComponent[];
  globalStyles?: EmailGlobalStyles;
  onApplyTemplate?: (components: EmailComponent[]) => void;
  onUpdateGlobalStyles?: (styles: Partial<EmailGlobalStyles>) => void;
};

export function AIAssistantPanel({ components, globalStyles, onApplyTemplate, onUpdateGlobalStyles }: Props) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"generate" | "edit">(components.length > 0 ? "edit" : "generate");
  const [inputValue, setInputValue] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

  // Convex auth and data
  const { isAuthenticated } = useConvexAuth();
  const chatHistories = useQuery(api.chatHistories.list);
  const createChat = useMutation(api.chatHistories.create);
  const updateChat = useMutation(api.chatHistories.update);
  const deleteChat = useMutation(api.chatHistories.remove);
  const brands = useQuery(api.brands.list);
  const marketingAssets = useQuery(
    api.marketingAssets.listByBrand,
    selectedBrandId ? ({ brandId: selectedBrandId as any } as any) : ("skip" as any)
  );

  useEffect(() => {
    setMode(components.length > 0 ? "edit" : "generate");
  }, [components]);

  useEffect(() => {
    if (!selectedBrandId && brands && brands.length > 0) {
      setSelectedBrandId(brands[0]!._id);
    }
  }, [brands, selectedBrandId]);

  const brandContext = useMemo<BrandContext | undefined>(() => {
    if (!brands || !selectedBrandId) return undefined;
    const brand = brands.find((b) => b._id === selectedBrandId);
    if (!brand) return undefined;

    const branding = safeJsonParse<any>(brand.brandingJson);

    // Pick the latest succeeded image for each asset type.
    const assets = Array.isArray(marketingAssets) ? marketingAssets : [];
    const succeeded = assets.filter((a: any) => a?.status === "succeeded" && a?.imageUrl);
    const findLatestUrl = (type: string) =>
      (succeeded.find((a: any) => a.type === type)?.imageUrl as string | undefined) ?? undefined;

    const gallery = succeeded
      .map((a: any) => a.imageUrl as string)
      .filter(Boolean)
      .slice(0, 6);

    return {
      name: brand.name,
      domain: brand.domain,
      summary: brand.summary ?? undefined,
      colorScheme: branding?.colorScheme,
      colors: branding?.colors,
      fonts: branding?.fonts,
      images: branding?.images,
      marketingAssets: {
        hero: findLatestUrl("hero"),
        banner: findLatestUrl("banner"),
        socialPost: findLatestUrl("social_post"),
        logoVariant: findLatestUrl("logo_variant"),
        gallery: gallery.length > 0 ? gallery : undefined,
      },
    };
  }, [brands, selectedBrandId, marketingAssets]);

  const componentsForBody = useMemo(() => components, [components]);

  // Manually manage chat state and API calls
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-save chat to cloud when messages change (debounced)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!isAuthenticated || messages.length === 0 || isLoading) return;
    
    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Debounce save
    saveTimeoutRef.current = setTimeout(async () => {
      const title = getMessageContent(messages[0]?.content || "").slice(0, 50) || "New Chat";
      const messagesJson = JSON.stringify(messages);
      
      try {
        if (currentChatId) {
          // Update existing chat
          await updateChat({
            id: currentChatId as any,
            messages: messagesJson,
            title,
          });
        } else {
          // Create new chat
          const newId = await createChat({
            title,
            messages: messagesJson,
          });
          setCurrentChatId(newId);
        }
      } catch (err) {
        console.error("Failed to save chat:", err);
      }
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [messages, isLoading, isAuthenticated, currentChatId, createChat, updateChat]);

  // Load a chat from history
  const loadChat = (chatId: string, chatMessages: string) => {
    try {
      const parsed = JSON.parse(chatMessages);
      setMessages(parsed);
      setCurrentChatId(chatId);
      setShowHistory(false);
    } catch (err) {
      console.error("Failed to load chat:", err);
    }
  };

  // Start a new chat
  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setShowHistory(false);
  };

  // Delete a chat
  const handleDeleteChat = async (chatId: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this conversation?")) return;
    
    try {
      await deleteChat({ id: chatId });
      if (currentChatId === chatId) {
        startNewChat();
      }
    } catch (err) {
      console.error("Failed to delete chat:", err);
    }
  };

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    anchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onValueChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  const onSubmit = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;
    const userMessage = inputValue.trim();
    setInputValue("");
    
    // Add user message to chat
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userMessage,
    };
    setMessages((prev) => [...prev, userMsg]);
    
    // Add placeholder for assistant response
    const assistantMsgId = `assistant-${Date.now()}`;
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setIsLoading(true);
    
    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: getMessageContent(m.content),
          })),
          components: componentsForBody,
          mode,
          globalStyles,
          brandContext,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Handle streaming response (toTextStreamResponse returns plain text)
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";

      if (!reader) {
        throw new Error("No response body");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        
        // toTextStreamResponse returns plain text chunks
        accumulatedContent += chunk;
        
        // Update message with accumulated content in real-time
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: accumulatedContent }
              : msg
          )
        );
      }

      // Final update with complete content
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId ? { ...msg, content: accumulatedContent } : msg
        )
      );
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Request aborted");
        // Remove the placeholder assistant message
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMsgId));
      } else {
        console.error("Failed to send message", err);
        // Remove the placeholder assistant message on error
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMsgId));
        // Add error message with details
        const errorMessage = err.message || "Sorry, I encountered an error. Please try again.";
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: `Error: ${errorMessage}\n\nFor Vercel AI Gateway, please check:\n1. AI_GATEWAY_API_KEY environment variable is set\n2. Network connection is stable\n3. API key is valid\n\nCheck server logs for more details.`,
          },
        ]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [inputValue, isLoading, messages, componentsForBody, mode, globalStyles]);

  const chatMessages = messages;

  const buildComponentTree = (items: any): EmailComponent[] => {
    const generateId = () =>
      `component-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`}`;

    if (!Array.isArray(items)) return [];

    return items
      .filter((item) => item && typeof item === "object" && typeof item.type === "string")
      .map((item) => {
        const registryItem = componentRegistry[item.type];
        const defaultProps = registryItem?.defaultProps ?? {};
        const mergedChildren = Array.isArray(item.children) ? buildComponentTree(item.children) : undefined;

        return {
          id: item.id ?? generateId(),
          type: item.type,
          props: { ...defaultProps, ...(item.props ?? {}) },
          ...(mergedChildren && mergedChildren.length > 0 ? { children: mergedChildren } : {}),
        };
      });
  };

  // Track processed payloads to prevent duplicate application
  const processedPayloadRef = useRef<string | null>(null);
  const onApplyTemplateRef = useRef(onApplyTemplate);
  const onUpdateGlobalStylesRef = useRef(onUpdateGlobalStyles);

  // Keep refs up to date
  useEffect(() => {
    onApplyTemplateRef.current = onApplyTemplate;
    onUpdateGlobalStylesRef.current = onUpdateGlobalStyles;
  }, [onApplyTemplate, onUpdateGlobalStyles]);

  // Parse AI response and extract EMAIL_JSON payload
  useEffect(() => {
    if (!chatMessages.length || isLoading) return;
    
    const latest = [...chatMessages].reverse().find((m) => m.role === "assistant");
    if (!latest) return;
    
    // Handle both string content and parts array
    const content = getMessageContent(latest.content);
    
    if (!content) return;

    const match = content.match(/\{\{EMAIL_JSON\}\}([\s\S]*?)\{\{\/EMAIL_JSON\}\}/);
    if (!match || match.length < 2) return;

    try {
      const payloadStr = match[1];

      // Skip if we've already applied this payload (prevents loops)
      if (processedPayloadRef.current === payloadStr) return;
      processedPayloadRef.current = payloadStr;

      const payload = JSON.parse(payloadStr);
      
      if (payload?.components && Array.isArray(payload.components) && typeof window !== "undefined") {
        const tree = buildComponentTree(payload.components);
        // Ensure brand marketing assets fit exactly in email clients by enforcing width/height.
        const normalized = normalizeEmailImagesForEmailFit(tree, brandContext);
        onApplyTemplateRef.current?.(normalized);
      }
      if (payload?.globalStyles) {
        onUpdateGlobalStylesRef.current?.(payload.globalStyles);
      }
    } catch (err) {
      console.error("Failed to parse AI payload", err);
    }
  }, [chatMessages, isLoading]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            {showHistory ? (
              <button
                onClick={() => setShowHistory(false)}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            ) : (
              <Sparkles className="h-4 w-4 text-purple-500" />
            )}
            {showHistory ? "Chat History" : "AI Assistant"}
          </div>
          {isAuthenticated && !showHistory && (
            <div className="flex items-center gap-1">
              <button
                onClick={startNewChat}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
                title="New chat"
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
                title="Chat history"
              >
                <History className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>
        {!showHistory && isAuthenticated && brands && brands.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-muted-foreground">Brand context</span>
              <div className="w-[180px]">
                <Select value={selectedBrandId ?? undefined} onValueChange={setSelectedBrandId}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => (
                      <SelectItem key={b._id} value={b._id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>

      {showHistory ? (
        /* Chat History View */
        <div className="flex-1 overflow-auto p-3">
          {!chatHistories ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : chatHistories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <History className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No chat history yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Your conversations will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {chatHistories.map((chat) => (
                <div
                  key={chat._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => loadChat(chat._id, chat.messages)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      loadChat(chat._id, chat.messages);
                    }
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                    currentChatId === chat._id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {chat.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(chat.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteChat(chat._id, e)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
                      title="Delete"
                      type="button"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
      <ChatContainerRoot className="flex-1 rounded-none">
        <ChatContainerContent className="space-y-3 bg-background p-4">
          {chatMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">Hi! I'm your email assistant</h3>
                <p className="max-w-[200px] text-xs text-muted-foreground">
                  I can help you build beautiful email templates. Try asking me to create a marketing email or edit your current design.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <button 
                  type="button"
                  onClick={() => {
                    setInputValue("Create a simple welcome email");
                  }}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Welcome email
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setInputValue("Design a product launch announcement");
                  }}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Product launch
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setInputValue("Create a newsletter template");
                  }}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Newsletter
                </button>
              </div>
            </div>
          ) : (
            chatMessages.map((message, index) => {
              const isUser = message.role === "user";
              const content = getMessageContent(message.content);
              const isLastAssistantMessage = 
                !isUser && index === chatMessages.length - 1;
              const isMessageStreaming = isLastAssistantMessage && isLoading;
              
              return (
                <Message
                  key={message.id}
                  className={isUser ? "justify-end" : "justify-start"}
                >
                  <MessageContent 
                    markdown 
                    isStreaming={isMessageStreaming}
                    className={isUser ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-md" : "rounded-2xl rounded-tl-md"}
                  >
                    {content}
                  </MessageContent>
                </Message>
              );
            })
          )}
          <ChatContainerScrollAnchor ref={anchorRef} />
        </ChatContainerContent>
      </ChatContainerRoot>
      )}

      {!showHistory && (
        <div className="border-t bg-background p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={`inline-block h-2 w-2 rounded-full ${mode === "generate" ? "bg-green-500" : "bg-blue-500"}`} />
              <span className="text-[11px] text-muted-foreground">
                {mode === "generate" ? "New email" : "Editing"}
              </span>
            </div>
            <Select value={mode} onValueChange={(v) => setMode(v as "generate" | "edit")}>
              <SelectTrigger className="h-7 w-[110px] px-2 text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="generate">Generate new</SelectItem>
                <SelectItem value="edit">Edit current</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <PromptInputWithActions
            value={inputValue}
            onValueChange={onValueChange}
            isLoading={isLoading}
            onSubmit={onSubmit}
            onStop={stop}
            placeholder="Describe your email idea..."
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}
