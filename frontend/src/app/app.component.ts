import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SearchComponent } from './components/search/search.component';
import { UploadComponent } from './components/upload/upload.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    NavbarComponent,
    SearchComponent,
    UploadComponent
  ],
  template: `
    <div class="app-container">
      <app-navbar></app-navbar>
      <main class="main-content">
        <app-search (search)="onSearch($event)"></app-search>
        <div class="content-grid">
          <app-upload [searchQuery]="searchQuery"></app-upload>
        </div>
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    }

    .main-content {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
      margin-top: 2rem;
    }
  `]
})
export class AppComponent {
  title = 'mForm Bulk Upload';
  searchQuery = '';

  onSearch(query: string) {
    this.searchQuery = query;
  }
}
