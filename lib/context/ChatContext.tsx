"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { createClient } from "@/lib/supabase/client";
import type { Job } from "@/types/job";
import type { UserProfile } from "@/types/profile";

interface ChatContextType {
  // Discovery Agent chat instance
  discoveryChat: ReturnType<typeof useChat>;

  // Matching Agent chat instance
  matchingChat: ReturnType<typeof useChat>;

  // Active agent tracking
  activeAgent: 'discovery' | 'matching';
  setActiveAgent: (agent: 'discovery' | 'matching') => void;

  // Jobs and profile state
  savedJobs: Job[];
  userProfile: UserProfile | null;
  refreshSavedJobs: () => void;
  refreshUserProfile: () => void;
  stopCurrentRun: () => void;

  // Refs for message ordering and tool processing
  messageOrderRef: React.MutableRefObject<Map<string, number>>;
  nextOrderRef: React.MutableRefObject<number>;
  processedToolCallsRef: React.MutableRefObject<Set<string>>;

  // Helper method for sending messages with intelligent routing
  handleSendMessage: (messageText: string) => void;

  // Clear chat history and reset to fresh state
  clearChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({
  children,
  api = '/api/chat'
}: {
  children: React.ReactNode;
  api?: string;
}) {
  // State for saved jobs and user profile (from Supabase)
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeAgent, setActiveAgent] = useState<'discovery' | 'matching'>('discovery');
  const [userId, setUserId] = useState<string | null>(null);

  // Refs for tracking message order and processed tool calls
  const messageOrderRef = useRef<Map<string, number>>(new Map());
  const nextOrderRef = useRef(0);
  const processedToolCallsRef = useRef<Set<string>>(new Set());

  const supabase = createClient();

  // Load user session and data from Supabase on mount
  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);

        // Load jobs and profile from Supabase via API
        const jobsResponse = await fetch('/api/jobs', {
          credentials: 'include',
        });
        if (jobsResponse.ok) {
          const jobsData = await jobsResponse.json();
          setSavedJobs(jobsData.jobs || []);
        }

        const profileResponse = await fetch('/api/profile', {
          credentials: 'include',
        });
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setUserProfile(profileData.profile);
        }
      }
    };

    loadUserData();
  }, [supabase.auth]);

  // Helper to refresh jobs from Supabase
  const refreshSavedJobs = async () => {
    if (!userId) return;

    const response = await fetch('/api/jobs', {
      credentials: 'include',
    });
    if (response.ok) {
      const data = await response.json();
      setSavedJobs(data.jobs || []);
    }
  };

  // Helper to refresh profile from Supabase
  const refreshUserProfile = async () => {
    if (!userId) return;

    const response = await fetch('/api/profile', {
      credentials: 'include',
    });
    if (response.ok) {
      const data = await response.json();
      setUserProfile(data.profile);
    }
  };

  // Discovery Agent (Job Discovery) - default chat
  const discoveryChat = useChat({
    transport: api ? new DefaultChatTransport({ api }) : undefined,
    onFinish: () => {
      // Reload saved jobs after discovery agent finishes (in case jobs were saved)
      refreshSavedJobs();
    },
  });

  // Matching Agent (Job Matching/Scoring)
  // Matching agent fetches jobs and profile from Supabase server-side
  const matchingChat = useChat({
    transport: new DefaultChatTransport({
      api: '/api/match',
    }),
    onFinish: () => {
      // Reload saved jobs after matching agent finishes (scores may have been added)
      refreshSavedJobs();
    },
  });

  // Handle tool results from both agents (save jobs, score jobs)
  useEffect(() => {
    // Process tool results from both agents
    const allMessages = [...discoveryChat.messages, ...matchingChat.messages];

    allMessages.forEach((message) => {
      if (message.role !== 'assistant') return;

      const parts = (message as any).parts || [];

      parts.forEach((part: any) => {
        // Check both part.result and part.output (AI SDK uses different fields)
        const toolOutput = part.result || part.output;

        // Check if this is a tool result we haven't processed yet
        if (part.type?.startsWith('tool-') && toolOutput) {
          // Create unique ID for this tool call
          const toolCallId = part.toolCallId || part.id || `${message.id}-${part.type}`;

          // Skip if already processed
          if (processedToolCallsRef.current.has(toolCallId)) {
            return;
          }

          // Mark as processed
          processedToolCallsRef.current.add(toolCallId);

          // Handle saveJobsToProfile tool result
          if (toolOutput.action === 'saved' && toolOutput.savedJobs) {
            console.log('💾 Processing save tool result:', toolOutput.count, 'jobs');
            console.log('✅ Jobs saved to Supabase via agent tool');
            // Reload saved jobs state from Supabase
            refreshSavedJobs();
          }

          // Handle scoreJobsTool result
          if (toolOutput.action === 'scored' && toolOutput.scoredJobs) {
            console.log('📊 Processing score tool result:', toolOutput.scoredJobs.length, 'jobs');
            console.log('✅ Scores saved to Supabase via agent tool');
            // Reload saved jobs state from Supabase
            refreshSavedJobs();
          }
        }
      });
    });
  }, [discoveryChat.messages, matchingChat.messages]);

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

  const stopCurrentRun = useCallback(() => {
    let stopped = false;

    try {
      if (discoveryChat.status === "streaming") {
        discoveryChat.stop();
        stopped = true;
      }
    } catch (error) {
      console.error("Failed to stop discovery chat stream:", error);
    }

    try {
      if (matchingChat.status === "streaming") {
        matchingChat.stop();
        stopped = true;
      }
    } catch (error) {
      console.error("Failed to stop matching chat stream:", error);
    }

    if (stopped) {
      console.log("⛔️ Stopped active agent response");
    }
  }, [discoveryChat, matchingChat]);

  /**
   * Clear all chat history and reset to fresh state
   * Preserves saved jobs and profile data
   */
  const clearChat = () => {
    stopCurrentRun();

    // Clear both agent message histories
    discoveryChat.setMessages([]);
    matchingChat.setMessages([]);

    // Reset message ordering
    messageOrderRef.current.clear();
    nextOrderRef.current = 0;

    // Clear processed tool calls tracking
    processedToolCallsRef.current.clear();

    // Reset to discovery agent
    setActiveAgent('discovery');

    console.log('🔄 Chat cleared - starting fresh conversation');
  };

  /**
   * Handle sending a message with intelligent routing between agents
   */
  const handleSendMessage = (messageText: string) => {
    // Determine which agent to use based on intent
    const wantsScoring = detectScoringIntent(messageText);

    console.log('\n🎯 === ROUTING DECISION ===');
    console.log('Message:', messageText);
    console.log('Scoring intent detected:', wantsScoring);
    console.log('Saved jobs count:', savedJobs.length);
    console.log('Has profile:', !!userProfile);
    console.log('Profile name:', userProfile?.name || 'N/A');

    if (wantsScoring && savedJobs.length > 0) {
      // User wants scoring and has saved jobs -> use Matching Agent
      if (!userProfile) {
        // No profile - send to discovery agent with original message
        console.log('❌ Routing to DISCOVERY: Scoring intent but NO PROFILE');
        console.log('Endpoint: POST /api/chat\n');
        setActiveAgent('discovery');
        discoveryChat.sendMessage({ text: messageText });
      } else {
        // Has profile and saved jobs - use matching agent
        console.log('✅ Routing to MATCHING: Scoring intent + saved jobs + profile');
        console.log('Endpoint: POST /api/match\n');
        setActiveAgent('matching');
        // Clear matching chat history before sending new message
        // (Prevents reasoning tokens from previous responses being sent back)
        matchingChat.setMessages([]);
        matchingChat.sendMessage({ text: messageText });
      }
    } else if (wantsScoring && savedJobs.length === 0) {
      // User wants scoring but has no saved jobs - send original message to discovery agent
      console.log('❌ Routing to DISCOVERY: Scoring intent but NO SAVED JOBS');
      console.log('Endpoint: POST /api/chat\n');
      setActiveAgent('discovery');
      discoveryChat.sendMessage({ text: messageText });
    } else {
      // Default to Discovery Agent for job search and other queries
      console.log('❌ Routing to DISCOVERY: Default (no scoring intent)');
      console.log('Endpoint: POST /api/chat\n');
      setActiveAgent('discovery');
      discoveryChat.sendMessage({ text: messageText });
    }
  };

  const contextValue: ChatContextType = {
    discoveryChat,
    matchingChat,
    activeAgent,
    setActiveAgent,
    savedJobs,
    userProfile,
    refreshSavedJobs,
    refreshUserProfile,
    stopCurrentRun,
    messageOrderRef,
    nextOrderRef,
    processedToolCallsRef,
    handleSendMessage,
    clearChat,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
}

/**
 * Custom hook to access chat context
 * Throws error if used outside ChatProvider
 */
export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}
