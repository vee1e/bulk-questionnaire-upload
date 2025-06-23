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
    <div *ngIf="isValidating || isUploading || isDeletingAll" class="global-upload-progress"
         [ngStyle]="isValidating ? {'background': '#665c00'} : isUploading ? {'background': '#1b5e20'} : isDeletingAll ? {'background': '#b71c1c'} : {}">
      <div class="progress-counter" *ngIf="isValidating">
        Validating {{validationProgress.current}}/{{validationProgress.total}}...
      </div>
      <div class="progress-counter" *ngIf="isUploading">
        Processing {{uploadProgress.current}}/{{uploadProgress.total}}...
      </div>
      <div class="progress-counter" *ngIf="isDeletingAll">
        Deleting {{deleteProgress.current}}/{{deleteProgress.total}}...
      </div>
      <mat-progress-bar 
        color="primary"
        [ngClass]="{
          'bar-yellow': isValidating,
          'bar-green': isUploading,
          'bar-red': isDeletingAll
        }"
        [ngStyle]="isValidating ? {'background': '#FFD600'} : isUploading ? {'background': '#4CAF50'} : isDeletingAll ? {'background': '#F44336'} : {}"
        mode="indeterminate">
      </mat-progress-bar>
    </div>
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
                 (change)="onFileSelected($event)" multiple>
        </div>

        <!-- File Selection and Actions -->
        <div *ngIf="selectedFiles.length > 0" class="file-actions">
          <div class="button-group mass-action-group" *ngIf="selectedFiles.length > 0">
            <button mat-raised-button color="accent" (click)="validateFiles()" [disabled]="isValidating">
              <mat-icon>check_circle</mat-icon>
              {{isValidating ? 'Validating...' : 'Validate All'}}
            </button>
            <button mat-raised-button color="primary" (click)="uploadFiles()" [disabled]="isUploading || !allValid">
              <mat-icon>upload</mat-icon>
              {{isUploading ? 'Uploading...' : 'Upload'}}
            </button>
          </div>
          <div class="selected-file" *ngFor="let file of selectedFiles">
            <mat-icon>description</mat-icon>
            <span>{{file.name}}</span>
            <span *ngIf="validationResults[file.name]" [ngClass]="{'valid': validationResults[file.name].valid, 'invalid': !validationResults[file.name].valid}">
              {{validationResults[file.name].valid ? '✓' : '✗'}}
              {{validationResults[file.name].message}}
            </span>
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
      width: 100vw;
      height: 100vh;
      z-index: 3000;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }
    .form-details-modal .modal-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.5);
      z-index: 3001;
      pointer-events: auto;
    }
    .form-details-modal .modal-content {
      position: relative;
      margin: auto;
      width: 98vw;
      max-width: 900px;
      max-height: 90vh;
      background: #23234a;
      color: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.25);
      z-index: 3002;
      padding: 2rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      pointer-events: auto;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
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
          font-size: 24px;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
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

    .valid { color: #4CAF50; margin-left: 8px; }
    .invalid { color: #f44336; margin-left: 8px; }
    .mass-action-group { display: flex; gap: 1rem; justify-content: center; margin-bottom: 1rem; }

    .global-upload-progress {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100vw;
      z-index: 4000;
      background: rgba(35, 35, 74, 0.95);
      color: white;
      text-align: center;
      padding: 0.5rem 0 0.2rem 0;
      box-shadow: 0 -2px 8px rgba(0,0,0,0.15);
    }
    .progress-counter {
      font-size: 1.1rem;
      font-weight: 500;
      margin-bottom: 0.2rem;
    }
  `]
})
export class UploadComponent implements OnInit, OnChanges {
  isDragOver = false;
  isUploading = false;
  selectedFiles: File[] = [];
  parsedForms: FormData[] = [];
  filteredForms: FormData[] = [];
  selectedFormDetails: FormDetails | null = null;
  isDeletingAll = false;
  @Input() searchQuery: string = '';
  validationResults: { [filename: string]: { valid: boolean; message: string } } = {};
  isValidating = false;
  allValid = false;
  validationProgress = { current: 0, total: 0 };
  uploadProgress = { current: 0, total: 0 };
  deleteProgress = { current: 0, total: 0 };

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
      this.selectedFiles = Array.from(files);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFiles = Array.from(input.files);
    }
    input.value = '';
  }

  validateFiles() {
    if (this.selectedFiles.length === 0) return;
    this.isValidating = true;
    this.validationResults = {};
    this.validationProgress = { current: 0, total: this.selectedFiles.length };
    let validated = 0;
    let validCount = 0;
    this.selectedFiles.forEach(file => {
      this.formService.validateFile(file).subscribe({
        next: (result) => {
          this.validationResults[file.name] = { valid: result.valid, message: result.message };
          validated++;
          this.validationProgress.current = validated;
          if (result.valid) validCount++;
          if (validated === this.selectedFiles.length) {
            this.isValidating = false;
            this.allValid = validCount === this.selectedFiles.length;
          }
        },
        error: (error: any) => {
          this.validationResults[file.name] = { valid: false, message: 'Validation failed' };
          validated++;
          this.validationProgress.current = validated;
          if (validated === this.selectedFiles.length) {
            this.isValidating = false;
            this.allValid = validCount === this.selectedFiles.length;
          }
        }
      });
    });
  }

  uploadFiles() {
    if (this.selectedFiles.length === 0 || !this.allValid) return;
    this.isUploading = true;
    this.uploadProgress = { current: 0, total: this.selectedFiles.length };
    let uploaded = 0;
    // Simulate per-file upload progress if possible
    const uploadNext = (index: number) => {
      if (index >= this.selectedFiles.length) {
        this.isUploading = false;
        this.selectedFiles = [];
        this.validationResults = {};
        this.allValid = false;
        this.loadForms();
        return;
      }
      this.formService.uploadFiles([this.selectedFiles[index]]).subscribe({
        next: () => {
          uploaded++;
          this.uploadProgress.current = uploaded;
          uploadNext(index + 1);
        },
        error: (error: any) => {
          uploaded++;
          this.uploadProgress.current = uploaded;
          console.error('Upload failed:', error);
          uploadNext(index + 1);
        }
      });
    };
    uploadNext(0);
  }

  private resetUploadState(): void {
    this.isUploading = false;
    this.selectedFiles = [];
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
    this.deleteProgress = { current: 0, total: this.parsedForms.length };
    let deleted = 0;
    const deleteNext = (index: number) => {
      if (index >= this.parsedForms.length) {
        this.isDeletingAll = false;
        this.loadForms();
        return;
      }
      this.formService.deleteForm(this.parsedForms[index].id).subscribe({
        next: () => {
          deleted++;
          this.deleteProgress.current = deleted;
          deleteNext(index + 1);
        },
        error: () => {
          deleted++;
          this.deleteProgress.current = deleted;
          deleteNext(index + 1);
        }
      });
    };
    deleteNext(0);
  }

  confirmDeleteAllForms() {
    if (this.isDeletingAll || this.parsedForms.length === 0) return;
    const confirmed = window.confirm('Are you sure you want to delete ALL forms? This action cannot be undone.');
    if (confirmed) {
      this.deleteAllForms();
    }
  }
}
