import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-schema-modal',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div *ngIf="visible" class="schema-modal-overlay" (click)="closed.emit()">
      <div class="schema-modal-content" (click)="$event.stopPropagation()">
        <div class="schema-modal-header">
          <h3>
            <mat-icon class="schema-modal-icon">description</mat-icon>
            Parsed Schema: {{fileName}}
          </h3>
          <button mat-icon-button (click)="closed.emit()" class="close-modal-btn">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div class="schema-modal-body">
          <div class="schema-section">
            <h4>
              <mat-icon class="section-icon">info</mat-icon>
              Form Information
            </h4>
            <div class="schema-info-grid">
              <div class="info-item">
                <strong>Title:</strong>
                <span>{{getFormTitle()}}</span>
              </div>
              <div class="info-item">
                <strong>Language:</strong>
                <span>{{getFormLanguage()}}</span>
              </div>
              <div class="info-item">
                <strong>Version:</strong>
                <span>{{getFormVersion()}}</span>
              </div>
              <div class="info-item">
                <strong>Questions:</strong>
                <span>{{getFormQuestionsCount()}}</span>
              </div>
              <div class="info-item">
                <strong>Options:</strong>
                <span>{{getFormOptionsCount()}}</span>
              </div>
            </div>
          </div>

          <div class="schema-section" *ngIf="getFormQuestions().length > 0">
            <h4>
              <mat-icon class="section-icon">quiz</mat-icon>
              Questions Structure
            </h4>
            <div class="questions-container">
              <div class="question-group">
                <h5 class="group-title">Form Questions</h5>
                <div *ngFor="let question of getFormQuestions()" class="question-item">
                  <div class="question-header">
                    <span class="question-name">#{{question.order}}</span>
                    <span class="question-type">Type {{question.input_type}}</span>
                  </div>
                  <div class="question-label">{{question.title}}</div>
                  <div *ngIf="question.answer_option && question.answer_option.length > 0" class="question-choices">
                    <div class="choice-header">Options:</div>
                    <div *ngFor="let option of question.answer_option" class="choice-item">
                      <span class="choice-name">{{option._id}}</span>
                      <span class="choice-label">{{option.name}}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="schema-section">
            <h4>
              <mat-icon class="section-icon">code</mat-icon>
              Raw JSON Schema
            </h4>
            <div class="json-container">
              <pre class="json-content">{{formatJsonSchema()}}</pre>
            </div>
          </div>
        </div>

        <div class="schema-modal-actions">
          <button mat-raised-button color="accent" (click)="copied.emit()">
            <mat-icon>content_copy</mat-icon>
            Copy JSON
          </button>
          <button mat-raised-button color="primary" (click)="downloaded.emit()">
            <mat-icon>download</mat-icon>
            Download JSON
          </button>
          <button mat-raised-button (click)="closed.emit()">
            <mat-icon>close</mat-icon>
            Close
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .schema-modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }

    .schema-modal-content {
      background: rgba(20, 20, 35, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      width: 80vw;
      max-width: 900px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }

    .schema-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.03);

      h3 {
        margin: 0;
        color: #ffffff;
        font-size: 1.1rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .schema-modal-icon {
        color: #ffffff;
      }

      .close-modal-btn {
        color: rgba(255, 255, 255, 0.7);
      }
    }

    .schema-modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .schema-section {
      h4 {
        margin: 0 0 1rem 0;
        color: #ffffff;
        font-size: 1rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .section-icon {
        color: #ffffff !important;
        font-size: 18px;
      }
    }

    .schema-info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .info-item {
      display: flex;
      gap: 0.5rem;
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9rem;

      strong {
        color: #ffffff;
        min-width: 80px;
      }
    }

    .questions-container {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.02);
    }

    .question-group {
      margin-bottom: 1.5rem;

      .group-title {
        margin: 0 0 0.75rem 0;
        color: #ffffff;
        font-size: 0.9rem;
        font-weight: 600;
      }
    }

    .question-item {
      margin-bottom: 1rem;
      padding: 0.75rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.03);

      .question-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;

        .question-name {
          color: #ffffff;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .question-type {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        }
      }

      .question-label {
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.9rem;
        margin-bottom: 0.5rem;
      }

      .question-choices {
        margin-top: 0.5rem;

        .choice-header {
          color: #ffffff;
          font-size: 0.8rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .choice-item {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
          font-size: 0.8rem;

          .choice-name {
            color: #ffffff;
            font-weight: 500;
            min-width: 30px;
          }

          .choice-label {
            color: rgba(255, 255, 255, 0.7);
          }
        }
      }
    }

    .json-container {
      max-height: 300px;
      overflow: auto;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      background: #0d1117;
    }

    .json-content {
      margin: 0;
      padding: 1rem;
      color: #ffffff;
      font-family: 'Inter', sans-serif;
      font-size: 0.8rem;
      line-height: 1.4;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .schema-modal-actions {
      display: flex;
      gap: 0.75rem;
      padding: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.02);
      justify-content: flex-end;
    }

    @media (max-width: 768px) {
      .schema-modal-content {
        width: 95vw;
        max-height: 95vh;
      }

      .schema-info-grid {
        grid-template-columns: 1fr;
      }

      .schema-modal-actions {
        flex-direction: column;
      }
    }
  `]
})
export class SchemaModalComponent {
  @Input() schema: any = null;
  @Input() fileName = '';
  @Input() visible = false;
  @Output() closed = new EventEmitter<void>();
  @Output() copied = new EventEmitter<void>();
  @Output() downloaded = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.visible) {
      this.closed.emit();
    }
  }

  getFormTitle(): string {
    if (!this.schema) return 'N/A';
    if (Array.isArray(this.schema) && this.schema.length > 0) {
      const formDef = this.schema[0];
      if (formDef.language && Array.isArray(formDef.language) && formDef.language.length > 0) {
        return formDef.language[0].title || 'N/A';
      }
    }
    if (this.schema.title?.default) return this.schema.title.default;
    return 'N/A';
  }

  getFormLanguage(): string {
    if (!this.schema) return 'N/A';
    if (Array.isArray(this.schema) && this.schema.length > 0) {
      const formDef = this.schema[0];
      if (typeof formDef.language === 'string') return formDef.language;
      if (Array.isArray(formDef.language) && formDef.language.length > 0) {
        return formDef.language[0].lng || 'N/A';
      }
    }
    return this.schema.language || 'N/A';
  }

  getFormVersion(): string {
    if (!this.schema) return 'N/A';
    if (Array.isArray(this.schema) && this.schema.length > 0) {
      return this.schema[0].version || 'N/A';
    }
    return this.schema.version || 'N/A';
  }

  getFormOptionsCount(): number {
    if (!this.schema) return 0;
    if (Array.isArray(this.schema) && this.schema.length > 0) {
      const formDef = this.schema[0];
      if (formDef.language && Array.isArray(formDef.language) && formDef.language.length > 0) {
        const langConfig = formDef.language[0];
        if (langConfig.question && Array.isArray(langConfig.question)) {
          return langConfig.question.reduce((acc: number, q: any) => acc + (q.answer_option?.length ?? 0), 0);
        }
      }
    }
    return this.schema.metadata?.options_count ?? 0;
  }

  getFormQuestionsCount(): number {
    if (!this.schema) return 0;
    if (Array.isArray(this.schema) && this.schema.length > 0) {
      const formDef = this.schema[0];
      if (formDef.question && Array.isArray(formDef.question)) {
        return formDef.question.length;
      }
    }
    return this.schema.metadata?.questions_count ?? 0;
  }

  getFormQuestions(): any[] {
    if (!this.schema) return [];
    if (Array.isArray(this.schema) && this.schema.length > 0) {
      const formDef = this.schema[0];
      if (formDef.language && Array.isArray(formDef.language) && formDef.language.length > 0) {
        return formDef.language[0].question ?? [];
      }
    }
    return [];
  }

  formatJsonSchema(): string {
    if (!this.schema) return '';
    return JSON.stringify(this.schema, null, 2);
  }
}
