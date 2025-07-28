import { Component, Output, EventEmitter, ViewChild, ElementRef, OnInit, OnDestroy, HostListener } from '@angular/core';
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
        <input #searchInput
               matInput
               placeholder="Search forms... (Shift+K)"
               [(ngModel)]="searchQuery"
               (input)="onSearch()">
      </mat-form-field>
    </div>
  `,
  styles: [`
    .search-container {
      width: 100%;
      max-width: 400px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 4px 12px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.3s ease;
    }

    .search-container:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .search-container:focus-within {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .search-field {
      width: 100%;

      ::ng-deep {
        .mat-mdc-form-field {
          background: transparent !important;
          border: none !important;
          outline: none !important;
        }

        .mat-mdc-form-field-flex {
          background: transparent !important;
          border: none !important;
          border-radius: 0 !important;
          padding: 8px 0 !important;
          align-items: center !important;
        }

        .mat-mdc-text-field-wrapper {
          background: transparent !important;
          padding: 0 !important;
          border: none !important;
        }

        .mat-mdc-form-field-outline,
        .mat-mdc-form-field-outline-start,
        .mat-mdc-form-field-outline-end,
        .mat-mdc-form-field-outline-gap,
        .mat-mdc-form-field-outline-thick {
          display: none !important;
          border: none !important;
          outline: none !important;
        }

        .mat-mdc-form-field-infix {
          border: none !important;
          padding: 0 !important;
          margin: 0 !important;
          min-height: auto !important;
          display: flex !important;
          align-items: center !important;
        }

        .mat-mdc-input-element {
          color: white !important;
          background: transparent !important;
          border: none !important;
          outline: none !important;
          padding: 0 4px !important;
          font-size: 16px !important;
          line-height: 1.5 !important;
          font-weight: 400 !important;
        }

        .mat-mdc-form-field-label {
          display: none !important;
        }

        .mat-icon {
          color: rgba(255, 255, 255, 0.7) !important;
          margin-right: 4px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 20px !important;
          width: 20px !important;
          height: 20px !important;
          transition: color 0.3s ease !important;
        }

        .mat-mdc-form-field-subscript-wrapper {
          display: none !important;
        }

        ::placeholder {
          color: rgba(255, 255, 255, 0.5) !important;
          font-weight: 300 !important;
        }

        /* Remove all focus states and borders */
        .mat-mdc-form-field.mat-focused,
        .mat-mdc-form-field.mat-focused .mat-mdc-form-field-flex,
        .mat-mdc-form-field.mat-focused .mat-mdc-input-element {
          background: transparent !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }

        .mat-mdc-form-field.mat-focused .mat-mdc-form-field-outline,
        .mat-mdc-form-field.mat-focused .mat-mdc-form-field-outline-start,
        .mat-mdc-form-field.mat-focused .mat-mdc-form-field-outline-end,
        .mat-mdc-form-field.mat-focused .mat-mdc-form-field-outline-gap,
        .mat-mdc-form-field.mat-focused .mat-mdc-form-field-outline-thick {
          display: none !important;
          border: none !important;
          outline: none !important;
        }

        /* Remove any Material Design default styling */
        .mdc-text-field,
        .mdc-text-field--outlined,
        .mdc-text-field--focused {
          background: transparent !important;
          border: none !important;
          outline: none !important;
        }

        .mdc-notched-outline,
        .mdc-notched-outline__leading,
        .mdc-notched-outline__trailing,
        .mdc-notched-outline__notch {
          display: none !important;
          border: none !important;
        }
      }
    }

    /* Focus enhancement */
    .search-container:focus-within .search-field ::ng-deep .mat-icon {
      color: rgba(255, 255, 255, 0.9) !important;
    }
  `]
})
export class SearchComponent implements OnInit, OnDestroy {
  @Output() search = new EventEmitter<string>();
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  searchQuery = '';

  ngOnInit() {
    // Component initialization
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent) {
    // Check for Shift+K
    if (event.shiftKey && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.focusSearch();
    }
  }

  focusSearch() {
    if (this.searchInput) {
      this.searchInput.nativeElement.focus();
    }
  }

  onSearch() {
    this.search.emit(this.searchQuery);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.onSearch();
  }
}
