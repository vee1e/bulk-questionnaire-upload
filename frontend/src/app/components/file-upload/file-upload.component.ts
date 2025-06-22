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
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      width: 100%;
      max-width: 400px;
      color: white;
      font-weight: 500;
      transition: all 0.3s ease;
      cursor: pointer;

      &:hover {
        border-color: rgba(255, 255, 255, 0.4);
        background: rgba(255, 255, 255, 0.1);
      }

      &:focus {
        outline: none;
        border-color: #3f51b5;
        background: rgba(63, 81, 181, 0.1);
      }

      &::file-selector-button {
        border: 2px solid #3f51b5;
        border-radius: 6px;
        padding: 6px 12px;
        font-weight: 500;
        transition: all 0.3s ease;
        background-color: #3f51b5;
        color: white;
        cursor: pointer;
        margin-right: 1rem;

        &:hover {
          background-color: #303f9f;
          border-color: #303f9f;
        }
      }
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

    .status {
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .message {
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 1rem;
    }

    h4 {
      margin: 0 0 0.5rem 0;
      color: rgba(255, 255, 255, 0.9);
      font-size: 1rem;
    }

    .metadata-section, .stats-section, .sheets-section {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .metadata-grid, .stats-grid {
      display: flex;
      gap: 1rem;
    }

    .metadata-item, .stat-item {
      flex: 1;
      background: rgba(255, 255, 255, 0.05);
      padding: 0.5rem;
      border-radius: 4px;
    }

    .sheets-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .sheet-item {
      flex: 1 1 calc(33.33% - 1rem);
      background: rgba(255, 255, 255, 0.05);
      padding: 1rem;
      border-radius: 4px;
      border-left: 4px solid transparent;
    }

    .sheet-item.valid {
      border-left-color: #4CAF50;
    }

    .sheet-item.invalid {
      border-left-color: #f44336;
    }

    .sheet-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .sheet-header h5 {
      margin: 0;
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.9rem;
    }

    .sheet-status {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.1);
      font-size: 0.8rem;
    }

    .sheet-details p {
      margin: 0.25rem 0;
      font-size: 0.85rem;
    }

    .missing-columns {
      margin-top: 0.5rem;
    }

    .missing-columns ul {
      margin: 0.25rem 0;
      padding-left: 1rem;
    }

    .missing-columns li {
      color: #f44336;
      font-size: 0.85rem;
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
