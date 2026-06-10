import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormData } from '../../services/form.service';

@Component({
  selector: 'app-form-list',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div *ngIf="forms.length > 0" class="form-list">
      <div class="form-list-header center-header">
        <h3>Parsed Forms</h3>
      </div>
      <div class="delete-all-wrapper">
        <button mat-raised-button color="warn" id="delete-all-forms-btn"
                (click)="deleteAllForms.emit()"
                [disabled]="isDeletingAll || forms.length === 0">
          <mat-icon>delete_sweep</mat-icon>
          {{isDeletingAll ? 'Deleting...' : 'Delete All Forms'}}
        </button>
      </div>
      <div *ngFor="let form of forms" class="form-item"
           [class.loading]="loadingFormId === form.id"
           [class.previewed]="currentPreviewedFormId === form.id"
           (click)="formClicked.emit(form)">
        <div class="form-info">
          <mat-icon *ngIf="loadingFormId !== form.id">description</mat-icon>
          <mat-spinner *ngIf="loadingFormId === form.id" diameter="24" class="loading-spinner"></mat-spinner>
          <div class="form-details">
            <h4 class="form-title" [title]="form.title">{{form.title}}</h4>
            <p>{{form.language || 'en'}} &bull; {{form.version || '1.0.0'}} &bull; {{(form.created_at ? (form.created_at | date:'short') : 'Unknown')}}</p>
          </div>
        </div>
        <div class="form-actions">
          <button mat-icon-button (click)="exportForm.emit(form); $event.stopPropagation()"
                  [disabled]="loadingFormId === form.id"
                  style="color: white;" matTooltip="Download JSON">
            <mat-icon style="color: white;">download</mat-icon>
          </button>
          <button mat-icon-button color="accent" (click)="updateForm.emit(form); $event.stopPropagation()"
                  [disabled]="loadingFormId === form.id" matTooltip="Update Form">
            <mat-icon>refresh</mat-icon>
          </button>
          <button mat-icon-button color="warn" (click)="deleteForm.emit(form); $event.stopPropagation()"
                  [disabled]="loadingFormId === form.id" matTooltip="Delete Form">
            <mat-icon>delete</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-list {
      margin-top: 1rem;
    }

    .form-list-header {
      padding: 0 1rem;

      &.center-header {
        text-align: center;
      }

      h3 {
        color: white;
        margin: 0 0 0.5rem 0;
        font-size: 1.1rem;
        font-weight: 600;
      }
    }

    .delete-all-wrapper {
      padding: 0.5rem 1rem 0.5rem 1rem;
      display: flex;
      justify-content: flex-end;
    }

    .form-item {
      padding: 0.75rem 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      transition: background 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.05);
      }

      &.loading {
        opacity: 0.7;
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

      .form-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
        min-width: 0;

        mat-icon {
          color: rgba(255, 255, 255, 0.7);
          flex-shrink: 0;
        }

        .loading-spinner {
          flex-shrink: 0;
        }
      }

      .form-details {
        min-width: 0;
        flex: 1;

        .form-title {
          margin: 0 0 0.25rem 0;
          color: white;
          font-size: 0.95rem;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          cursor: help;
        }

        p {
          margin: 0;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.8rem;
        }
      }

      .form-actions {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        flex-shrink: 0;
      }
    }
  `]
})
export class FormListComponent {
  @Input() forms: FormData[] = [];
  @Input() loadingFormId: string | null = null;
  @Input() isDeletingAll = false;
  @Input() currentPreviewedFormId: string | null = null;
  @Output() formClicked = new EventEmitter<FormData>();
  @Output() deleteForm = new EventEmitter<FormData>();
  @Output() exportForm = new EventEmitter<FormData>();
  @Output() updateForm = new EventEmitter<FormData>();
  @Output() deleteAllForms = new EventEmitter<void>();
}
