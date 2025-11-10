/**
 * Voice functionality types for ElevenLabs integration
 */

/**
 * API response from transcription endpoint
 */
export interface TranscriptionResponse {
  transcript: string;
}

/**
 * API error response
 */
export interface TranscriptionError {
  error: string;
  details?: string;
}

/**
 * Voice recording state
 */
export interface VoiceRecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  error: string | null;
  audioBlob: Blob | null;
}

/**
 * Recording status types
 */
export type RecordingStatus = 'idle' | 'recording' | 'processing' | 'error';

/**
 * Browser compatibility status
 */
export interface BrowserCompatibility {
  isSupported: boolean;
  message?: string;
}
