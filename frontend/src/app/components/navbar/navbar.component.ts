import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatIconModule],
  template: `
    <mat-toolbar class="navbar">
      <div class="navbar-brand">
        <mat-icon class="brand-icon">description</mat-icon>
        <span>mForm Upload</span>
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
  `]
})
export class NavbarComponent {}