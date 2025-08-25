import type { HttpClient } from '@angular/common/http'
import { describe, it, expect, vi } from 'vitest'

function of<T>(value: T) {
  return {
    subscribe: (next?: (v: T) => void) => {
      if (typeof next === 'function') next(value)
      return { unsubscribe() {} }
    }
  } as any
}
import { FormService } from '../../frontend/src/app/services/form.service'

class HttpClientStub {
  post<T>(url: string, body: any) {
    return of({} as T)
  }
  get<T>(url: string) {
    return of({} as T)
  }
  delete<T>(url: string) {
    return of({} as T)
  }
  put<T>(url: string, body: any) {
    return of({} as T)
  }
}

describe('FormService', () => {
  let service: FormService

  beforeEach(() => {
    service = new FormService(new HttpClientStub() as unknown as HttpClient)
  })

  it('should call validate endpoint', async () => {
    const file = new Blob(['a']) as any
    const spy = vi.spyOn(HttpClientStub.prototype, 'post')
    service.validateFile(file).subscribe()
    expect(spy).toHaveBeenCalled()
    expect(spy.mock.calls[0][0]).toContain('/api/validate')
  })

  it('should call parse endpoint', async () => {
    const file = new Blob(['a']) as any
    const spy = vi.spyOn(HttpClientStub.prototype, 'post')
    service.parseFile(file).subscribe()
    expect(spy).toHaveBeenCalled()
    expect(spy.mock.calls[0][0]).toContain('/api/forms/parse')
  })

  it('should call getAllForms endpoint', async () => {
    const spy = vi.spyOn(HttpClientStub.prototype, 'get')
    service.getAllForms().subscribe()
    expect(spy).toHaveBeenCalled()
    expect(spy.mock.calls[0][0]).toContain('/api/forms')
  })
})

