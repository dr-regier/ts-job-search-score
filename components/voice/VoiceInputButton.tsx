/**
 * Voice Input Button Component
 *
 * Provides microphone button for voice-based search input.
 * Records audio, transcribes it, and passes transcript to parent component.
 */

"use client";

import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { Button } from "@/components/ui/button";
import { Mic, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInputButton({
  onTranscript,
  disabled = false,
}: VoiceInputButtonProps) {
  const {
    isRecording,
    isProcessing,
    error,
    status,
    startRecording,
    stopRecording,
    transcribeAudio,
    clearError,
    isSupported,
  } = useVoiceRecording();

  // Handle recording toggle
  const handleRecordingToggle = async () => {
    if (isRecording) {
      // Just stop recording - the callback will handle transcription
      stopRecording();
    } else {
      // Start recording with completion callback
      await startRecording(async (audioBlob) => {
        try {
          // Transcribe the audio blob
          const transcript = await transcribeAudio(audioBlob);

          if (transcript) {
            onTranscript(transcript);
            toast.success("Voice transcribed successfully");
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to transcribe audio";
          toast.error(errorMessage);
        }
      });
    }
  };

  // Show error toast when error changes
  if (error) {
    toast.error(error);
    clearError();
  }

  // Check browser support
  if (!isSupported) {
    return (
      <Button
        variant="ghost"
        size="icon"
        disabled
        aria-label="Voice input not supported"
        title="Voice input requires a modern browser with microphone support"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </Button>
    );
  }

  // Get button appearance based on status
  const getButtonProps = () => {
    switch (status) {
      case "recording":
        return {
          variant: "destructive" as const,
          ariaLabel: "Stop recording",
          title: "Click to stop recording",
        };
      case "processing":
        return {
          variant: "secondary" as const,
          ariaLabel: "Processing audio",
          title: "Transcribing your voice...",
        };
      case "error":
        return {
          variant: "ghost" as const,
          ariaLabel: "Recording error",
          title: "Error occurred. Click to try again.",
        };
      default:
        return {
          variant: "ghost" as const,
          ariaLabel: "Start voice recording",
          title: "Click to record your voice (max 10 seconds)",
        };
    }
  };

  const buttonProps = getButtonProps();

  return (
    <div className="relative">
      <Button
        variant={buttonProps.variant}
        size="icon"
        onClick={handleRecordingToggle}
        disabled={disabled || isProcessing}
        aria-label={buttonProps.ariaLabel}
        title={buttonProps.title}
        className="relative"
      >
        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <Loader2 className="h-4 w-4 animate-spin" />
            </motion.div>
          ) : isRecording ? (
            <motion.div
              key="recording"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <Mic className="h-4 w-4" />
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <Mic className="h-4 w-4" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulsing animation when recording */}
        {isRecording && (
          <motion.div
            className="absolute inset-0 rounded-md bg-destructive"
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 1.5 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        )}
      </Button>

      {/* Recording indicator text */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-muted-foreground"
          >
            Listening...
          </motion.div>
        )}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-muted-foreground"
          >
            Transcribing...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
