import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FormValidation, ParsedForm } from '../models/form.model';

@Injectable({
  providedIn: 'root'
})
export class FormService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) { }

  validateFile(file: File): Observable<FormValidation> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<FormValidation>(`${this.apiUrl}/validate`, formData);
  }

  uploadFile(file: File): Observable<ParsedForm> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ParsedForm>(`${this.apiUrl}/upload`, formData);
  }
} 