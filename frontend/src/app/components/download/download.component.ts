import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-download',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule
  ],
  template: `
    <mat-card class="download-card">
      <mat-card-header>
        <mat-icon mat-card-avatar>download</mat-icon>
        <mat-card-title>Parsed Forms</mat-card-title>
        <mat-card-subtitle>Download or preview parsed forms</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <div class="form-list" *ngIf="parsedForms.length > 0; else noForms">
          <div *ngFor="let form of parsedForms" class="form-item">
            <div class="form-info">
              <mat-icon>description</mat-icon>
              <div class="form-details">
                <h3>{{form.name}}</h3>
                <p>{{form.questions}} questions</p>
              </div>
            </div>
            
            <div class="form-actions">
              <button mat-icon-button [matMenuTriggerFor]="menu">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="previewForm(form)">
                  <mat-icon>preview</mat-icon>
                  <span>Preview</span>
                </button>
                <button mat-menu-item (click)="downloadForm(form)">
                  <mat-icon>download</mat-icon>
                  <span>Download JSON</span>
                </button>
                <mat-divider></mat-divider>
                <button mat-menu-item color="warn" (click)="deleteForm(form)">
                  <mat-icon color="warn">delete</mat-icon>
                  <span class="warn-text">Delete</span>
                </button>
              </mat-menu>
            </div>
          </div>
        </div>

        <ng-template #noForms>
          <div class="no-forms">
            <mat-icon>info</mat-icon>
            <p>No forms have been parsed yet</p>
            <button mat-stroked-button color="primary">
              Upload an Excel file to get started
            </button>
          </div>
        </ng-template>
      </mat-card-content>

      <mat-card-actions *ngIf="parsedForms.length > 0">
        <button mat-button color="primary" (click)="downloadAllForms()">
          <mat-icon>download_all</mat-icon>
          Download All
        </button>
        <button mat-button color="warn" (click)="clearAllForms()">
          <mat-icon>clear_all</mat-icon>
          Clear All
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .download-card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      height: 100%;
      min-height: 300px;
      color: white;

      ::ng-deep {
        .mat-mdc-card-header {
          padding: 1rem;
        }

        .mat-mdc-card-avatar {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          padding: 8px;
        }

        .mat-mdc-card-title {
          color: white;
        }

        .mat-mdc-card-subtitle {
          color: rgba(255, 255, 255, 0.7);
        }
      }
    }

    .form-list {
      max-height: 400px;
      overflow-y: auto;
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
      h3 {
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

    .no-forms {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
      height: 100%;
      min-height: 200px;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 1rem;
        color: rgba(255, 255, 255, 0.5);
      }

      p {
        margin: 0 0 1rem;
        color: rgba(255, 255, 255, 0.7);
      }
    }

    .warn-text {
      color: #f44336;
    }

    mat-card-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1rem;
    }
  `]
})
export class DownloadComponent {
  parsedForms = [
    { name: 'Sample Form 1', questions: 10 },
    { name: 'Sample Form 2', questions: 15 },
    { name: 'Sample Form 3', questions: 8 }
  ];

  previewForm(form: any) {
    console.log('Preview form:', form);
  }

  downloadForm(form: any) {
    console.log('Download form:', form);
  }

  deleteForm(form: any) {
    const index = this.parsedForms.indexOf(form);
    if (index > -1) {
      this.parsedForms.splice(index, 1);
    }
  }

  downloadAllForms() {
    console.log('Download all forms');
  }

  clearAllForms() {
    this.parsedForms = [];
  }
} 