import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormService, FormData, FormDetails, OptionData } from '../../services/form.service';
import { FormValidation } from '../../models/form.model';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule
  ],
  template: `
    <mat-card class="upload-card"
              [class.dragover]="isDragOver"
              (dragover)="onDragOver($event)"
              (dragleave)="onDragLeave($event)"
              (drop)="onDrop($event)">
      <mat-card-header>
        <mat-icon mat-card-avatar>cloud_upload</mat-icon>
        <mat-card-title>Upload & Manage Forms</mat-card-title>
        <mat-card-subtitle>Drag & drop Excel files or browse to upload</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <!-- Upload Area -->
        <div class="upload-area">
          <mat-icon class="upload-icon">cloud_upload</mat-icon>
          <h2>Drag & Drop Excel Files</h2>
          <p>or</p>
          <button mat-raised-button color="primary" (click)="fileInput.click()">
            Browse Files
          </button>
          <input #fileInput type="file"
                 accept=".xls,.xlsx"
                 style="display: none"
                 (change)="onFileSelected($event)">
        </div>

        <!-- File Selection and Actions -->
        <div *ngIf="selectedFile" class="file-actions">
          <div class="selected-file">
            <mat-icon>description</mat-icon>
            <span>{{selectedFile.name}}</span>
          </div>
          <div class="button-group">
            <button mat-raised-button color="accent" (click)="validateFile()" [disabled]="isValidating">
              <mat-icon>check_circle</mat-icon>
              {{isValidating ? 'Validating...' : 'Validate'}}
            </button>
            <button mat-raised-button color="primary" (click)="uploadFile()" [disabled]="isUploading || !validationResult?.valid">
              <mat-icon>upload</mat-icon>
              {{isUploading ? 'Uploading...' : 'Upload'}}
            </button>
          </div>
        </div>

        <!-- Upload Progress -->
        <div *ngIf="isUploading" class="upload-progress">
          <mat-progress-bar mode="determinate" [value]="uploadProgress">
          </mat-progress-bar>
          <span>{{uploadProgress}}%</span>
        </div>

        <!-- Validation Result -->
        <div *ngIf="validationResult" class="validation-result" [class.valid]="validationResult.valid" [class.invalid]="!validationResult.valid">
          <h3>Validation Result</h3>
          <p class="status">Status: {{ validationResult.valid ? 'Valid' : 'Invalid' }}</p>
          <p class="message">{{ validationResult.message }}</p>

          <div *ngIf="validationResult.form_metadata" class="metadata-section">
            <h4>Form Metadata</h4>
            <div class="metadata-grid">
              <div class="metadata-item">
                <strong>Language:</strong> {{ validationResult.form_metadata['language'] }}
              </div>
              <div class="metadata-item">
                <strong>Title:</strong> {{ validationResult.form_metadata['title'] }}
              </div>
            </div>
          </div>

          <div class="stats-section">
            <h4>File Statistics</h4>
            <div class="stats-grid">
              <div class="stat-item">
                <strong>Questions:</strong> {{ validationResult.questions_count || 0 }}
              </div>
              <div class="stat-item">
                <strong>Answer Options:</strong> {{ validationResult.options_count || 0 }}
              </div>
            </div>
          </div>

          <div *ngIf="validationResult.sheets && validationResult.sheets.length > 0" class="sheets-section">
            <h4>Sheet Details</h4>
            <div class="sheets-grid">
              <div *ngFor="let sheet of validationResult.sheets" class="sheet-item" [class.valid]="sheet.exists && sheet.missing_columns.length === 0" [class.invalid]="!sheet.exists || sheet.missing_columns.length > 0">
                <div class="sheet-header">
                  <h5>{{ sheet.name }}</h5>
                  <span class="sheet-status">{{ sheet.exists && sheet.missing_columns.length === 0 ? '✓' : '✗' }}</span>
                </div>
                <div class="sheet-details">
                  <p><strong>Exists:</strong> {{ sheet.exists ? 'Yes' : 'No' }}</p>
                  <p><strong>Rows:</strong> {{ sheet.row_count }}</p>
                  <p><strong>Columns:</strong> {{ sheet.columns.join(', ') }}</p>
                  <div *ngIf="sheet.missing_columns.length > 0" class="missing-columns">
                    <strong>Missing Columns:</strong>
                    <ul>
                      <li *ngFor="let col of sheet.missing_columns">{{ col }}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Form List -->
        <div *ngIf="filteredForms.length > 0" class="form-list">
          <div class="form-list-header center-header">
            <h3>Parsed Forms</h3>
          </div>
          <div class="delete-all-wrapper">
            <button mat-raised-button color="warn" (click)="confirmDeleteAllForms()" [disabled]="isDeletingAll || filteredForms.length === 0">
              <mat-icon>delete_sweep</mat-icon>
              {{isDeletingAll ? 'Deleting...' : 'Delete All Forms'}}
            </button>
          </div>
          <div *ngFor="let form of filteredForms" class="form-item" (click)="showFormDetails(form)">
            <div class="form-info">
              <mat-icon>description</mat-icon>
              <div class="form-details">
                <h4>{{form.title}}</h4>
                <p>{{form.language}} • {{form.version}} • {{form.created_at | date:'short'}}</p>
              </div>
            </div>

            <div class="form-actions">
              <button mat-icon-button color="warn" (click)="deleteForm(form, $event)">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>
        </div>

        <!-- Form Details Modal -->
        <div *ngIf="selectedFormDetails" class="form-details-modal">
          <div class="modal-overlay" (click)="closeFormDetails()"></div>
          <div class="modal-content">
            <div class="modal-header">
              <h2>{{selectedFormDetails.form.title}}</h2>
              <button mat-icon-button (click)="closeFormDetails()">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="modal-body">
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

              <div *ngIf="selectedFormDetails.options.length > 0" class="all-options-section">
                <h3>All Options ({{selectedFormDetails.options.length}})</h3>
                <div class="options-list">
                  <div *ngFor="let option of selectedFormDetails.options" class="option-item">
                    <span class="option-id">{{option.option_id}}</span>
                    <span class="option-label">{{option.label}}</span>
                    <span class="option-order">Order: {{option.order}}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .upload-card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border: 2px dashed rgba(255, 255, 255, 0.2);
      transition: all 0.3s ease;
      height: 100%;
      min-height: 400px;
      color: white;

      &.dragover {
        border-color: #4CAF50;
        background: rgba(76, 175, 80, 0.1);
      }

      ::ng-deep {
        .mat-mdc-card-header {
          padding: 1rem;
        }

        .mat-mdc-card-content {
          display: block;
          padding: 0;
        }

        .mat-mdc-card-avatar {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;

          mat-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
          }
        }

        .mat-mdc-card-title {
          color: white;
        }

        .mat-mdc-card-subtitle {
          color: rgba(255, 255, 255, 0.7);
        }
      }
    }

    .upload-area {
      margin-top: 32px;
      margin-bottom: 80px;
      display: flex;
      flex-direction: column;
      align-items: center;
      color: white;
      text-align: center;

      .upload-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        margin-bottom: 1rem;
        color: rgba(255, 255, 255, 0.8);
      }

      h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 500;
      }

      p {
        margin: 1rem 0;
        color: rgba(255, 255, 255, 0.6);
      }
    }

    .file-actions {
      padding: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);

      .selected-file {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
        padding: 0.5rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;

        mat-icon {
          color: rgba(255, 255, 255, 0.7);
        }
      }

      .button-group {
        display: flex;
        gap: 1rem;
        justify-content: center;
      }
    }

    .upload-progress {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      color: white;

      mat-progress-bar {
        flex: 1;
      }
    }

    .validation-result {
      padding: 1rem;
      margin: 1rem;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.05);

      &.valid {
        border-left: 4px solid #4CAF50;
      }

      &.invalid {
        border-left: 4px solid #f44336;
      }

      h3 {
        margin: 0 0 0.5rem;
        font-size: 1.1rem;
      }

      .status {
        font-weight: 500;
        margin: 0.5rem 0;
      }

      .message {
        margin: 0.5rem 0;
        color: rgba(255, 255, 255, 0.8);
      }

      .metadata-section {
        margin-top: 1rem;

        h4 {
          margin: 0 0 0.5rem;
          font-size: 1rem;
        }

        .metadata-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;

          .metadata-item {
            padding: 0.25rem 0;
          }
        }
      }

      .stats-section {
        margin-top: 1rem;

        h4 {
          margin: 0 0 0.5rem;
          font-size: 1rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;

          .stat-item {
            padding: 0.25rem 0;
          }
        }
      }

      .sheets-section {
        margin-top: 1rem;

        h4 {
          margin: 0 0 0.5rem;
          font-size: 1rem;
        }

        .sheets-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.5rem;
        }

        .sheet-item {
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          margin-bottom: 0.5rem;
          transition: all 0.3s ease;

          &.valid {
            border-left: 3px solid #4CAF50;
          }

          &.invalid {
            border-left: 3px solid #f44336;
          }

          &:hover {
            background: rgba(255, 255, 255, 0.1);
          }

          .sheet-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 0.5rem;

            h5 {
              margin: 0;
              font-size: 1rem;
              font-weight: 500;
            }

            .sheet-status {
              padding: 0.25rem 0.5rem;
              background: rgba(255, 255, 255, 0.05);
              border-radius: 4px;
              font-weight: 500;
            }
          }

          .sheet-details {
            p {
              margin: 0.25rem 0;
              font-size: 0.875rem;
              color: rgba(255, 255, 255, 0.7);
            }

            .missing-columns {
              margin-top: 0.5rem;

              strong {
                margin-right: 0.5rem;
              }

              ul {
                margin: 0;
                padding-left: 1rem;
              }
            }
          }
        }
      }
    }

    .form-list {
      border-top: 2px dashed #b39ddb;
      border-radius: 0;
      border-right: none;
      border-bottom: none;
      border-left: none;
      padding: 16px;
      margin-bottom: 24px;
    }

    .form-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      margin-bottom: 0.5rem;
      transition: all 0.3s ease;
      cursor: pointer;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    }

    .form-info {
      display: flex;
      align-items: center;
      gap: 1rem;

      mat-icon {
        color: rgba(255, 255, 255, 0.7);
      }
    }

    .form-details {
      h4 {
        margin: 0;
        font-size: 1rem;
        font-weight: 500;
      }

      p {
        margin: 0;
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.7);
      }
    }

    .form-details-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 1000;

      .modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }

      .modal-content {
        background: rgba(26, 26, 46, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 2rem;
        border-radius: 8px;
        width: 80%;
        max-width: 800px;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
        color: white;

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);

          h2 {
            margin: 0;
            color: white;
            font-size: 1.5rem;
            font-weight: 500;
          }

          button {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            color: white;

            &:hover {
              background: rgba(255, 255, 255, 0.2);
              border-color: rgba(255, 255, 255, 0.3);
            }

            mat-icon {
              font-size: 20px;
              width: 20px;
              height: 20px;
            }
          }
        }

        .modal-body {
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

                span {
                  color: white;
                  font-weight: 500;
                }
              }
            }
          }

          .questions-section {
            margin-top: 2rem;

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

          .all-options-section {
            margin-top: 2rem;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;

            h3 {
              margin: 0 0 1rem;
              color: white;
              font-size: 1.2rem;
              font-weight: 500;
            }

            .options-list {
              .option-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.5rem;
                padding: 0.5rem;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 4px;

                .option-id {
                  background: rgba(255, 255, 255, 0.1);
                  color: white;
                  padding: 0.25rem 0.5rem;
                  border-radius: 3px;
                  font-size: 0.75rem;
                  font-weight: bold;
                  min-width: 30px;
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

    .delete-all-wrapper {
      display: flex;
      justify-content: center;
      padding-bottom: 24px;
    }

    .center-header {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  `]
})
export class UploadComponent implements OnInit, OnChanges {
  isDragOver = false;
  isUploading = false;
  isValidating = false;
  uploadProgress = 0;
  selectedFile: File | null = null;
  validationResult: FormValidation | null = null;
  parsedForms: FormData[] = [];
  filteredForms: FormData[] = [];
  selectedFormDetails: FormDetails | null = null;
  isDeletingAll = false;
  @Input() searchQuery: string = '';

  constructor(private formService: FormService) {}

  ngOnInit(): void {
    this.loadForms();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['searchQuery']) {
      this.applySearch();
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
      this.validationResult = null;
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.validationResult = null;
    }
    input.value = '';
  }

  validateFile() {
    if (!this.selectedFile) return;

    this.isValidating = true;
    this.formService.validateFile(this.selectedFile).subscribe({
      next: (result) => {
        this.validationResult = result;
        this.isValidating = false;
      },
      error: (error: any) => {
        console.error('Validation failed:', error);
        this.isValidating = false;
      }
    });
  }

  uploadFile() {
    if (!this.selectedFile || !this.validationResult?.valid) return;

    this.isUploading = true;
    this.uploadProgress = 0;

    const progressInterval = setInterval(() => {
      this.uploadProgress = Math.min(this.uploadProgress + 10, 90);
      if (this.uploadProgress >= 90) {
        clearInterval(progressInterval);
      }
    }, 200);

    this.formService.uploadFile(this.selectedFile).subscribe({
      next: () => {
        clearInterval(progressInterval);
        this.uploadProgress = 100;
        setTimeout(() => {
          this.resetUploadState();
        }, 500);
      },
      error: (error: any) => {
        clearInterval(progressInterval);
        this.resetUploadState();
        console.error('Upload failed:', error);
      }
    });
  }

  private resetUploadState(): void {
    this.isUploading = false;
    this.uploadProgress = 0;
    this.selectedFile = null;
    this.validationResult = null;
    this.loadForms();
  }

  loadForms(): void {
    this.formService.getAllForms().subscribe({
      next: (response) => {
        this.parsedForms = response.forms;
        this.applySearch();
      },
      error: (error: any) => {
        console.error('Failed to load forms:', error);
      }
    });
  }

  applySearch(): void {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      this.filteredForms = this.parsedForms;
    } else {
      this.filteredForms = this.parsedForms.filter(form =>
        form.title && form.title.toLowerCase().includes(query)
      );
    }
  }

  deleteForm(form: FormData, event: Event): void {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete "${form.title}"?`)) {
      this.formService.deleteForm(form.id).subscribe({
        next: () => {
          this.loadForms();
        },
        error: (error: any) => {
          console.error('Failed to delete form:', error);
        }
      });
    }
  }

  showFormDetails(form: FormData): void {
    this.formService.getFormById(form.id).subscribe({
      next: (response: FormDetails) => {
        this.selectedFormDetails = response;
      },
      error: (error: any) => {
        console.error('Failed to load form details:', error);
      }
    });
  }

  closeFormDetails(): void {
    this.selectedFormDetails = null;
  }

  getQuestionOptions(questionId: string): OptionData[] {
    if (!this.selectedFormDetails) return [];

    const question = this.selectedFormDetails.questions.find(q => q.id === questionId);
    if (!question) return [];

    return this.selectedFormDetails.options.filter(option =>
      option.order === question.order
    );
  }

  async deleteAllForms() {
    if (this.isDeletingAll || this.parsedForms.length === 0) return;
    this.isDeletingAll = true;
    this.formService.deleteAllForms().subscribe({
      next: () => {
        this.loadForms();
        this.isDeletingAll = false;
      },
      error: () => {
        this.isDeletingAll = false;
      }
    });
  }

  confirmDeleteAllForms() {
    if (this.isDeletingAll || this.parsedForms.length === 0) return;
    const confirmed = window.confirm('Are you sure you want to delete ALL forms? This action cannot be undone.');
    if (confirmed) {
      this.deleteAllForms();
    }
  }
}
