import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SearchComponent } from './components/search/search.component';
import { UploadComponent } from './components/upload/upload.component';
import { DownloadComponent } from './components/download/download.component';
import { FileUploadComponent } from './components/file-upload/file-upload.component';

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
    UploadComponent,
    DownloadComponent,
    FileUploadComponent
  ],
  template: `
    <div class="app-container">
      <app-navbar></app-navbar>
      <main class="main-content">
        <app-search></app-search>
        <div class="content-grid">
          <app-upload></app-upload>
          <app-download></app-download>
        </div>
        <app-file-upload></app-file-upload>
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
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }
  `]
})
export class AppComponent {
  title = 'mForm Upload';
}
