import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar class="navbar">
      <div class="navbar-brand">
        <mat-icon class="brand-icon">description</mat-icon>
        <span>mForm Upload</span>
      </div>
      <div class="navbar-actions">
        <button mat-button>
          <mat-icon>help_outline</mat-icon>
          Help
        </button>
        <button mat-button>
          <mat-icon>settings</mat-icon>
          Settings
        </button>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .navbar {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      color: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.2rem;
      font-weight: 500;
    }

    .brand-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .navbar-actions {
      margin-left: auto;
      display: flex;
      gap: 1rem;
    }

    button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: white;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    }
  `]
})
export class NavbarComponent {} 