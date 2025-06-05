import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormService } from '../../services/form.service';
import { FormValidation, ParsedForm } from '../../models/form.model';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="file-upload-container">
      <div class="upload-section">
        <input type="file" (change)="onFileSelected($event)" accept=".xls,.xlsx" class="file-input">
        <div class="button-group">
          <button (click)="validateFile()" [disabled]="!selectedFile" class="action-button validate">Validate</button>
          <button (click)="uploadFile()" [disabled]="!selectedFile" class="action-button upload">Upload</button>
        </div>
      </div>
      
      <div class="results-container">
        <div *ngIf="validationResult" class="result-section">
          <div class="validation-result" [class.valid]="validationResult.valid" [class.invalid]="!validationResult.valid">
            <h3>Validation Result</h3>
            <p>Status: {{ validationResult.valid ? 'Valid' : 'Invalid' }}</p>
            <p>Message: {{ validationResult.message }}</p>
          </div>
        </div>

        <div *ngIf="parsedForm" class="result-section">
          <div class="form-details">
            <h3>Form Details</h3>
            <p><strong>Title:</strong> {{ parsedForm.title.default }}</p>
            <p><strong>Version:</strong> {{ parsedForm.version }}</p>
            <p><strong>Number of Groups:</strong> {{ parsedForm.groups.length }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .file-upload-container {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 2rem;
      margin: 2rem 0;
      color: white;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .upload-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: center;
    }

    .file-input {
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 4px;
      width: 100%;
      max-width: 400px;
    }

    .button-group {
      display: flex;
      gap: 1rem;
    }

    .action-button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .action-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .validate {
      background: #4CAF50;
      color: white;
    }

    .upload {
      background: #2196F3;
      color: white;
    }

    .results-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .result-section {
      width: 100%;
    }

    .validation-result, .form-details {
      background: rgba(255, 255, 255, 0.05);
      padding: 1.5rem;
      border-radius: 4px;
      width: 100%;
    }

    .validation-result.valid {
      border-left: 4px solid #4CAF50;
    }

    .validation-result.invalid {
      border-left: 4px solid #f44336;
    }

    h3 {
      margin: 0 0 1rem 0;
      color: rgba(255, 255, 255, 0.9);
      font-size: 1.2rem;
    }

    p {
      margin: 0.5rem 0;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.5;
    }

    strong {
      color: rgba(255, 255, 255, 0.9);
    }
  `]
})
export class FileUploadComponent {
  selectedFile: File | null = null;
  validationResult: FormValidation | null = null;
  parsedForm: ParsedForm | null = null;

  constructor(private formService: FormService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      // Reset previous results when a new file is selected
      this.validationResult = null;
      this.parsedForm = null;
    }
  }

  validateFile(): void {
    if (this.selectedFile) {
      this.formService.validateFile(this.selectedFile).subscribe({
        next: (result) => {
          this.validationResult = result;
          console.log('Validation result:', result);
        },
        error: (error) => {
          console.error('Validation error:', error);
          this.validationResult = {
            valid: false,
            message: 'Error validating file: ' + error.message
          };
        }
      });
    }
  }

  uploadFile(): void {
    if (this.selectedFile) {
      this.formService.uploadFile(this.selectedFile).subscribe({
        next: (result) => {
          this.parsedForm = result;
          console.log('Upload result:', result);
        },
        error: (error) => {
          console.error('Upload error:', error);
          this.validationResult = {
            valid: false,
            message: 'Error uploading file: ' + error.message
          };
        }
      });
    }
  }
}
