import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FormDetails } from './form.service';

@Injectable({
    providedIn: 'root'
})
export class FormPreviewService {
    private selectedFormDetailsSubject = new BehaviorSubject<FormDetails | null>(null);
    private loadingFormIdSubject = new BehaviorSubject<string | null>(null);
    private currentPreviewedFormIdSubject = new BehaviorSubject<string | null>(null);

    selectedFormDetails$ = this.selectedFormDetailsSubject.asObservable();
    loadingFormId$ = this.loadingFormIdSubject.asObservable();
    currentPreviewedFormId$ = this.currentPreviewedFormIdSubject.asObservable();

    setSelectedFormDetails(formDetails: FormDetails | null): void {
        this.selectedFormDetailsSubject.next(formDetails);
        if (formDetails) {
            this.currentPreviewedFormIdSubject.next(formDetails.form.id);
        } else {
            this.currentPreviewedFormIdSubject.next(null);
        }
    }

    setLoadingFormId(formId: string | null): void {
        this.loadingFormIdSubject.next(formId);
    }

    closePreview(): void {
        this.selectedFormDetailsSubject.next(null);
        this.loadingFormIdSubject.next(null);
        this.currentPreviewedFormIdSubject.next(null);
    }

    getCurrentPreviewedFormId(): string | null {
        return this.currentPreviewedFormIdSubject.value;
    }
}
