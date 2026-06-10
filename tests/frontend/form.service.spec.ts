import type { HttpClient } from '@angular/common/http'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FormService } from '../../frontend/src/app/services/form.service'

function of<T>(value: T) {
  return {
    pipe: (..._args: any[]) => of(value),
    subscribe: (next?: (v: T) => void) => {
      if (typeof next === 'function') next(value)
      return { unsubscribe() {} }
    }
  } as any
}

class HttpClientStub {
  post<T>(url: string, body: any) { return of({} as T) }
  get<T>(url: string) { return of({} as T) }
  delete<T>(url: string) { return of({} as T) }
  put<T>(url: string, body: any) { return of({} as T) }
}

describe('FormService', () => {
  let service: FormService
  let httpStub: HttpClientStub

  beforeEach(() => {
    httpStub = new HttpClientStub()
    service = new FormService(httpStub as unknown as HttpClient)
  })

  it('should call validate endpoint', () => {
    const file = new Blob(['a']) as any
    const spy = vi.spyOn(httpStub, 'post')
    service.validateFile(file).subscribe()
    expect(spy).toHaveBeenCalled()
    expect(spy.mock.calls[0][0]).toContain('/api/validate')
  })

  it('should call parse endpoint', () => {
    const file = new Blob(['a']) as any
    const spy = vi.spyOn(httpStub, 'post')
    service.parseFile(file).subscribe()
    expect(spy).toHaveBeenCalled()
    expect(spy.mock.calls[0][0]).toContain('/api/forms/parse')
  })

  it('should POST to /api/upload with files field', () => {
    const files = [new Blob(['a']) as any]
    const spy = vi.spyOn(httpStub, 'post')
    service.uploadFiles(files).subscribe()
    expect(spy).toHaveBeenCalled()
    expect(spy.mock.calls[0][0]).toContain('/api/upload')
    const formData: FormData = spy.mock.calls[0][1]
    expect(formData).toBeInstanceOf(FormData)
    // Verify the field name is 'files'
    expect(formData.has('files')).toBe(true)
  })

  it('should DELETE to /api/forms/:id', () => {
    const spy = vi.spyOn(httpStub, 'delete')
    service.deleteForm('abc123').subscribe()
    expect(spy).toHaveBeenCalled()
    expect(spy.mock.calls[0][0]).toContain('/api/forms/abc123')
  })

  it('should DELETE to /api/forms', () => {
    const spy = vi.spyOn(httpStub, 'delete')
    service.deleteAllForms().subscribe()
    expect(spy).toHaveBeenCalled()
    expect(spy.mock.calls[0][0]).toMatch(/\/api\/forms$/)
  })

  it('should PUT to /api/forms/:id/update', () => {
    const file = new Blob(['a']) as any
    const spy = vi.spyOn(httpStub, 'put')
    service.updateForm('xyz789', file).subscribe()
    expect(spy).toHaveBeenCalled()
    expect(spy.mock.calls[0][0]).toContain('/api/forms/xyz789/update')
  })

  it('should GET /api/forms/:id', () => {
    const spy = vi.spyOn(httpStub, 'get')
    service.getFormById('form001').subscribe()
    expect(spy).toHaveBeenCalled()
    expect(spy.mock.calls[0][0]).toContain('/api/forms/form001')
  })

  it('should call getAllForms endpoint', () => {
    const spy = vi.spyOn(httpStub, 'get')
    service.getAllForms().subscribe()
    expect(spy).toHaveBeenCalled()
    expect(spy.mock.calls[0][0]).toContain('/api/forms')
  })
})
