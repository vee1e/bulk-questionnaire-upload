import '@angular/compiler'
import { describe, it, expect } from 'vitest'
import { EventEmitter } from '@angular/core'
import { FormListComponent } from '../../frontend/src/app/components/form-list/form-list.component'
import { FormData } from '../../frontend/src/app/services/form.service'

describe('FormListComponent', () => {
  it('should initialize with default inputs', () => {
    const component = new FormListComponent()
    expect(component.forms).toEqual([])
    expect(component.loadingFormId).toBeNull()
    expect(component.isDeletingAll).toBe(false)
    expect(component.currentPreviewedFormId).toBeNull()
    expect(component.formClicked).toBeInstanceOf(EventEmitter)
    expect(component.deleteForm).toBeInstanceOf(EventEmitter)
    expect(component.exportForm).toBeInstanceOf(EventEmitter)
    expect(component.updateForm).toBeInstanceOf(EventEmitter)
    expect(component.deleteAllForms).toBeInstanceOf(EventEmitter)
  })

  it('should emit formClicked when clicked', () => {
    const component = new FormListComponent()
    const mockForm: FormData = {
      id: 'form-123',
      title: 'Mock Title',
      language: 'en',
      version: '1.0.0',
      created_at: new Date().toISOString()
    }
    let emitted: FormData | null = null
    component.formClicked.subscribe((f) => (emitted = f))
    component.formClicked.emit(mockForm)
    expect(emitted).toBe(mockForm)
  })

  it('should emit deleteForm event', () => {
    const component = new FormListComponent()
    const mockForm: FormData = { id: 'form-123', title: 'Mock Title' } as any
    let emitted: FormData | null = null
    component.deleteForm.subscribe((f) => (emitted = f))
    component.deleteForm.emit(mockForm)
    expect(emitted).toBe(mockForm)
  })

  it('should emit exportForm event', () => {
    const component = new FormListComponent()
    const mockForm: FormData = { id: 'form-123', title: 'Mock Title' } as any
    let emitted: FormData | null = null
    component.exportForm.subscribe((f) => (emitted = f))
    component.exportForm.emit(mockForm)
    expect(emitted).toBe(mockForm)
  })

  it('should emit updateForm event', () => {
    const component = new FormListComponent()
    const mockForm: FormData = { id: 'form-123', title: 'Mock Title' } as any
    let emitted: FormData | null = null
    component.updateForm.subscribe((f) => (emitted = f))
    component.updateForm.emit(mockForm)
    expect(emitted).toBe(mockForm)
  })

  it('should emit deleteAllForms event', () => {
    const component = new FormListComponent()
    let called = false
    component.deleteAllForms.subscribe(() => (called = true))
    component.deleteAllForms.emit()
    expect(called).toBe(true)
  })
})
