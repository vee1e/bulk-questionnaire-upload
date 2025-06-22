import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FormValidation, ParsedForm } from '../models/form.model';

export interface FormData {
  id: string;
  title: string;
  language: string;
  version: string;
  created_at: string;
}

export interface QuestionData {
  id: string;
  form_id: string;
  order: number;
  title: string;
  view_sequence: number;
  input_type: number;
  created_at: string;
}

export interface OptionData {
  id: string;
  form_id: string;
  order: number;
  option_id: number;
  label: string;
  created_at: string;
}

export interface FormDetails {
  form: FormData;
  questions: QuestionData[];
  options: OptionData[];
  questions_count: number;
  options_count: number;
}

export interface FormsResponse {
  forms: FormData[];
  count: number;
}

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

  getAllForms(): Observable<FormsResponse> {
    return this.http.get<FormsResponse>(`${this.apiUrl}/forms`);
  }

  getFormById(formId: string): Observable<FormDetails> {
    return this.http.get<FormDetails>(`${this.apiUrl}/forms/${formId}`);
  }

  deleteForm(formId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/forms/${formId}`);
  }
} 