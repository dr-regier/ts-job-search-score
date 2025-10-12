"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type ToolUIPart } from "ai";
import React, { useState, useEffect, useRef, memo } from "react";
import { getJobs, getProfile } from "@/lib/storage";
import type { Job } from "@/types/job";
import type { UserProfile } from "@/types/profile";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import {
  Sources,
  SourcesTrigger,
  SourcesContent,
  Source,
} from "@/components/ai-elements/sources";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai-elements/reasoning";
import { Response } from "@/components/ai-elements/response";
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Array<{
    url: string;
    title?: string;
  }>;
  toolCalls?: Array<{
    type: `tool-${string}`;
    state:
      | "input-streaming"
      | "input-available"
      | "output-available"
      | "output-error";
    input?: any;
    output?: any;
    errorText?: string;
  }>;
};

// RAG Tool types for proper TypeScript support
type RAGToolInput = {
  query: string;
};

type RAGToolOutput = {
  context: string;
  sources: Array<{
    sourceType: 'url';
    id: string;
    url: string;
    title: string;
  }>;
  chatSources?: Array<{
    url: string;
    title: string;
  }>;
};

type RAGToolUIPart = ToolUIPart<{
  retrieveKnowledgeBase: {
    input: RAGToolInput;
    output: RAGToolOutput;
  };
}>;

interface ChatAssistantProps {
  api?: string;
}

// Memoized components for better performance
const MemoizedToolCall = memo(({
  toolPart,
  displayName,
  shouldBeExpanded
}: {
  toolPart: RAGToolUIPart;
  displayName: string;
  shouldBeExpanded: boolean;
}) => (
  <Tool defaultOpen={shouldBeExpanded}>
    <ToolHeader
      type={displayName as any}
      state={toolPart.state}
    />
    <ToolContent>
      {toolPart.state === "input-streaming" && (
        <div className="text-sm text-muted-foreground p-2">
          🔍 {displayName}...
        </div>
      )}
      {toolPart.input && toolPart.state !== "input-streaming" && (
        <ToolInput input={toolPart.input} />
      )}
      {toolPart.output && (
        <ToolOutput
          output={toolPart.output}
          errorText={toolPart.errorText}
        />
      )}
    </ToolContent>
  </Tool>
));

MemoizedToolCall.displayName = 'MemoizedToolCall';

const MemoizedMessage = memo(({
  message,
  isStreaming,
  children
}: {
  message: any;
  isStreaming: boolean;
  children?: React.ReactNode;
}) => {
  // Only handle text parts (reasoning is now handled as separate flow items)
  const textParts = message.parts?.filter((p: any) => p.type === 'text') || [];

  return (
    <>
      {/* Render text message if there's content */}
      {(textParts.length > 0 || message.content) && (
        <Message from={message.role}>
          <MessageContent>
            <Response>
              {textParts.map((part: any, i: number) => part.text).join('') || message.content || ""}
            </Response>
          </MessageContent>
          {children}
        </Message>
      )}
    </>
  );
});

MemoizedMessage.displayName = 'MemoizedMessage';

export default function ChatAssistant({ api }: ChatAssistantProps) {
  const [input, setInput] = useState("");

  // State for saved jobs and user profile (from localStorage)
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Load saved jobs and profile from localStorage
  useEffect(() => {
    const jobs = getJobs();
    const profile = getProfile();
    setSavedJobs(jobs);
    setUserProfile(profile);
  }, []);

  // Discovery Agent (Job Discovery) - default chat
  const discoveryChat = useChat({
    transport: api ? new DefaultChatTransport({ api }) : undefined,
    onFinish: () => {
      // Reload saved jobs after discovery agent finishes (in case jobs were saved)
      setSavedJobs(getJobs());
    },
  });

  // Matching Agent (Job Matching/Scoring)
  const matchingChat = useChat({
    transport: new DefaultChatTransport({
      api: '/api/match',
      body: {
        jobs: savedJobs,
        profile: userProfile,
      },
    }),
    onFinish: () => {
      // Reload saved jobs after matching agent finishes (scores may have been added)
      setSavedJobs(getJobs());
    },
  });

  // Determine which agent to use based on current context
  const [activeAgent, setActiveAgent] = useState<'discovery' | 'matching'>('discovery');

  // Track message order across both agents using a ref
  const messageOrderRef = useRef<Map<string, number>>(new Map());
  const nextOrderRef = useRef(0);

  // Merge messages from both agents chronologically
  const allRawMessages = React.useMemo(() => {
    const discovery = discoveryChat.messages.map(msg => ({
      ...msg,
      agentSource: 'discovery' as const
    }));
    const matching = matchingChat.messages.map(msg => ({
      ...msg,
      agentSource: 'matching' as const
    }));

    // Assign order numbers to new messages
    [...discovery, ...matching].forEach(msg => {
      if (!messageOrderRef.current.has(msg.id)) {
        messageOrderRef.current.set(msg.id, nextOrderRef.current++);
      }
    });

    // Combine and sort by insertion order
    return [...discovery, ...matching].sort((a, b) => {
      const orderA = messageOrderRef.current.get(a.id) ?? 0;
      const orderB = messageOrderRef.current.get(b.id) ?? 0;
      return orderA - orderB;
    });
  }, [discoveryChat.messages, matchingChat.messages]);

  // Status is from whichever agent is currently active
  const status = activeAgent === 'matching' ? matchingChat.status : discoveryChat.status;

  // Debounced messages for performance - update every 30ms instead of every token
  const [debouncedMessages, setDebouncedMessages] = useState(allRawMessages);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastRawMessagesRef = useRef(allRawMessages);

  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Check for critical events that need immediate updates
    const needsImmediateUpdate = () => {
      // Update immediately when streaming stops
      if (status !== 'streaming' && lastRawMessagesRef.current !== allRawMessages) {
        return true;
      }

      // Update immediately when tool calls appear/change
      const hasNewToolCalls = allRawMessages.some(msg =>
        (msg as any).parts?.some((p: any) => p.type?.startsWith('tool-')) &&
        !lastRawMessagesRef.current.some(oldMsg => oldMsg.id === msg.id)
      );

      if (hasNewToolCalls) {
        return true;
      }

      return false;
    };

    if (needsImmediateUpdate()) {
      // Immediate update for critical events
      setDebouncedMessages(allRawMessages);
      lastRawMessagesRef.current = allRawMessages;
    } else {
      // Debounced update for regular streaming
      debounceTimerRef.current = setTimeout(() => {
        setDebouncedMessages(allRawMessages);
        lastRawMessagesRef.current = allRawMessages;
      }, 30);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [allRawMessages, status]);

  // Use debounced messages for rendering
  const messages = debouncedMessages;

  /**
   * Detects if user message indicates scoring/matching intent
   */
  const detectScoringIntent = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    const scoringKeywords = [
      'score',
      'analyze',
      'match',
      'fit',
      'rate',
      'evaluate',
      'assess',
      'rank',
      'priority',
      'compare',
    ];

    return scoringKeywords.some(keyword => lowerText.includes(keyword));
  };

  const handleSubmit = async (
    message: { text?: string; files?: any[] },
    event: React.FormEvent
  ) => {
    if (!message.text?.trim() || status === "streaming") return;

    const messageText = message.text.trim();

    // Clear the form immediately after extracting the message
    const form = (event.target as Element)?.closest("form") as HTMLFormElement;
    if (form) {
      form.reset();
    }

    // Determine which agent to use based on intent
    const wantsScoring = detectScoringIntent(messageText);

    if (wantsScoring && savedJobs.length > 0) {
      // User wants scoring and has saved jobs -> use Matching Agent
      if (!userProfile) {
        // No profile - send to discovery agent to handle this gracefully
        discoveryChat.sendMessage({
          text: "I'd like to score jobs, but I don't have a profile yet. Can you help me create one?"
        });
        setActiveAgent('discovery');
      } else {
        // Has profile and saved jobs - use matching agent
        setActiveAgent('matching');
        matchingChat.sendMessage({ text: messageText });
      }
    } else if (wantsScoring && savedJobs.length === 0) {
      // User wants scoring but has no saved jobs - explain this
      discoveryChat.sendMessage({
        text: "I'd like to score jobs, but I haven't saved any yet. Can you help me find and save some jobs first?"
      });
      setActiveAgent('discovery');
    } else {
      // Default to Discovery Agent for job search and other queries
      setActiveAgent('discovery');
      discoveryChat.sendMessage({ text: messageText });
    }

    setInput("");
  };

  const isLoading = status === "streaming";

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden">
      <Conversation className="flex-1 h-0 overflow-hidden">
        <ConversationContent className="space-y-4">
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="Start a conversation"
              description="Ask me anything and I'll help you out!"
            />
          ) : (
            (() => {
              // Tool display name mapping
              const toolDisplayNames: Record<string, string> = {
                'tool-retrieveKnowledgeBase': 'Knowledge Base Search',
                // Add more tool mappings as needed
              };

              // Extract flow items (messages + tool calls + reasoning) in chronological order
              const flowItems: Array<{
                type: 'message' | 'tool-call' | 'reasoning';
                data: any;
                id: string;
                messageId?: string;
                displayName?: string;
                partIndex?: number;
              }> = [];

              messages.forEach((message) => {
                // Process all parts in chronological order
                const parts = (message as any).parts || [];

                parts.forEach((part: any, partIndex: number) => {
                  if (part.type?.startsWith('tool-')) {
                    // Handle tool calls
                    const uniqueId = part.toolCallId ||
                                    part.id ||
                                    `${message.id}-${part.type}-${partIndex}`;

                    flowItems.push({
                      type: 'tool-call',
                      data: part,
                      id: `tool-${uniqueId}`,
                      messageId: message.id,
                      displayName: toolDisplayNames[part.type] || part.type,
                      partIndex
                    });
                  } else if (part.type === 'reasoning') {
                    // Handle reasoning parts
                    flowItems.push({
                      type: 'reasoning',
                      data: part,
                      id: `reasoning-${message.id}-${partIndex}`,
                      messageId: message.id,
                      partIndex
                    });
                  }
                  // text parts will be handled in the message itself
                });

                // Add the message itself (with only text parts and legacy content)
                const messageWithTextOnly = {
                  ...message,
                  parts: parts.filter((part: any) =>
                    part.type === 'text' || !part.type // include parts without type for backward compatibility
                  )
                };

                // Only add message if it has content (text or legacy content)
                const hasContent = messageWithTextOnly.parts.length > 0 || !!(message as any).content;
                if (hasContent) {
                  flowItems.push({
                    type: 'message',
                    data: messageWithTextOnly,
                    id: `message-${message.id}`
                  });
                }
              });

              // Check for duplicate keys and log errors only
              const allIds = flowItems.map(item => item.id);
              const duplicateIds = allIds.filter((id, index) => allIds.indexOf(id) !== index);
              if (duplicateIds.length > 0) {
                console.error(`🚨 Duplicate keys found:`, duplicateIds);
              }

              return flowItems.map((item, itemIndex) => {
                if (item.type === 'tool-call') {
                  // Render tool call status block
                  const toolPart = item.data as RAGToolUIPart;

                  // Tools are collapsed by default
                  const shouldBeExpanded = false;

                  return (
                    <div key={item.id} className="w-full mb-4">
                      <MemoizedToolCall
                        toolPart={toolPart}
                        displayName={item.displayName || toolPart.type}
                        shouldBeExpanded={shouldBeExpanded}
                      />
                    </div>
                  );
                } else if (item.type === 'reasoning') {
                  // Render reasoning block
                  const reasoningPart = item.data;

                  return (
                    <div key={item.id} className="w-full mb-4">
                      <Reasoning
                        isStreaming={isLoading}
                        className="mb-4"
                      >
                        <ReasoningTrigger />
                        <ReasoningContent>{reasoningPart.text || ''}</ReasoningContent>
                      </Reasoning>
                    </div>
                  );
                } else {
                  // Render regular message
                  const message = item.data;

                  // Generate sources component
                  const sourcesComponent = message.role === 'assistant' && (() => {
                        // Strict check for actual text content - don't show sources without real text
                        const hasRealTextContent = (
                          message.parts?.some((p: any) => p.type === 'text' && p.text?.trim()) ||
                          (message.content?.trim())
                        );

                        if (!hasRealTextContent) {
                          // No real text content = never show sources (prevents showing below tool calls)
                          return null;
                        }

                        // Look backward through flow items for recent tool results
                        let toolSources: any[] = [];

                        for (let i = itemIndex - 1; i >= 0; i--) {
                          const prevItem = flowItems[i];
                          if (prevItem.type === 'tool-call') {
                            const toolData = prevItem.data as RAGToolUIPart;
                            if (toolData.type === 'tool-retrieveKnowledgeBase' && toolData.output?.sources) {
                              toolSources = toolData.output.sources;
                              break;
                            }
                          }
                        }

                        if (toolSources.length > 0) {
                          return (
                            <div className="mt-4">
                              <Sources>
                                <SourcesTrigger count={toolSources.length} />
                                <SourcesContent>
                                  {toolSources.map((source: any, i: number) => (
                                    <Source
                                      key={`source-${item.id}-${i}`}
                                      href={source.url}
                                      title={source.title}
                                    />
                                  ))}
                                </SourcesContent>
                              </Sources>
                            </div>
                          );
                        }
                        return null;
                      })();

                  return (
                    <div key={item.id} className="w-full">
                      <MemoizedMessage message={message} isStreaming={isLoading} />
                      {sourcesComponent}
                    </div>
                  );
                }
              });
            })()
          )}
        </ConversationContent>
      </Conversation>

      <div className="p-4 flex-shrink-0">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputBody>
            <PromptInputTextarea placeholder="What would you like to know?" />
            <PromptInputToolbar>
              <div />
              <PromptInputSubmit status={isLoading ? "submitted" : undefined} />
            </PromptInputToolbar>
          </PromptInputBody>
        </PromptInput>
      </div>
    </div>
  );
}
