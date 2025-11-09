/**
 * Custom hook for voice recording and transcription
 *
 * Handles browser audio recording using MediaRecorder API
 * and transcribes audio using ElevenLabs Speech-to-Text API.
 */

import { useState, useRef, useCallback } from "react";
import type {
  VoiceRecordingState,
  RecordingStatus,
  BrowserCompatibility,
  TranscriptionResponse,
  TranscriptionError,
} from "@/types/voice";

const MAX_RECORDING_TIME = 10000; // 10 seconds in milliseconds

/**
 * Check if browser supports MediaRecorder API
 */
const checkBrowserCompatibility = (): BrowserCompatibility => {
  if (typeof window === "undefined") {
    return { isSupported: false, message: "Not in browser environment" };
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      isSupported: false,
      message: "Your browser does not support audio recording",
    };
  }

  if (!window.MediaRecorder) {
    return {
      isSupported: false,
      message: "MediaRecorder not supported in this browser",
    };
  }

  return { isSupported: true };
};

export function useVoiceRecording() {
  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    isProcessing: false,
    error: null,
    audioBlob: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Get current recording status for UI
   */
  const getStatus = useCallback((): RecordingStatus => {
    if (state.error) return "error";
    if (state.isProcessing) return "processing";
    if (state.isRecording) return "recording";
    return "idle";
  }, [state.error, state.isProcessing, state.isRecording]);

  /**
   * Start recording audio from microphone
   * @param onRecordingComplete - Callback function called when recording completes with the audio blob
   */
  const startRecording = useCallback(async (onRecordingComplete?: (blob: Blob) => void) => {
    // Check browser compatibility
    const compatibility = checkBrowserCompatibility();
    if (!compatibility.isSupported) {
      setState((prev) => ({ ...prev, error: compatibility.message || "Browser not supported" }));
      return;
    }

    try {
      // Reset state
      setState({
        isRecording: false,
        isProcessing: false,
        error: null,
        audioBlob: null,
      });
      audioChunksRef.current = [];

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;

      // Collect audio chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());

        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        setState((prev) => ({
          ...prev,
          isRecording: false,
          audioBlob,
        }));

        // Clear timeout
        if (recordingTimeoutRef.current) {
          clearTimeout(recordingTimeoutRef.current);
          recordingTimeoutRef.current = null;
        }

        // Call the completion callback with the audio blob
        if (onRecordingComplete) {
          onRecordingComplete(audioBlob);
        }
      };

      // Start recording
      mediaRecorder.start();
      setState((prev) => ({ ...prev, isRecording: true, error: null }));

      // Auto-stop after max recording time
      recordingTimeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }, MAX_RECORDING_TIME);
    } catch (error) {
      console.error("Error starting recording:", error);

      let errorMessage = "Failed to start recording";

      if (error instanceof Error) {
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          errorMessage = "Microphone permission denied. Please allow microphone access.";
        } else if (error.name === "NotFoundError") {
          errorMessage = "No microphone found. Please connect a microphone.";
        }
      }

      setState((prev) => ({
        ...prev,
        isRecording: false,
        error: errorMessage,
      }));
    }
  }, []);

  /**
   * Stop recording audio
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  /**
   * Transcribe recorded audio using ElevenLabs API
   * @param audioBlob - The audio blob to transcribe (required)
   */
  const transcribeAudio = useCallback(
    async (audioBlob: Blob): Promise<string> => {
      if (!audioBlob) {
        throw new Error("No audio to transcribe");
      }

      // Check minimum size (very short recordings)
      if (audioBlob.size < 1000) {
        throw new Error("Recording too short. Please speak for at least 1 second.");
      }

      setState((prev) => ({ ...prev, isProcessing: true, error: null }));

      try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");

        // Call transcription API
        const response = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        const data = (await response.json()) as
          | TranscriptionResponse
          | TranscriptionError;

        if (!response.ok) {
          throw new Error("error" in data ? data.error : "Transcription failed");
        }

        if ("transcript" in data) {
          setState((prev) => ({
            ...prev,
            isProcessing: false,
            error: null,
          }));

          return data.transcript;
        }

        throw new Error("Invalid response format");
      } catch (error) {
        console.error("Transcription error:", error);

        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to transcribe audio";

        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: errorMessage,
        }));

        throw error;
      }
    },
    [] // No dependencies - audioBlob is passed as parameter
  );

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    // Stop recording if active
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    // Clear timeout
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }

    // Reset state
    setState({
      isRecording: false,
      isProcessing: false,
      error: null,
      audioBlob: null,
    });

    audioChunksRef.current = [];
  }, []);

  return {
    // State
    isRecording: state.isRecording,
    isProcessing: state.isProcessing,
    error: state.error,
    audioBlob: state.audioBlob,
    status: getStatus(),

    // Methods
    startRecording,
    stopRecording,
    transcribeAudio,
    clearError,
    reset,

    // Utilities
    isSupported: checkBrowserCompatibility().isSupported,
  };
}
