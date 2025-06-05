import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

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
      <mat-card-content>
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
        
        <div *ngIf="uploadProgress > 0" class="upload-progress">
          <mat-progress-bar mode="determinate" [value]="uploadProgress">
          </mat-progress-bar>
          <span>{{uploadProgress}}%</span>
        </div>

        <div *ngIf="uploadedFiles.length > 0" class="uploaded-files">
          <h3>Uploaded Files</h3>
          <div *ngFor="let file of uploadedFiles" class="file-item">
            <mat-icon>description</mat-icon>
            <span>{{file.name}}</span>
            <button mat-icon-button color="warn" (click)="removeFile(file)">
              <mat-icon>delete</mat-icon>
            </button>
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
      min-height: 300px;

      &.dragover {
        border-color: #4CAF50;
        background: rgba(76, 175, 80, 0.1);
      }
    }

    .upload-area {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      color: white;
      text-align: center;
      height: 100%;
      min-height: 200px;

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

    .upload-progress {
      margin-top: 1rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      color: white;

      mat-progress-bar {
        flex: 1;
      }
    }

    .uploaded-files {
      margin-top: 2rem;
      color: white;

      h3 {
        margin: 0 0 1rem;
        font-size: 1.1rem;
      }

      .file-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
        margin-bottom: 0.5rem;

        mat-icon {
          color: rgba(255, 255, 255, 0.6);
        }

        span {
          flex: 1;
        }
      }
    }
  `]
})
export class UploadComponent {
  isDragOver = false;
  uploadProgress = 0;
  uploadedFiles: File[] = [];

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
    if (files) {
      this.handleFiles(Array.from(files));
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
    }
  }

  handleFiles(files: File[]) {
    const excelFiles = files.filter(file => 
      file.type === 'application/vnd.ms-excel' || 
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    if (excelFiles.length > 0) {
      this.uploadedFiles.push(...excelFiles);
      this.simulateUpload();
    }
  }

  simulateUpload() {
    this.uploadProgress = 0;
    const interval = setInterval(() => {
      this.uploadProgress += 10;
      if (this.uploadProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          this.uploadProgress = 0;
        }, 500);
      }
    }, 200);
  }

  removeFile(file: File) {
    const index = this.uploadedFiles.indexOf(file);
    if (index > -1) {
      this.uploadedFiles.splice(index, 1);
    }
  }
} 