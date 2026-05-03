"""ShieldFlow — Pydantic Schemas (API request/response models)."""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# --------------------------------------------------------------------------- #
#  Auth
# --------------------------------------------------------------------------- #

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    organization_name: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    organization_id: Optional[str] = None

class UserOut(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    role: str
    organization_id: Optional[str]

    class Config:
        from_attributes = True


# --------------------------------------------------------------------------- #
#  Organization
# --------------------------------------------------------------------------- #

class OrganizationOut(BaseModel):
    id: str
    name: str
    sector: Optional[str]
    employee_count: Optional[int]
    plan_type: str

    class Config:
        from_attributes = True


# --------------------------------------------------------------------------- #
#  Connectors
# --------------------------------------------------------------------------- #

class ConnectorCreate(BaseModel):
    name: str
    connector_type: str  # csv|google_workspace|hubspot|notion

class ConnectorOut(BaseModel):
    id: str
    name: str
    connector_type: str
    status: str
    last_scan_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# --------------------------------------------------------------------------- #
#  Scans
# --------------------------------------------------------------------------- #

class ScanCreate(BaseModel):
    connector_id: str

class ScanOut(BaseModel):
    id: str
    connector_id: str
    status: str
    total_records_scanned: int
    personal_data_found: int
    sensitive_data_found: int
    risk_level: Optional[str]
    scan_duration_seconds: Optional[float]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True

class ScanDetailOut(ScanOut):
    findings: List["PersonalDataOut"] = []


# --------------------------------------------------------------------------- #
#  Personal Data Findings
# --------------------------------------------------------------------------- #

class PersonalDataOut(BaseModel):
    id: str
    data_category: str
    data_type: str
    is_sensitive: bool
    source_location: Optional[str]
    occurrences: int
    risk_level: str
    recommendation: Optional[str]

    class Config:
        from_attributes = True


# --------------------------------------------------------------------------- #
#  Treatment Registry
# --------------------------------------------------------------------------- #

class TreatmentRecordCreate(BaseModel):
    treatment_name: str
    purpose: str
    legal_basis: str
    data_categories: List[str]
    data_subjects: List[str]
    recipients: Optional[List[str]] = None
    retention_period: Optional[str] = None
    security_measures: Optional[List[str]] = None
    transfers_outside_eu: bool = False

class TreatmentRecordOut(BaseModel):
    id: str
    treatment_name: str
    purpose: str
    legal_basis: str
    data_categories: List[str]
    data_subjects: List[str]
    recipients: Optional[List[str]]
    retention_period: Optional[str]
    security_measures: Optional[List[str]]
    transfers_outside_eu: bool
    is_compliant: bool
    compliance_notes: Optional[str]
    auto_generated: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --------------------------------------------------------------------------- #
#  Compliance Score
# --------------------------------------------------------------------------- #

class ComplianceScoreOut(BaseModel):
    id: str
    overall_score: int
    data_inventory_score: int
    legal_basis_score: int
    security_score: int
    rights_management_score: int
    recommendations: Optional[list]
    scored_at: datetime

    class Config:
        from_attributes = True


# --------------------------------------------------------------------------- #
#  Dashboard
# --------------------------------------------------------------------------- #

class DashboardOut(BaseModel):
    compliance_score: int
    total_connectors: int
    total_scans: int
    personal_data_found: int
    sensitive_data_found: int
    active_alerts: int
    treatment_records_count: int
    recent_scans: List[ScanOut]
    score_history: List[ComplianceScoreOut]


# --------------------------------------------------------------------------- #
#  Alerts
# --------------------------------------------------------------------------- #

class AlertOut(BaseModel):
    id: str
    alert_type: str
    severity: str
    title: str
    description: str
    is_resolved: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Forward reference resolution
ScanDetailOut.model_rebuild()
