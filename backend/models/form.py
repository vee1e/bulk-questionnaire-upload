from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class ValidationError(BaseModel):
    type: str
    message: str
    location: str
    row: Optional[int] = None
    column: Optional[str] = None

class ValidationWarning(BaseModel):
    type: str
    message: str
    location: str
    row: Optional[int] = None
    column: Optional[str] = None

class SheetValidation(BaseModel):
    name: str
    exists: bool
    columns: List[str]
    required_columns: List[str]
    missing_columns: List[str]
    row_count: int

class FormValidation(BaseModel):
    valid: bool
    message: str
    sheets: Optional[List[SheetValidation]] = None
    form_metadata: Optional[Dict[str, Any]] = None
    questions_count: Optional[int] = None
    options_count: Optional[int] = None
    errors: Optional[List[ValidationError]] = None
    warnings: Optional[List[ValidationWarning]] = None

class Question(BaseModel):
    type: str
    name: str
    label: Dict[str, str]
    required: bool = False
    constraints: Optional[Dict[str, Any]] = None
    choices: Optional[List[Dict[str, Any]]] = None
    appearance: Optional[str] = None
    relevant: Optional[str] = None
    calculation: Optional[str] = None
    default: Optional[Any] = None
    hint: Optional[Dict[str, str]] = None

class FormGroup(BaseModel):
    name: str
    label: Dict[str, str]
    questions: List[Question]
    appearance: Optional[str] = None
    relevant: Optional[str] = None

class ParsedForm(BaseModel):
    id: str
    title: Dict[str, str]
    version: str
    groups: List[FormGroup]
    settings: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None 