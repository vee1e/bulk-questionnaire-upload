export interface FormValidation {
  valid: boolean;
  message: string;
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