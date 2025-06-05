from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class FormValidation(BaseModel):
    valid: bool
    message: str

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