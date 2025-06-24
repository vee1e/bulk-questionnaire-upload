import { Component, OnInit, Input, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormService, FormData, FormDetails, OptionData } from '../../services/form.service';
import { FormValidation } from '../../models/form.model';
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
    MatProgressSpinnerModule
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
          <div *ngFor="let form of filteredForms" class="form-item"
               [class.loading]="loadingFormId === form.id"
               [class.previewed]="currentPreviewedFormId === form.id"
               (click)="showFormDetails(form)">
            <div class="form-info">
              <mat-icon *ngIf="loadingFormId !== form.id">description</mat-icon>
              <mat-spinner *ngIf="loadingFormId === form.id" diameter="24" class="loading-spinner"></mat-spinner>
              <div class="form-details">
                <h4>{{form.title}}</h4>
                <p>{{form.language}} • {{form.version}} • {{form.created_at | date:'short'}}</p>
              </div>
            </div>

            <div class="form-actions">
              <button mat-icon-button color="warn" (click)="deleteForm(form, $event)" [disabled]="loadingFormId === form.id">
                <mat-icon>delete</mat-icon>
              </button>
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

      &.loading {
        background: rgba(255, 255, 255, 0.18);
        opacity: 0.6;
        pointer-events: none;
      }

      &.previewed {
        background: rgba(63, 81, 181, 0.2);
        border: 2px solid #3f51b5;
        box-shadow: 0 0 12px rgba(63, 81, 181, 0.3);
        transform: scale(1.009);

        &:hover {
          background: rgba(63, 81, 181, 0.25);
        }
      }
    }

    .form-info {
      display: flex;
      align-items: center;
      gap: 1rem;

      mat-icon {
        color: rgba(255, 255, 255, 0.7);
      }

      .loading-spinner {
        ::ng-deep circle {
          stroke: rgba(255, 255, 255, 0.7);
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
  isDeletingAll = false;
  @Input() searchQuery: string = '';
  validationResults: { [filename: string]: { valid: boolean; message: string } } = {};
  isValidating = false;
  allValid = false;
  validationProgress = { current: 0, total: 0 };
  uploadProgress = { current: 0, total: 0 };
  deleteProgress = { current: 0, total: 0 };
  loadingFormId: string | null = null;
  currentPreviewedFormId: string | null = null;

  constructor(private formService: FormService, private formPreviewService: FormPreviewService) {}

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
}
