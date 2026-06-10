import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { UploadStateService } from '../../frontend/src/app/services/upload-state.service'

describe('UploadStateService', () => {
  let service: UploadStateService

  beforeEach(() => {
    service = new UploadStateService()
    // Clear any leftover session data
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  it('checkInterruptedUpload returns null when no session data', () => {
    const result = service.checkInterruptedUpload()
    expect(result).toBeNull()
  })

  it('checkInterruptedUpload returns message when recent interrupted upload exists', () => {
    const state = {
      isUploading: true,
      uploadPaused: false,
      uploadStopped: false,
      uploadQueue: [{ name: 'test.xlsx', size: 100, type: 'application/xlsx', lastModified: Date.now() }],
      processedFiles: [],
      currentUploadIndex: 0,
      uploadProgress: { current: 0, total: 1 },
      validationResults: {},
      allValid: true,
      timestamp: Date.now()
    }
    sessionStorage.setItem('uploadState', JSON.stringify(state))
    const result = service.checkInterruptedUpload()
    expect(result).not.toBeNull()
    expect(typeof result).toBe('string')
    expect(result!.length).toBeGreaterThan(0)
  })

  it('checkInterruptedUpload returns null for stale session (older than 30min)', () => {
    const staleTimestamp = Date.now() - 31 * 60 * 1000 // 31 minutes ago
    const state = {
      isUploading: true,
      uploadPaused: false,
      uploadStopped: false,
      uploadQueue: [],
      processedFiles: [],
      currentUploadIndex: 0,
      uploadProgress: { current: 0, total: 1 },
      validationResults: {},
      allValid: true,
      timestamp: staleTimestamp
    }
    sessionStorage.setItem('uploadState', JSON.stringify(state))
    const result = service.checkInterruptedUpload()
    expect(result).toBeNull()
  })

  it('clearUploadSession removes the session key', () => {
    sessionStorage.setItem('uploadState', JSON.stringify({ foo: 'bar' }))
    service.clearUploadSession()
    expect(sessionStorage.getItem('uploadState')).toBeNull()
  })

  it('checkInterruptedUpload clears session after reading', () => {
    const state = {
      isUploading: true,
      uploadPaused: false,
      uploadStopped: false,
      uploadQueue: [],
      processedFiles: [],
      currentUploadIndex: 0,
      uploadProgress: { current: 0, total: 0 },
      validationResults: {},
      allValid: false,
      timestamp: Date.now()
    }
    sessionStorage.setItem('uploadState', JSON.stringify(state))
    service.checkInterruptedUpload()
    // Session must be cleared even if interrupted upload was found
    expect(sessionStorage.getItem('uploadState')).toBeNull()
  })
})
