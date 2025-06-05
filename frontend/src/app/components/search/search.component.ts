import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  template: `
    <div class="search-container">
      <mat-form-field appearance="outline" class="search-field">
        <mat-icon matPrefix>search</mat-icon>
        <input matInput
               placeholder="Search forms..."
               [(ngModel)]="searchQuery"
               (input)="onSearch()">
        <button mat-icon-button matSuffix *ngIf="searchQuery"
                (click)="clearSearch()">
          <mat-icon>close</mat-icon>
        </button>
      </mat-form-field>
    </div>
  `,
  styles: [`
    .search-container {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
    }

    .search-field {
      width: 100%;
      
      ::ng-deep {
        .mat-mdc-form-field-flex {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
        }

        .mat-mdc-text-field-wrapper {
          background: transparent;
        }

        .mat-mdc-form-field-outline {
          color: rgba(255, 255, 255, 0.2);
        }

        .mat-mdc-input-element {
          color: white;
        }

        .mat-mdc-form-field-label {
          color: rgba(255, 255, 255, 0.6);
        }

        .mat-mdc-icon-button {
          color: rgba(255, 255, 255, 0.6);
        }
      }
    }
  `]
})
export class SearchComponent {
  searchQuery = '';

  onSearch() {
    // Implement search logic
    console.log('Searching for:', this.searchQuery);
  }

  clearSearch() {
    this.searchQuery = '';
    this.onSearch();
  }
} 