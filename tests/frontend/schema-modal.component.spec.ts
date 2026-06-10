import '@angular/compiler'
import { describe, it, expect } from 'vitest'
import { EventEmitter } from '@angular/core'
import { SchemaModalComponent } from '../../frontend/src/app/components/schema-modal/schema-modal.component'

describe('SchemaModalComponent', () => {
  it('should initialize with default values', () => {
    const component = new SchemaModalComponent()
    expect(component.schema).toBeNull()
    expect(component.fileName).toBe('')
    expect(component.visible).toBe(false)
    expect(component.closed).toBeInstanceOf(EventEmitter)
    expect(component.copied).toBeInstanceOf(EventEmitter)
    expect(component.downloaded).toBeInstanceOf(EventEmitter)
  })

  it('should return form title from tempData.json format', () => {
    const component = new SchemaModalComponent()
    component.schema = [
      {
        language: [
          {
            title: 'My Form Title',
            lng: 'en'
          }
        ]
      }
    ]
    expect(component.getFormTitle()).toBe('My Form Title')
  })

  it('should fallback to old schema title if default exists', () => {
    const component = new SchemaModalComponent()
    component.schema = {
      title: {
        default: 'Old Title'
      }
    }
    expect(component.getFormTitle()).toBe('Old Title')
  })

  it('should return language', () => {
    const component = new SchemaModalComponent()
    component.schema = [
      {
        language: [
          {
            lng: 'fr'
          }
        ]
      }
    ]
    expect(component.getFormLanguage()).toBe('fr')
  })

  it('should return version', () => {
    const component = new SchemaModalComponent()
    component.schema = [
      {
        version: '1.2.3'
      }
    ]
    expect(component.getFormVersion()).toBe('1.2.3')
  })

  it('should count questions', () => {
    const component = new SchemaModalComponent()
    component.schema = [
      {
        question: [
          { order: 1, title: 'Q1' },
          { order: 2, title: 'Q2' }
        ]
      }
    ]
    expect(component.getFormQuestionsCount()).toBe(2)
  })

  it('should format JSON schema', () => {
    const component = new SchemaModalComponent()
    component.schema = { foo: 'bar' }
    const formatted = component.formatJsonSchema()
    expect(formatted).toContain('"foo": "bar"')
  })

  it('should emit closed onEscapeKey if visible', () => {
    const component = new SchemaModalComponent()
    component.visible = true
    let closedEmitted = false
    component.closed.subscribe(() => {
      closedEmitted = true
    })
    component.onEscapeKey()
    expect(closedEmitted).toBe(true)
  })

  it('should not emit closed onEscapeKey if not visible', () => {
    const component = new SchemaModalComponent()
    component.visible = false
    let closedEmitted = false
    component.closed.subscribe(() => {
      closedEmitted = true
    })
    component.onEscapeKey()
    expect(closedEmitted).toBe(false)
  })
})
