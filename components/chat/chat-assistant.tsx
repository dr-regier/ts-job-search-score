"use client";

import React, { useState, useEffect, useRef, memo } from "react";
import { type ToolUIPart } from "ai";
import type { Job } from "@/types/job";
import { useChatContext } from "@/lib/context/ChatContext";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RotateCcw, Briefcase } from "lucide-react";
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
import { JobCarousel } from "@/components/jobs/JobCarousel";
import { Button } from "@/components/ui/button";

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
  // No props needed - all state managed by ChatContext
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

export default function ChatAssistant({}: ChatAssistantProps) {
  // Get all chat state and methods from context
  const {
    discoveryChat,
    matchingChat,
    activeAgent,
    sessionJobs,
    clearSessionJobs,
    removeJobFromSession,
    refreshSavedJobs,
    carouselVisible,
    setCarouselVisible,
    messageOrderRef,
    nextOrderRef,
    handleSendMessage,
    clearChat,
  } = useChatContext();

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
  }, [discoveryChat.messages, matchingChat.messages, messageOrderRef, nextOrderRef]);

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

  // Simplified submit handler - routing logic is in context
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

    // Send message through context - it handles intelligent routing
    handleSendMessage(messageText);
  };

  // Handlers for JobCarousel
  const handleJobSaved = (job: Job) => {
    // Remove job from carousel after saving
    removeJobFromSession(job.id);
    // Refresh saved jobs list
    refreshSavedJobs();
  };

  const handleCarouselComplete = () => {
    // Clear session jobs when carousel is complete
    clearSessionJobs();
    setCarouselVisible(false);
  };

  const handleCarouselClose = () => {
    // Just hide the carousel, don't clear jobs
    setCarouselVisible(false);
  };

  const isLoading = status === "streaming";

  return (
    <div className="flex flex-col lg:flex-row h-full max-h-full overflow-hidden">
      {/* Main chat area - 60% width on desktop */}
      <div className="flex flex-col flex-1 lg:w-[60%] h-full overflow-hidden">
        <Conversation className="flex-1 h-0 overflow-hidden">
          <ConversationContent className="space-y-4">
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="Chat with me to find jobs of interest"
              description="I can search for specific roles or companies, or browse jobs in your area."
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

        <div className="p-4 flex-shrink-0 border-t">
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputBody>
              <PromptInputTextarea placeholder="Tell me what you are looking for..." />
              <PromptInputToolbar>
                <div className="flex items-center gap-2 ml-8">
                  {/* New Chat Button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="text-xs">New Chat</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Clear chat history?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will start a fresh conversation. Your saved jobs and profile
                          data will be preserved. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={clearChat}>
                          Clear Chat
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <PromptInputSubmit status={isLoading ? "submitted" : undefined} />
              </PromptInputToolbar>
            </PromptInputBody>
          </PromptInput>
        </div>
      </div>

      {/* Job Carousel - side panel on desktop, overlay on mobile */}
      {carouselVisible && (
        <>
          {/* Desktop: Side panel (40% width) */}
          <div className="hidden lg:flex lg:w-[40%] border-l bg-background">
            <JobCarousel
              jobs={sessionJobs}
              onJobSaved={handleJobSaved}
              onComplete={handleCarouselComplete}
              onClose={handleCarouselClose}
            />
          </div>

          {/* Mobile: Full screen overlay */}
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50 animate-in fade-in">
            <div className="absolute inset-y-0 right-0 w-full sm:w-96 bg-background shadow-2xl animate-in slide-in-from-right">
              <JobCarousel
                jobs={sessionJobs}
                onJobSaved={handleJobSaved}
                onComplete={handleCarouselComplete}
                onClose={handleCarouselClose}
              />
            </div>
          </div>
        </>
      )}

      {/* Reopen Carousel Button - show when carousel is hidden */}
      {!carouselVisible && (
        <div className="fixed bottom-24 right-6 z-40">
          <Button
            onClick={() => setCarouselVisible(true)}
            size="lg"
            className="shadow-lg bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Briefcase className="w-5 h-5" />
            {sessionJobs.length > 0 ? `View Discovered Jobs (${sessionJobs.length})` : 'Open Job Explorer'}
          </Button>
        </div>
      )}
    </div>
  );
}
