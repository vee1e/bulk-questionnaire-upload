import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormPreviewService } from '../../services/form-preview.service';
import { FormDetails, OptionData } from '../../services/form.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <mat-toolbar class="navbar">
      <div class="navbar-brand">
        <mat-icon class="brand-icon">description</mat-icon>
        <span>mForm Bulk Upload</span>
      </div>

      <div class="navbar-actions" *ngIf="selectedFormDetails">
        <div class="keyboard-shortcuts">
          <span class="shortcut-hint">Ctrl+J/K to navigate</span>
        </div>
        <button mat-icon-button (click)="closePreview()" class="close-preview-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </mat-toolbar>

    <!-- Form Preview Panel -->
    <div class="form-preview-panel"
         [class.open]="selectedFormDetails"
         *ngIf="selectedFormDetails">

      <!-- Form Details -->
      <div class="preview-content">
        <div class="preview-header">
          <h2>{{selectedFormDetails.form.title}}</h2>
          <div class="form-meta">
            <span>{{selectedFormDetails.form.language}} • {{selectedFormDetails.form.version}} • {{selectedFormDetails.form.created_at | date:'short'}}</span>
          </div>
        </div>

        <div class="preview-body">
          <div class="form-info-section">
            <h3>Form Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <strong>Language:</strong> {{selectedFormDetails.form.language}}
              </div>
              <div class="info-item">
                <strong>Version:</strong> {{selectedFormDetails.form.version}}
              </div>
              <div class="info-item">
                <strong>Created:</strong> {{selectedFormDetails.form.created_at | date:'medium'}}
              </div>
              <div class="info-item">
                <strong>Questions:</strong> {{selectedFormDetails.questions_count}}
              </div>
              <div class="info-item">
                <strong>Options:</strong> {{selectedFormDetails.options_count}}
              </div>
            </div>
          </div>

          <div class="questions-section">
            <h3>Questions ({{selectedFormDetails.questions.length}})</h3>
            <div class="questions-list">
              <div *ngFor="let question of selectedFormDetails.questions; let i = index" class="question-item">
                <div class="question-header">
                  <span class="question-number">{{i + 1}}</span>
                  <h4>{{question.title}}</h4>
                  <span class="question-type">{{question.input_type}}</span>
                </div>
                <div class="question-details">
                  <p><strong>Order:</strong> {{question.order}}</p>
                  <p><strong>View Sequence:</strong> {{question.view_sequence}}</p>
                </div>

                <div *ngIf="getQuestionOptions(question.id).length > 0" class="question-options">
                  <h5>Options ({{getQuestionOptions(question.id).length}})</h5>
                  <div class="options-list">
                    <div *ngFor="let option of getQuestionOptions(question.id)" class="option-item">
                      <span class="option-id">{{option.option_id}}</span>
                      <span class="option-label">{{option.label}}</span>
                      <span class="option-order">Order: {{option.order}}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .navbar {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      color: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      z-index: 1000;
      position: relative;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.2rem;
      font-weight: 500;
    }

    .brand-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .navbar-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .keyboard-shortcuts {
      .shortcut-hint {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.6);
        background: rgba(255, 255, 255, 0.1);
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-family: monospace;
      }
    }

    .close-preview-btn {
      background: rgba(255, 255, 255, 0.1);
      color: white;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
      }
    }

    .form-preview-panel {
      position: fixed;
      top: 80px;
      left: 2rem;
      right: 2rem;
      height: 60vh;
      background: #23234a;
      color: white;
      border: 5px solid #3f51b5;
      border-radius: 16px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.7), 0 4px 16px rgba(63, 81, 181, 0.3);
      margin: 22px;
      z-index: 999;
      transform: translateY(-120%);
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      backdrop-filter: blur(20px);

      &.open {
        transform: translateY(0);
      }

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 0px;
        background: linear-gradient(90deg, #3f51b5, #5c6bc0, #3f51b5);
        z-index: 1;
        border-radius: 16px 16px 0 0;
      }
    }

    .preview-content {
      padding: 2rem;
      height: 100%;
      overflow-y: auto;
      position: relative;
      z-index: 2;
    }

    .preview-header {
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);

      h2 {
        margin: 0 0 0.5rem 0;
        color: white;
        font-size: 1.5rem;
        font-weight: 500;
      }

      .form-meta {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.9rem;
      }
    }

    .preview-body {
      .form-info-section {
        margin-bottom: 2rem;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;

        h3 {
          margin: 0 0 1rem;
          color: white;
          font-size: 1.2rem;
          font-weight: 500;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;

          .info-item {
            padding: 0.5rem;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;

            strong {
              display: block;
              margin-bottom: 0.25rem;
              color: rgba(255, 255, 255, 0.8);
              font-size: 0.875rem;
            }
          }
        }
      }

      .questions-section {
        h3 {
          margin: 0 0 1rem;
          color: white;
          font-size: 1.2rem;
          font-weight: 500;
        }

        .questions-list {
          .question-item {
            margin-bottom: 1rem;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            border-left: 3px solid #3f51b5;

            .question-header {
              display: flex;
              align-items: center;
              gap: 1rem;
              margin-bottom: 0.5rem;

              .question-number {
                background: #3f51b5;
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.75rem;
                font-weight: bold;
              }

              h4 {
                margin: 0;
                color: white;
                font-size: 1rem;
                font-weight: 500;
                flex: 1;
              }

              .question-type {
                padding: 0.25rem 0.5rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                font-size: 0.75rem;
                font-weight: 500;
                color: rgba(255, 255, 255, 0.8);
              }
            }

            .question-details {
              margin-bottom: 0.5rem;

              p {
                margin: 0.25rem 0;
                color: rgba(255, 255, 255, 0.7);
                font-size: 0.875rem;

                strong {
                  color: rgba(255, 255, 255, 0.9);
                }
              }
            }

            .question-options {
              margin-top: 0.5rem;

              h5 {
                margin: 0 0 0.5rem;
                color: rgba(255, 255, 255, 0.8);
                font-size: 0.875rem;
              }

              .options-list {
                .option-item {
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                  margin-bottom: 0.25rem;
                  padding: 0.25rem 0.5rem;
                  background: rgba(255, 255, 255, 0.03);
                  border-radius: 4px;

                  .option-id {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    padding: 0.125rem 0.375rem;
                    border-radius: 3px;
                    font-size: 0.75rem;
                    font-weight: bold;
                    min-width: 20px;
                    text-align: center;
                  }

                  .option-label {
                    flex: 1;
                    color: white;
                    font-size: 0.875rem;
                  }

                  .option-order {
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.5);
                  }
                }
              }
            }
          }
        }
      }
    }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  selectedFormDetails: FormDetails | null = null;
  loadingFormId: string | null = null;
  private subscriptions: Subscription[] = [];

  constructor(private formPreviewService: FormPreviewService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.formPreviewService.selectedFormDetails$.subscribe(details => {
        this.selectedFormDetails = details;
      })
    );

    this.subscriptions.push(
      this.formPreviewService.loadingFormId$.subscribe(id => {
        this.loadingFormId = id;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closePreview();
  }

  closePreview(): void {
    this.formPreviewService.closePreview();
  }

  getQuestionOptions(questionId: string): OptionData[] {
    if (!this.selectedFormDetails) return [];

    const question = this.selectedFormDetails.questions.find(q => q.id === questionId);
    if (!question) return [];

    return this.selectedFormDetails.options.filter(option =>
      option.order === question.order
    );
  }
}
