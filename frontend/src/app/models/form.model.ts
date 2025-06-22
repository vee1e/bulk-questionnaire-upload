export interface SheetValidation {
  name: string;
  exists: boolean;
  columns: string[];
  required_columns: string[];
  missing_columns: string[];
  row_count: number;
}

export interface FormValidation {
  valid: boolean;
  message: string;
  sheets?: SheetValidation[];
  form_metadata?: { [key: string]: any };
  questions_count?: number;
  options_count?: number;
}

export interface Choice {
  name: string;
  label: { default: string };
}

export interface Question {
  type: string;
  name: string;
  label: { default: string };
  required: boolean;
  appearance?: string;
  relevant?: string;
  calculation?: string;
  default?: string;
  hint?: { default: string };
  choices?: Choice[];
  constraints?: {
    rule: string;
    message: { default: string };
  };
}

export interface FormGroup {
  name: string;
  label: { default: string };
  questions: Question[];
  appearance?: string;
  relevant?: string;
}

export interface ParsedForm {
  id: string;
  title: { default: string };
  version: string;
  groups: FormGroup[];
  settings?: { [key: string]: string };
} 