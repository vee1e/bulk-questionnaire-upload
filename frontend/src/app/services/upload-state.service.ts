import { Injectable } from '@angular/core';

const SESSION_KEY = 'uploadState';
const INTERRUPTED_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

@Injectable({ providedIn: 'root' })
export class UploadStateService {
  /**
   * Persist the current upload state to sessionStorage.
   * Only writes when an upload is in-progress or paused.
   */
  saveUploadState(state: {
    isUploading: boolean;
    uploadPaused: boolean;
    uploadStopped: boolean;
    uploadQueue: { name: string; size: number; type: string; lastModified: number }[];
    processedFiles: string[];
    currentUploadIndex: number;
    uploadProgress: { current: number; total: number };
    validationResults: Record<string, any>;
    allValid: boolean;
  }): void {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return;
    }
    if (state.isUploading || state.uploadPaused) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...state, timestamp: Date.now() }));
    }
  }

  /** Remove the upload session key. */
  clearUploadSession(): void {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return;
    }
    sessionStorage.removeItem(SESSION_KEY);
  }

  /**
   * Check whether a recent interrupted upload exists.
   * Always clears the session so the user starts fresh.
   * @returns A user-facing message string if interrupted, or null.
   */
  checkInterruptedUpload(): string | null {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return null;
    }
    const savedState = sessionStorage.getItem(SESSION_KEY);
    if (!savedState) {
      return null;
    }
    // Always clear — File objects cannot survive a page reload.
    this.clearUploadSession();
    try {
      const state = JSON.parse(savedState);
      const timeDiff = Date.now() - state.timestamp;
      if (timeDiff < INTERRUPTED_THRESHOLD_MS && (state.isUploading || state.uploadPaused)) {
        return 'Previous upload was interrupted. Please re-select your files to try again.';
      }
    } catch {
      // ignore malformed session data
    }
    return null;
  }
}
