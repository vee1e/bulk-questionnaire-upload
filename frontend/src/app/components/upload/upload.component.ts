import { Component, OnInit, Input, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { FormService, FormData, FormDetails, OptionData, ParsedSchema } from '../../services/form.service';
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
    <div *ngIf="isValidating || isUploading || isDeletingAll || isParsing" class="global-upload-progress"
         [ngClass]="{
           'bg-orange': isValidating || isUploading,
           'bg-purple': isParsing,
           'bg-red': isDeletingAll
         }">
      <div class="progress-counter" 
           [ngClass]="{'counter-orange': isValidating || isUploading, 'counter-purple': isParsing, 'counter-red': isDeletingAll}" 
           *ngIf="isValidating">
        Validating {{validationProgress.current}}/{{validationProgress.total}}...
      </div>
      <div class="progress-counter"
           [ngClass]="{'counter-orange': isValidating || isUploading, 'counter-purple': isParsing, 'counter-red': isDeletingAll}"
           *ngIf="isUploading">
        Processing {{uploadProgress.total}} form(s) concurrently...
      </div>
      <div class="progress-counter" 
           [ngClass]="{'counter-orange': isValidating || isUploading, 'counter-purple': isParsing, 'counter-red': isDeletingAll}" 
           *ngIf="isParsing">
        Parsing {{parseProgress.current}}/{{parseProgress.total}}...
      </div>
      <div class="progress-counter" 
           [ngClass]="{'counter-orange': isValidating || isUploading, 'counter-purple': isParsing, 'counter-red': isDeletingAll}" 
           *ngIf="isDeletingAll">
        Deleting {{deleteProgress.current}}/{{deleteProgress.total}}...
      </div>
      <mat-progress-bar
        color="primary"
        [ngClass]="{
          'bar-orange': isValidating || isUploading,
          'bar-purple': isParsing,
          'bar-red': isDeletingAll
        }"
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
            <button mat-raised-button color="warn" (click)="parseFilesOnly()" [disabled]="isParsing || selectedFiles.length === 0">
              <mat-icon>preview</mat-icon>
              {{isParsing ? 'Parsing...' : 'Parse Only'}}
            </button>
            <button mat-raised-button color="primary" (click)="uploadFiles()" [disabled]="isUploading || !allValid">
              <mat-icon>upload</mat-icon>
              {{isUploading ? 'Uploading...' : 'Upload'}}
            </button>
          </div>
          <div class="selected-file" *ngFor="let file of selectedFiles">
            <div class="file-info">
              <mat-icon>description</mat-icon>
              <span class="file-name" [title]="file.name">{{file.name}}</span>
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
                <h5 class="warning-title">
                  <mat-icon class="warning-icon">warning</mat-icon>
                  Warnings ({{validationResults[file.name].warnings!.length}}):
                </h5>
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

        <!-- Parsed Results Display -->
        <div *ngIf="getParsedResultKeys().length > 0" class="parsed-results">
          <div class="parsed-results-header">
            <h3>
              <mat-icon class="schema-header-icon">description</mat-icon>
              Parsed Schemas (Parse Only - Not Saved)
            </h3>
          </div>
          <div class="parsed-file" *ngFor="let fileName of getParsedResultKeys()">
            <div class="parsed-file-info">
              <mat-icon>description</mat-icon>
              <span class="file-name" [title]="fileName">{{fileName}}</span>
              <span class="parsed-status" 
                    [ngClass]="{'parsed-success': parsedResults[fileName].valid !== false, 'parsed-error': parsedResults[fileName].valid === false}">
                {{parsedResults[fileName].valid === false ? 'Parsing Failed' : 'Parsed Successfully'}}
              </span>
            </div>
            
            <!-- Success Display -->
            <div *ngIf="parsedResults[fileName].valid !== false" class="parsed-details">
              <div class="schema-summary">
                <div class="schema-item">
                  <strong>Title:</strong> 
                  <span class="title-text" [title]="parsedResults[fileName].title?.default || 'N/A'">
                    {{parsedResults[fileName].title?.default || 'N/A'}}
                  </span>
                </div>
                <div class="schema-item">
                  <strong>Language:</strong> {{parsedResults[fileName].language}}
                </div>
                <div class="schema-item">
                  <strong>Questions:</strong> {{parsedResults[fileName].metadata?.questions_count || 0}}
                </div>
                <div class="schema-item">
                  <strong>Options:</strong> {{parsedResults[fileName].metadata?.options_count || 0}}
                </div>
                <div class="schema-item">
                  <strong>Parse Time:</strong> {{parsedResults[fileName].metadata?.parse_time?.toFixed(3) || 0}}s
                </div>
              </div>
              <div class="schema-actions">
                <button mat-icon-button (click)="downloadParsedSchema(fileName)" style="color: white;" matTooltip="Download JSON">
                  <mat-icon style="color: white;">download</mat-icon>
                </button>
                <button mat-icon-button color="primary" (click)="viewParsedSchema(fileName)" matTooltip="View Schema">
                  <mat-icon>visibility</mat-icon>
                </button>
              </div>
            </div>

            <!-- Error Display -->
            <div *ngIf="parsedResults[fileName].valid === false" class="error-details">
              <div class="error-summary">
                <div class="error-message">
                  <mat-icon class="error-icon">error</mat-icon>
                  <span>{{parsedResults[fileName].message}}</span>
                </div>
                <div class="error-type" *ngIf="parsedResults[fileName].error_type">
                  <strong>Error Type:</strong> {{parsedResults[fileName].error_type}}
                </div>
              </div>

              <!-- Detailed Validation Errors (same format as validation endpoint) -->
              <div *ngIf="parsedResults[fileName].errors && parsedResults[fileName].errors.length > 0" class="validation-details">
                <div class="error-section">
                  <h5 class="error-title">Errors ({{parsedResults[fileName].errors.length}}):</h5>
                  <div class="validation-item error" *ngFor="let error of parsedResults[fileName].errors">
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

              <!-- Detailed Validation Warnings -->
              <div *ngIf="parsedResults[fileName].warnings && parsedResults[fileName].warnings.length > 0" class="validation-details">
                <div class="warning-section">
                  <h5 class="warning-title">
                    <mat-icon class="warning-icon">warning</mat-icon>
                    Warnings ({{parsedResults[fileName].warnings.length}}):
                  </h5>
                  <div class="validation-item warning" *ngFor="let warning of parsedResults[fileName].warnings">
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
              
              <!-- Error Suggestions -->
              <div *ngIf="parsedResults[fileName].errors && parsedResults[fileName].errors[0]?.suggestions?.length > 0" class="error-suggestions">
                <h5>
                  <mat-icon class="suggestion-icon">lightbulb</mat-icon>
                  Suggestions to fix this issue:
                </h5>
                <ul class="suggestions-list">
                  <li *ngFor="let suggestion of parsedResults[fileName].errors[0].suggestions">
                    {{suggestion}}
                  </li>
                </ul>
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
                <h4 class="form-title" [title]="form.title">{{form.title}}</h4>
                <p>{{form.language || 'en'}} • {{form.version || '1.0.0'}} • {{(form.created_at ? (form.created_at | date:'short') : 'Unknown')}}</p>
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
    
    <!-- Schema Modal -->
    <div *ngIf="showSchemaModal" class="schema-modal-overlay" (click)="closeSchemaModal()">
      <div class="schema-modal-content" (click)="$event.stopPropagation()">
        <div class="schema-modal-header">
          <h3>
            <mat-icon class="schema-modal-icon">description</mat-icon>
            Parsed Schema: {{selectedSchemaFileName}}
          </h3>
          <button mat-icon-button (click)="closeSchemaModal()" class="close-modal-btn">
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
                <span>{{selectedSchema?.title?.default || 'N/A'}}</span>
              </div>
              <div class="info-item">
                <strong>Language:</strong> 
                <span>{{selectedSchema?.language || 'N/A'}}</span>
              </div>
              <div class="info-item">
                <strong>Version:</strong> 
                <span>{{selectedSchema?.version || 'N/A'}}</span>
              </div>
              <div class="info-item">
                <strong>Questions:</strong> 
                <span>{{selectedSchema?.metadata?.questions_count || 0}}</span>
              </div>
              <div class="info-item">
                <strong>Options:</strong> 
                <span>{{selectedSchema?.metadata?.options_count || 0}}</span>
              </div>
              <div class="info-item">
                <strong>Parse Time:</strong> 
                <span>{{selectedSchema?.metadata?.parse_time?.toFixed(3) || 0}}s</span>
              </div>
            </div>
          </div>

          <div class="schema-section" *ngIf="selectedSchema?.groups && selectedSchema?.groups.length > 0">
            <h4>
              <mat-icon class="section-icon">quiz</mat-icon>
              Questions Structure
            </h4>
            <div class="questions-container">
              <div *ngFor="let group of selectedSchema.groups" class="question-group">
                <h5 class="group-title">{{group.label?.default || 'Default Group'}}</h5>
                <div *ngFor="let question of group.questions" class="question-item">
                  <div class="question-header">
                    <span class="question-name">#{{question.name}}</span>
                    <span class="question-type">{{question.type}}</span>
                  </div>
                  <div class="question-label">{{question.label?.default}}</div>
                  <div *ngIf="question.choices && question.choices.length > 0" class="question-choices">
                    <div class="choice-header">Choices:</div>
                    <div *ngFor="let choice of question.choices" class="choice-item">
                      <span class="choice-name">{{choice.name}}</span>
                      <span class="choice-label">{{choice.label?.default}}</span>
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
              <pre class="json-content">{{formatJsonSchema(selectedSchema)}}</pre>
            </div>
          </div>
        </div>

        <div class="schema-modal-actions">
          <button mat-raised-button color="accent" (click)="copySchemaToClipboard()">
            <mat-icon>content_copy</mat-icon>
            Copy JSON
          </button>
          <button mat-raised-button color="primary" (click)="downloadSchemaFromModal()">
            <mat-icon>download</mat-icon>
            Download JSON
          </button>
          <button mat-raised-button (click)="closeSchemaModal()">
            <mat-icon>close</mat-icon>
            Close
          </button>
        </div>
      </div>
    </div>
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
            max-width: 250px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            cursor: help;
          }

          .validation-status {
            padding: 0.25rem 0.5rem;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: bold;
            margin-left: auto;
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
            color: #ff0000;
            background: #1c0000;
            border: 1px solid #660000;
          }
        }

        .validation-details {
          margin-top: 0.00rem;
          padding-top: 0.30rem;
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
              display: flex;
              align-items: center;
              margin: 0 0 0.5rem 0;
              font-size: 0.875rem;
              font-weight: 600;
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
                background: rgba(255, 193, 7, 0.12);
                border-left: 3px solid #FFC107;
                border: 1px solid rgba(255, 193, 7, 0.25);
              }

              .validation-header {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                margin-bottom: 0.25rem;

                .validation-type {
                  background: rgba(255, 255, 255, 0.1);
                  padding: 0.0 0.375rem;
                  border-radius: 6px;
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

        button[disabled] {
          opacity: 0.5;
          cursor: not-allowed !important;
          
          &:hover {
            cursor: not-allowed !important;
          }
        }
      }
    }

    .parsed-results {
      border-top: 2px dashed #ffffff;
      border-radius: 0;
      border-right: none;
      border-bottom: none;
      border-left: none;
      padding: 16px;
      margin-bottom: 24px;
    }

    .parsed-results-header {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 16px;

      h3 {
        display: flex;
        align-items: center;
        margin: 0;
        color: #ffffff;
        font-weight: 600;
      }
    }

    .parsed-file {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      margin-bottom: 1rem;
      padding: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .parsed-file-info {
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

      .parsed-status {
        padding: 0.25rem 0.5rem;
        border-radius: 8px;
        font-size: 0.8rem;
        font-weight: bold;
        margin-left: 0.5rem;
        white-space: nowrap;
        display: flex;
        align-items: center;
      }

      .parsed-status.parsed-success {
        color: #4CAF50;
        background: rgba(76, 175, 80, 0.1);
        border: 1px solid rgba(76, 175, 80, 0.3);
      }

      .parsed-status.parsed-error {
        color: #F44336;
        background: rgba(244, 67, 54, 0.1);
        border: 1px solid rgba(244, 67, 54, 0.3);
      }
    }

    .parsed-details {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .schema-summary {
      flex: 1;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.8);
      align-items: flex-start;
    }

    .schema-item {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      min-width: fit-content;
      padding: 0.1rem 0;
    }

    .schema-item strong {
      color: #ffffff;
      font-weight: 600;
      white-space: nowrap;
    }

    .title-text {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      cursor: help;
    }

    .schema-actions {
      display: flex;
      gap: 0.5rem;

      ::ng-deep .mat-mdc-icon-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;

        .mat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          width: 20px;
          height: 20px;
          margin: 0;
        }
      }
    }

    .error-details {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      .validation-details {
        margin-top: 0.5rem;
        padding-top: 0.5rem;
        border-top: 1px solid rgba(255, 255, 255, 0.2);

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
            display: flex;
            align-items: center;
            margin: 0 0 0.5rem 0;
            font-size: 0.875rem;
            font-weight: 600;
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
              background: rgba(255, 193, 7, 0.12);
              border-left: 3px solid #FFC107;
              border: 1px solid rgba(255, 193, 7, 0.25);
            }

            .validation-header {
              display: flex;
              flex-wrap: wrap;
              gap: 0.5rem;
              margin-bottom: 0.25rem;

              .validation-type {
                background: rgba(255, 255, 255, 0.1);
                padding: 0.1rem 0.375rem;
                border-radius: 6px;
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

    .error-summary {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #F44336;
      font-weight: 500;
      flex-wrap: nowrap;
    }

    .error-icon {
      color: #F44336 !important;
      font-size: 20px;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .warning-icon {
      color: #FFC107 !important;
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 0.25rem;
      vertical-align: middle;
    }

    .schema-header-icon {
      color: #ffffff !important;
      font-size: 20px;
      width: 20px;
      height: 20px;
      margin-right: 0.5rem;
      vertical-align: middle;
    }

    .suggestion-icon {
      color: #FFC107 !important;
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 0.25rem;
      vertical-align: middle;
    }

    .error-type {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.8);
    }

    .error-suggestions {
      background: rgba(255, 193, 7, 0.1);
      border: 1px solid rgba(255, 193, 7, 0.3);
      border-radius: 6px;
      padding: 0.75rem;
    }

    .error-suggestions h5 {
      margin: 0 0 0.5rem 0;
      color: #FFC107;
      font-size: 0.9rem;
      font-weight: 600;
      display: flex;
      align-items: center;
    }

    .suggestions-list {
      margin: 0;
      padding-left: 1.2rem;
      list-style-type: disc;
    }

    .suggestions-list li {
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.85rem;
      line-height: 1.4;
      margin-bottom: 0.25rem;
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

      .form-title {
        max-width: 1200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        cursor: help;
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

    /* Progress Bar Colors - Centralized */
    ::ng-deep {
      .mat-mdc-progress-bar.bar-orange {
        .mdc-linear-progress__bar {
          background-color: #ff9800 !important;
        }
        .mdc-linear-progress__buffer {
          background-color: rgba(255, 152, 0, 0.3) !important;
        }
        .mdc-linear-progress__bar-inner {
          border-color: #ff9800 !important;
        }
      }

      .mat-mdc-progress-bar.bar-purple {
        .mdc-linear-progress__bar {
          background-color: #9c27b0 !important;
        }
        .mdc-linear-progress__buffer {
          background-color: rgba(156, 39, 176, 0.3) !important;
        }
        .mdc-linear-progress__bar-inner {
          border-color: #9c27b0 !important;
        }
      }

      .mat-mdc-progress-bar.bar-red {
        .mdc-linear-progress__bar {
          background-color: #F44336 !important;
        }
        .mdc-linear-progress__buffer {
          background-color: rgba(244, 67, 54, 0.3) !important;
        }
        .mdc-linear-progress__bar-inner {
          border-color: #F44336 !important;
        }
      }
    }

    /* Progress Counter Text Colors */
    .progress-counter.counter-orange {
      color: #ff9800;
    }

    .progress-counter.counter-purple {
      color: black;
    }

    .progress-counter.counter-red {
      color: black;
    }

    /* Progress Overlay Background Colors */
    .global-upload-progress.bg-orange {
      background: rgba(0, 0, 0, 0.95) !important;
    }

    .global-upload-progress.bg-purple {
      background: rgba(156, 39, 176, 0.95) !important;
    }

    .global-upload-progress.bg-red {
      background: rgba(244, 67, 54, 0.95) !important;
    }

    .form-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      ::ng-deep .mat-mdc-icon-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;

        .mat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          width: 20px;
          height: 20px;
          margin: 0;
        }
      }
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

    /* Responsive title truncation */
    @media (max-width: 768px) {
      .title-text {
        max-width: 150px;
      }
      
      .form-title {
        max-width: 320px;
      }

      .file-name {
        max-width: 180px;
      }
    }

    @media (max-width: 480px) {
      .title-text {
        max-width: 100px;
      }
      
      .form-title {
        max-width: 220px;
      }

      .file-name {
        max-width: 120px;
      }
    }

    /* Schema Modal Styles */
    .schema-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 5000;
      backdrop-filter: blur(4px);
    }

    .schema-modal-content {
      background: #1e1e1e;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      width: 90vw;
      max-width: 800px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    }

    .schema-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.02);

      h3 {
        margin: 0;
        color: #ffffff;
        font-size: 1.2rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .schema-modal-icon {
        color: #ffffff !important;
        font-size: 20px;
      }

      .close-modal-btn {
        color: #ffffff !important;
      }
    }

    .schema-modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
    }

    .schema-section {
      margin-bottom: 2rem;

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
export class UploadComponent implements OnInit, OnChanges {
  isDragOver = false;
  selectedFiles: File[] = [];
  parsedForms: FormData[] = [];
  filteredForms: FormData[] = [];
  @Input() searchQuery: string = '';
  validationResults: { [key: string]: FormValidation } = {};
  parsedResults: { [key: string]: any } = {};
  validationProgress = { current: 0, total: 0 };
  uploadProgress = { current: 0, total: 0 };
  deleteProgress = { current: 0, total: 0 };
  parseProgress = { current: 0, total: 0 };
  isValidating = false;
  isUploading = false;
  isDeletingAll = false;
  isParsing = false;
  allValid = false;
  
  // Schema modal properties
  showSchemaModal = false;
  selectedSchemaFileName = '';
  selectedSchema: any = null;
  
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

    const files = Array.from(event.dataTransfer?.files || []) as File[];
    const excelFiles = files.filter(file => file.name.endsWith('.xls') || file.name.endsWith('.xlsx'));
    
    if (excelFiles.length > 0) {
      this.selectedFiles = [...this.selectedFiles, ...excelFiles];
      this.validationResults = {};
      this.parsedResults = {}; // Clear previous parsed results
      this.allValid = false;
    }
  }

  onFileSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    this.selectedFiles = [...this.selectedFiles, ...files];
    this.validationProgress = { current: 0, total: 0 };
    this.validationResults = {};
    this.parsedResults = {}; // Clear previous parsed results
    this.allValid = false;
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

    // Send all files at once for concurrent processing
    this.formService.uploadFiles(this.selectedFiles).subscribe({
      next: (results: any[]) => {
        this.uploadProgress.current = this.selectedFiles.length;

        // Show results for each file
        const successful = results.filter(r => !r.error).length;
        const failed = results.filter(r => r.error).length;

        if (failed === 0) {
          this.snackBar.open(`✅ Successfully processed ${successful} form(s)!`, 'Close', { duration: 5000 });
        } else {
          this.snackBar.open(`⚠️ Processed ${successful} form(s), ${failed} failed. Check console for details.`, 'Close', { duration: 7000 });
        }

        // Wait a moment for database operations to complete, then refresh the forms list
        setTimeout(() => {
          this.isUploading = false;
          this.selectedFiles = [];
          this.validationResults = {};
          this.allValid = false;
          this.loadForms();
        }, 1000); // 1 second delay to ensure database operations complete
      },
      error: (error: any) => {
        this.isUploading = false;
        console.error('Upload failed:', error);
        this.snackBar.open(`❌ Upload failed: ${error.error?.message || error.message || 'Unknown error'}`, 'Close', { duration: 5000 });
      }
    });
  }

  private resetUploadState(): void {
    this.isUploading = false;
    this.selectedFiles = [];
    this.loadForms();
  }

  loadForms(): void {
    console.log('Loading forms from database...');
    this.formService.getAllForms().subscribe({
      next: (response) => {
        console.log(`Loaded ${response.forms.length} forms from database`);
        this.parsedForms = response.forms;
        this.applySearch();
      },
      error: (error: any) => {
        console.error('Failed to load forms:', error);
        this.snackBar.open('❌ Failed to refresh forms list', 'Close', { duration: 3000 });
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
      'file_error': 'File Error',
      'invalid_file_format': 'Invalid File Format',
      'password_protected': 'Password Protected',
      'corrupted_file': 'Corrupted File',
      'file_read_error': 'File Read Error'
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

  parseFilesOnly() {
    if (this.selectedFiles.length === 0) return;
    this.isParsing = true;
    this.validationResults = {};
    this.parsedResults = {}; // Clear previous parsed results
    this.parseProgress = { current: 0, total: this.selectedFiles.length };
    let parsed = 0;
    this.selectedFiles.forEach(file => {
      this.formService.parseFile(file).subscribe({
        next: (result) => {
          this.parsedResults[file.name] = result;
          parsed++;
          this.parseProgress.current = parsed;
          if (parsed === this.selectedFiles.length) {
            this.isParsing = false;
            this.selectedFiles = [];
            this.loadForms(); // Reload forms to show parsed results
          }
        },
        error: (error: any) => {
          console.log('Parse error for', file.name, error);
          console.log('Error structure:', {
            hasError: !!error.error,
            hasDetail: !!(error.error && error.error.detail),
            errorKeys: error.error ? Object.keys(error.error) : [],
            detailKeys: (error.error && error.error.detail) ? Object.keys(error.error.detail) : []
          });
          
          // Handle enhanced backend error format
          let errorMessage = 'Parsing failed';
          let errorType = 'UNKNOWN_ERROR';
          let suggestions: string[] = [];
          
          try {
            // The backend returns errors nested under 'detail'
            let errorDetail = null;
            
            if (error.error && error.error.detail) {
              // HTTP error response with nested detail
              errorDetail = error.error.detail;
            } else if (error.error && typeof error.error === 'object') {
              // Direct error object
              errorDetail = error.error;
            }
            
            if (errorDetail) {
              errorMessage = errorDetail.message || errorDetail.error || 'Parsing failed';
              errorType = errorDetail.error_type || 'UNKNOWN_ERROR';
              suggestions = errorDetail.suggestions || [];
              
              // Extract validation errors and warnings if present
              if (errorDetail.errors && Array.isArray(errorDetail.errors)) {
                this.parsedResults[file.name] = {
                  valid: false,
                  message: errorMessage,
                  error_type: errorType,
                  errors: errorDetail.errors,
                  warnings: errorDetail.warnings || [],
                  file_name: errorDetail.file_name || file.name,
                  timestamp: new Date().toISOString()
                };
                
                parsed++;
                this.parseProgress.current = parsed;
                if (parsed === this.selectedFiles.length) {
                  this.isParsing = false;
                  this.selectedFiles = [];
                  this.loadForms();
                }
                return; // Exit early since we've handled the structured validation errors
              }
            } else if (typeof error.error === 'string') {
              errorMessage = error.error;
              // Try to extract error type from error message
              if (error.error.includes('JSON.parse')) {
                errorType = 'INVALID_RESPONSE';
                errorMessage = 'Server returned invalid response. This may be due to file corruption or server error.';
                suggestions = [
                  'Try uploading the file again',
                  'Check that the file is a valid Excel workbook',
                  'Contact support if the problem persists'
                ];
              }
            } else if (error.message) {
              errorMessage = error.message;
            }

            // Handle HTTP error status codes
            if (error.status) {
              if (error.status === 413) {
                errorType = 'FILE_TOO_LARGE';
                errorMessage = 'File is too large to process';
                suggestions = ['Try uploading a smaller file', 'Remove unnecessary data from the Excel file'];
              } else if (error.status === 500) {
                errorType = 'SERVER_ERROR';
                errorMessage = 'Internal server error occurred while processing the file';
                suggestions = ['Try uploading the file again', 'Contact support if the problem persists'];
              } else if (error.status === 0) {
                errorType = 'CONNECTION_ERROR';
                errorMessage = 'Unable to connect to the server';
                suggestions = ['Check your internet connection', 'Try refreshing the page'];
              }
            }
          } catch (e) {
            console.error('Error parsing error response:', e);
            errorMessage = 'An unexpected error occurred while parsing the file';
            errorType = 'PARSE_ERROR';
            suggestions = ['Please try uploading the file again'];
          }

          this.parsedResults[file.name] = {
            valid: false,
            message: errorMessage,
            error_type: errorType,
            errors: [{
              type: errorType,
              message: errorMessage,
              location: 'file',
              suggestions: suggestions
            }],
            warnings: [],
            file_name: file.name,
            timestamp: new Date().toISOString()
          };

          // Show user-friendly error notification
          let snackBarMessage = `Failed to parse ${file.name}`;
          if (errorType === 'INVALID_FILE_FORMAT') {
            snackBarMessage = `${file.name} is not a valid Excel file`;
          } else if (errorType === 'MISSING_SHEET') {
            snackBarMessage = `${file.name} is missing required sheets`;
          } else if (errorType === 'MISSING_COLUMNS') {
            snackBarMessage = `${file.name} is missing required columns`;
          } else if (errorType === 'EMPTY_SHEET') {
            snackBarMessage = `${file.name} has empty sheets`;
          } else if (errorType === 'EMPTY_FILE') {
            snackBarMessage = `${file.name} is empty`;
          } else if (errorType === 'FILE_ACCESS_ERROR') {
            snackBarMessage = `Cannot read ${file.name} - file may be corrupted`;
          } else if (errorType === 'DATA_FORMAT_ERROR' || errorType === 'INVALID_DATA_TYPE') {
            snackBarMessage = `${file.name} has invalid data format`;
          } else if (errorType === 'CORRUPTED_FILE') {
            snackBarMessage = `${file.name} appears to be corrupted`;
          } else if (errorType === 'SCHEMA_VALIDATION_ERROR') {
            snackBarMessage = `${file.name} has data validation errors`;
          } else if (errorType === 'INVALID_RESPONSE') {
            snackBarMessage = `Server error processing ${file.name}`;
          } else if (errorType === 'FILE_TOO_LARGE') {
            snackBarMessage = `${file.name} is too large`;
          } else if (errorType === 'CONNECTION_ERROR') {
            snackBarMessage = 'Connection error - check your internet';
          }

          this.snackBar.open(snackBarMessage, 'Close', {
            duration: 5000,
            panelClass: 'custom-snackbar-error'
          });

          parsed++;
          this.parseProgress.current = parsed;
          if (parsed === this.selectedFiles.length) {
            this.isParsing = false;
            this.selectedFiles = [];
            this.loadForms(); // Reload forms to show parsed results
          }
        }
      });
    });
  }

  downloadParsedSchema(fileName: string) {
    const schema = this.parsedResults[fileName];
    if (schema) {
      const json = JSON.stringify(schema, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName.replace('.xlsx', '')}-parsed-schema.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  }

  viewParsedSchema(fileName: string) {
    const schema = this.parsedResults[fileName];
    if (schema) {
      this.selectedSchemaFileName = fileName;
      this.selectedSchema = schema;
      this.showSchemaModal = true;
    }
  }

  getParsedResultKeys(): string[] {
    return Object.keys(this.parsedResults);
  }

  closeSchemaModal(): void {
    this.showSchemaModal = false;
    this.selectedSchema = null;
    this.selectedSchemaFileName = '';
  }

  copySchemaToClipboard(): void {
    if (this.selectedSchema) {
      const json = JSON.stringify(this.selectedSchema, null, 2);
      navigator.clipboard.writeText(json).then(() => {
        this.snackBar.open('Schema copied to clipboard!', 'Close', {
          duration: 3000,
          panelClass: ['custom-snackbar']
        });
      }).catch(err => {
        console.error('Failed to copy schema to clipboard:', err);
        this.snackBar.open('Failed to copy schema to clipboard.', 'Close', {
          duration: 3000,
          panelClass: ['custom-snackbar-error']
        });
      });
    }
  }

  downloadSchemaFromModal(): void {
    if (this.selectedSchema) {
      const json = JSON.stringify(this.selectedSchema, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.selectedSchemaFileName.replace('.xlsx', '')}-parsed-schema.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  }

  formatJsonSchema(schema: any): string {
    if (!schema) return '';
    return JSON.stringify(schema, null, 2);
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.showSchemaModal) {
      this.closeSchemaModal();
    }
  }
}
