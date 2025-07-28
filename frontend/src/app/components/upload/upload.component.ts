import { Component, OnInit, Input, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { FormService, FormData, FormDetails, OptionData } from '../../services/form.service';
import { FormValidation, ValidationError, ValidationWarning } from '../../models/form.model';
import { FormPreviewService } from '../../services/form-preview.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  template: `
    <div *ngIf="isValidating || isUploading || isDeletingAll" class="global-upload-progress"
         [ngStyle]="isValidating ? {'background': 'rgba(0, 0, 0, 0.95)'} : isUploading ? {'background': 'rgba(0, 0, 0, 0.95)'} : isDeletingAll ? {'background': 'rgba(244, 67, 54, 0.95)'} : {}">
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
          'bar-orange': isValidating || isUploading,
          'bar-red': isDeletingAll
        }"
        [ngStyle]="isValidating ? {'background': '#ff9800'} : isUploading ? {'background': '#ff9800'} : isDeletingAll ? {'background': '#F44336'} : {}"
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
            <div class="file-info">
              <mat-icon>description</mat-icon>
              <span class="file-name">{{file.name}}</span>
              <span *ngIf="validationResults[file.name]"
                    [ngClass]="{'valid': validationResults[file.name].valid, 'invalid': !validationResults[file.name].valid}"
                    class="validation-status">
                {{validationResults[file.name].message}}
              </span>
            </div>

            <!-- Detailed Error Messages -->
            <div *ngIf="validationResults[file.name] && validationResults[file.name].errors && validationResults[file.name].errors!.length > 0" class="validation-details">
              <div class="error-section">
                <h5 class="error-title">Errors ({{validationResults[file.name].errors!.length}}):</h5>
                <div class="validation-item error" *ngFor="let error of validationResults[file.name].errors">
                  <div class="validation-header">
                    <span class="validation-type">{{getErrorTypeLabel(error.type)}}</span>
                    <span class="validation-location">{{error.location}}</span>
                    <span *ngIf="error.row" class="validation-position">Row {{error.row}}</span>
                    <span *ngIf="error.column" class="validation-position">Column: {{error.column}}</span>
                  </div>
                  <div class="validation-message">{{error.message}}</div>
                </div>
              </div>
            </div>

            <!-- Detailed Warning Messages -->
            <div *ngIf="validationResults[file.name] && validationResults[file.name].warnings && validationResults[file.name].warnings!.length > 0" class="validation-details">
              <div class="warning-section">
                <h5 class="warning-title">⚠️ Warnings ({{validationResults[file.name].warnings!.length}}):</h5>
                <div class="validation-item warning" *ngFor="let warning of validationResults[file.name].warnings">
                  <div class="validation-header">
                    <span class="validation-type">{{getWarningTypeLabel(warning.type)}}</span>
                    <span class="validation-location">{{warning.location}}</span>
                    <span *ngIf="warning.row" class="validation-position">Row {{warning.row}}</span>
                    <span *ngIf="warning.column" class="validation-position">Column: {{warning.column}}</span>
                  </div>
                  <div class="validation-message">{{warning.message}}</div>
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
          <div *ngFor="let form of filteredForms" class="form-item"
               [class.loading]="loadingFormId === form.id"
               [class.previewed]="currentPreviewedFormId === form.id"
               (click)="showFormDetails(form)">
            <div class="form-info">
              <mat-icon *ngIf="loadingFormId !== form.id">description</mat-icon>
              <mat-spinner *ngIf="loadingFormId === form.id" diameter="24" class="loading-spinner"></mat-spinner>
              <div class="form-details">
                <h4>{{form.title}}</h4>
                <p>{{form.language}} • {{form.version}} • {{form.created_at | date:'short'}} </p>
              </div>
            </div>

            <div class="form-actions">
              <button mat-icon-button (click)="exportFormAsJson(form, $event)" [disabled]="loadingFormId === form.id" style="color: white;" matTooltip="Download JSON">
                <mat-icon style="color: white;">download</mat-icon>
              </button>
              <button mat-icon-button color="accent" (click)="onUpdateButtonClick(form, $event)" [disabled]="loadingFormId === form.id" matTooltip="Update Form">
                <mat-icon>refresh</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteForm(form, $event)" [disabled]="loadingFormId === form.id" matTooltip="Delete Form">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
    <input type="file" accept=".xls,.xlsx" #updateFileInput id="global-update-file-input" style="display: none" (change)="onUpdateFileSelected($event)">
  `,
  styles: [`
    .upload-card {
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(10px);
      border: 2px dashed rgba(255, 255, 255, 0.3);
      transition: all 0.3s ease;
      height: 100%;
      min-height: 400px;
      color: white;

      &.dragover {
        border-color: #ffffff;
        background: rgba(255, 255, 255, 0.1);
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
          border: 1px solid rgba(255, 255, 255, 0.2);

          mat-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            color: #ffffff;
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
        color: #ffffff;
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
      border-top: 1px solid rgba(255, 255, 255, 0.2);

      .selected-file {
        margin-bottom: 1rem;
        padding: 0.4rem 0.4rem 0.0rem 0.4rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-height: unset;

        .file-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          min-height: 2rem;

          mat-icon {
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .file-name {
            flex: 1;
            font-weight: 500;
            display: flex;
            align-items: center;
          }

          .validation-status {
            padding: 0.25rem 0.5rem;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: bold;
            margin-left: 0.5rem;
            white-space: nowrap;
            display: flex;
            align-items: center;
          }

          .valid {
            color: #4CAF50;
            background: rgba(76, 175, 80, 0.1);
            border: 1px solid rgba(76, 175, 80, 0.3);
          }

          .invalid {
            color: white;
            background: #F44336;
            border: 1px solid #F44336;
          }
        }

        .validation-details {
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          min-height: 0;
          transition: all 0.3s ease;

          .error-section, .warning-section {
            margin-bottom: 0.5rem;

            .error-title, .warning-title {
              margin: 0 0 0.5rem 0;
              font-size: 0.875rem;
              font-weight: 600;
            }

            .error-title {
              color: #F44336;
            }

            .warning-title {
              color: #ffffff;
            }

            .validation-item {
              margin-bottom: 0.5rem;
              padding: 0.5rem;
              border-radius: 4px;
              font-size: 0.8rem;

              &.error {
                background: rgba(244, 67, 54, 0.1);
                border-left: 3px solid #F44336;
                border: 1px solid rgba(244, 67, 54, 0.2);
              }

              &.warning {
                background: rgba(255, 255, 255, 0.1);
                border-left: 3px solid #ffffff;
                border: 1px solid rgba(255, 255, 255, 0.2);
              }

              .validation-header {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                margin-bottom: 0.25rem;

                .validation-type {
                  background: rgba(255, 255, 255, 0.1);
                  padding: 0.125rem 0.375rem;
                  border-radius: 12px;
                  font-size: 0.7rem;
                  font-weight: 600;
                  text-transform: uppercase;
                  border: 1px solid rgba(255, 255, 255, 0.2);
                }

                .validation-location {
                  color: rgba(255, 255, 255, 0.8);
                  font-weight: 500;
                }

                .validation-position {
                  color: rgba(255, 255, 255, 0.6);
                  font-size: 0.7rem;
                }
              }

              .validation-message {
                color: rgba(255, 255, 255, 0.9);
                line-height: 1.3;
              }
            }
          }
        }
      }

      .button-group {
        display: flex;
        gap: 1rem;
        justify-content: center;
      }
    }

    .form-list {
      border-top: 2px dashed #ffffff;
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
      border: 1px solid rgba(255, 255, 255, 0.1);

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.3);
      }

      &.loading {
        background: rgba(255, 255, 255, 0.1);
        opacity: 0.6;
        pointer-events: none;
      }

      &.previewed {
        background: rgba(255, 255, 255, 0.15);
        border: 2px solid #ffffff;
        box-shadow: 0 0 12px rgba(255, 255, 255, 0.3);
        transform: scale(1.009);

        &:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      }
    }

    .form-info {
      display: flex;
      align-items: center;
      gap: 1rem;

      mat-icon {
        color: #ffffff;
      }

      .loading-spinner {
        ::ng-deep circle {
          stroke: #ffffff;
        }
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
      background: rgba(0, 0, 0, 0.95);
      color: white;
      text-align: center;
      padding: 0.5rem 0 0.2rem 0;
      box-shadow: 0 -2px 8px rgba(0,0,0,0.3);
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }
    .progress-counter {
      font-size: 1.1rem;
      font-weight: 500;
      margin-bottom: 0.2rem;
    }
    .form-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    ::ng-deep {
      .custom-snackbar {
        .mdc-snackbar__surface {
          background-color: #ffffff !important;
          color: #000000 !important;
        }
        
        .mdc-snackbar__label {
          color: #000000 !important;
          font-weight: 500 !important;
        }
        
        .mdc-snackbar__actions .mdc-button {
          color: #000000 !important;
          font-weight: 600 !important;
        }
      }

      .custom-snackbar-error {
        .mdc-snackbar__surface {
          background-color: #F44336 !important;
          color: white !important;
        }
        
        .mdc-snackbar__label {
          color: white !important;
          font-weight: 500 !important;
        }
        
        .mdc-snackbar__actions .mdc-button {
          color: white !important;
          font-weight: 600 !important;
        }
      }
    }
  `]
})
export class UploadComponent implements OnInit, OnChanges {
  isDragOver = false;
  isUploading = false;
  selectedFiles: File[] = [];
  parsedForms: FormData[] = [];
  filteredForms: FormData[] = [];
  isDeletingAll = false;
  @Input() searchQuery: string = '';
  validationResults: { [filename: string]: FormValidation } = {};
  isValidating = false;
  allValid = false;
  validationProgress = { current: 0, total: 0 };
  uploadProgress = { current: 0, total: 0 };
  deleteProgress = { current: 0, total: 0 };
  loadingFormId: string | null = null;
  currentPreviewedFormId: string | null = null;
  updateTargetForm: FormData | null = null;

  constructor(private formService: FormService, private formPreviewService: FormPreviewService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadForms();

    // Subscribe to currently previewed form
    this.formPreviewService.currentPreviewedFormId$.subscribe(formId => {
      this.currentPreviewedFormId = formId;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['searchQuery']) {
      this.applySearch();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey) {
      if (event.key === 'j') {
        event.preventDefault();
        this.navigateToNextForm();
      } else if (event.key === 'k') {
        event.preventDefault();
        this.navigateToPreviousForm();
      }
    }
  }

  private navigateToNextForm(): void {
    if (this.filteredForms.length === 0) return;

    const currentIndex = this.getCurrentFormIndex();
    const nextIndex = (currentIndex + 1) % this.filteredForms.length;
    this.showFormDetails(this.filteredForms[nextIndex]);
  }

  private navigateToPreviousForm(): void {
    if (this.filteredForms.length === 0) return;

    const currentIndex = this.getCurrentFormIndex();
    const previousIndex = currentIndex === 0 ? this.filteredForms.length - 1 : currentIndex - 1;
    this.showFormDetails(this.filteredForms[previousIndex]);
  }

  private getCurrentFormIndex(): number {
    if (!this.currentPreviewedFormId) return 0;

    const index = this.filteredForms.findIndex(form => form.id === this.currentPreviewedFormId);
    return index >= 0 ? index : 0;
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
          this.validationResults[file.name] = result;
          validated++;
          this.validationProgress.current = validated;
          if (result.valid) validCount++;
          if (validated === this.selectedFiles.length) {
            this.isValidating = false;
            this.allValid = validCount === this.selectedFiles.length;
          }
        },
        error: (error: any) => {
          this.validationResults[file.name] = {
            valid: false,
            message: 'Validation failed',
            errors: [{ type: 'file_error', message: 'Validation failed', location: 'file' }],
            warnings: []
          };
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

  exportFormAsJson(form: FormData, event: Event): void {
    event.stopPropagation();
    this.formService.getFormById(form.id).subscribe({
      next: (details) => {
        const json = JSON.stringify(details, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${form.title || 'form'}-${form.id}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (error: any) => {
        console.error('Failed to export form as JSON:', error);
      }
    });
  }

  showFormDetails(form: FormData): void {
    this.loadingFormId = form.id;
    this.formPreviewService.setLoadingFormId(form.id);
    this.formService.getFormById(form.id).subscribe({
      next: (response: FormDetails) => {
        this.formPreviewService.setSelectedFormDetails(response);
        this.loadingFormId = null;
      },
      error: (error: any) => {
        console.error('Failed to load form details:', error);
        this.loadingFormId = null;
        this.formPreviewService.setLoadingFormId(null);
      }
    });
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

  getErrorTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'missing_data': 'Missing Data',
      'missing_value': 'Missing Value',
      'missing_sheet': 'Missing Sheet',
      'missing_column': 'Missing Column',
      'invalid_value': 'Invalid Value',
      'invalid_type': 'Invalid Type',
      'duplicate_value': 'Duplicate Value',
      'unsupported_question_type': 'Unsupported Question Type',
      'missing_reference': 'Missing Reference',
      'orphaned_reference': 'Orphaned Reference',
      'file_error': 'File Error'
    };
    return labels[type] || type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getWarningTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'invalid_language': 'Invalid Language',
      'extra_data': 'Extra Data',
      'long_value': 'Long Value',
      'duplicate_value': 'Duplicate Value'
    };
    return labels[type] || type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  onUpdateButtonClick(form: FormData, event: Event): void {
    event.stopPropagation();
    this.updateTargetForm = form;
    const input = document.getElementById('global-update-file-input') as HTMLInputElement;
    if (input) {
      input.value = '';
      input.click();
    }
  }

  onUpdateFileSelected(event: Event): void {
    event.stopPropagation();
    if (!this.updateTargetForm) return;
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (confirm(`This will update the form '${this.updateTargetForm.title}' with the new XLS file. Continue?`)) {
        this.loadingFormId = this.updateTargetForm.id;
        // First validate the file
        this.formService.validateFile(file).subscribe({
          next: (validationResult) => {
            if (validationResult.valid) {
              // Store old form details for comparison
              const oldFormTitle = this.updateTargetForm!.title;
              
              // File is valid, proceed with update
              this.formService.updateForm(this.updateTargetForm!.id, file).subscribe({
                next: (updatedFormDetails) => {
                  this.loadForms();
                  this.showFormDetails(updatedFormDetails.form); // Show updated details
                  this.loadingFormId = null;
                  this.updateTargetForm = null;
                  
                  // Show success toast with details
                  const toastMessage = `Successfully updated "${oldFormTitle}" to "${updatedFormDetails.form.title}".`;
                  
                  this.snackBar.open(toastMessage, 'Close', {
                    duration: 5000,
                    panelClass: ['custom-snackbar'],
                    verticalPosition: 'top'
                  });
                },
                error: (error: any) => {
                  console.error('Failed to update form:', error);
                  this.loadingFormId = null;
                  this.updateTargetForm = null;
                  this.snackBar.open('Failed to update form. Please try again.', 'Close', {
                    duration: 3000,
                    panelClass: ['custom-snackbar-error'],
                    verticalPosition: 'top'
                  });
                }
              });
            } else {
              // File is invalid, show errors
              this.loadingFormId = null;
              this.updateTargetForm = null;
              let errorMessage = `File validation failed for "${file.name}":\n\n`;

              if (validationResult.errors && validationResult.errors.length > 0) {
                errorMessage += `Errors (${validationResult.errors.length}):\n`;
                validationResult.errors.forEach((error, index) => {
                  errorMessage += `${index + 1}. ${this.getErrorTypeLabel(error.type)}: ${error.message}\n`;
                  if (error.location) errorMessage += `   Location: ${error.location}\n`;
                  if (error.row) errorMessage += `   Row: ${error.row}\n`;
                  if (error.column) errorMessage += `   Column: ${error.column}\n`;
                  errorMessage += '\n';
                });
              }

              if (validationResult.warnings && validationResult.warnings.length > 0) {
                errorMessage += `Warnings (${validationResult.warnings.length}):\n`;
                validationResult.warnings.forEach((warning, index) => {
                  errorMessage += `${index + 1}. ${this.getWarningTypeLabel(warning.type)}: ${warning.message}\n`;
                  if (warning.location) errorMessage += `   Location: ${warning.location}\n`;
                  if (warning.row) errorMessage += `   Row: ${warning.row}\n`;
                  if (warning.column) errorMessage += `   Column: ${warning.column}\n`;
                  errorMessage += '\n';
                });
              }

              errorMessage += '\nPlease fix the errors and try again.';
              alert(errorMessage);
            }
          },
          error: (error: any) => {
            console.error('Failed to validate file:', error);
            this.loadingFormId = null;
            this.updateTargetForm = null;
            alert('Failed to validate file. Please try again.');
          }
        });
      }
    }
  }
}
