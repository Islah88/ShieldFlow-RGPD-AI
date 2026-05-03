"""ShieldFlow — SQLAlchemy Models for RGPD Compliance Automation."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey,
    Integer, String, Text, JSON, Enum,
)
from sqlalchemy.orm import relationship

from app.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# --------------------------------------------------------------------------- #
#  Organization & Users
# --------------------------------------------------------------------------- #

class Organization(Base):
    """A client company using ShieldFlow."""

    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    siren = Column(String(20), nullable=True)  # French company ID
    sector = Column(String(100), nullable=True)  # e.g. "commerce", "santé", "immobilier"
    employee_count = Column(Integer, nullable=True)
    plan_type = Column(String(50), default="free")  # free|starter|pro
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    connectors = relationship("Connector", back_populates="organization", cascade="all, delete-orphan")
    scans = relationship("Scan", back_populates="organization", cascade="all, delete-orphan")
    compliance_scores = relationship("ComplianceScore", back_populates="organization", cascade="all, delete-orphan")


class User(Base):
    """A registered user (DPO, admin, viewer)."""

    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), default="admin")  # admin|dpo|viewer
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    organization = relationship("Organization", back_populates="users")


# --------------------------------------------------------------------------- #
#  Connectors — Data Sources
# --------------------------------------------------------------------------- #

class Connector(Base):
    """An external tool connected for scanning (CRM, email, drive, CSV)."""

    __tablename__ = "connectors"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    name = Column(String(100), nullable=False)  # User-facing label
    connector_type = Column(String(50), nullable=False)  # csv|google_workspace|hubspot|notion
    status = Column(String(30), default="active")  # active|disconnected|error
    config_encrypted = Column(Text, nullable=True)  # Encrypted JSON credentials
    last_scan_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    organization = relationship("Organization", back_populates="connectors")
    scans = relationship("Scan", back_populates="connector", cascade="all, delete-orphan")


# --------------------------------------------------------------------------- #
#  Scans — RGPD Data Discovery
# --------------------------------------------------------------------------- #

class Scan(Base):
    """A scan execution result."""

    __tablename__ = "scans"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    connector_id = Column(String(36), ForeignKey("connectors.id"), nullable=False)
    status = Column(String(30), default="pending")  # pending|running|completed|failed
    total_records_scanned = Column(Integer, default=0)
    personal_data_found = Column(Integer, default=0)
    sensitive_data_found = Column(Integer, default=0)
    risk_level = Column(String(20), nullable=True)  # low|medium|high|critical
    scan_duration_seconds = Column(Float, nullable=True)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    organization = relationship("Organization", back_populates="scans")
    connector = relationship("Connector", back_populates="scans")
    findings = relationship("PersonalData", back_populates="scan", cascade="all, delete-orphan")


# --------------------------------------------------------------------------- #
#  Personal Data Findings
# --------------------------------------------------------------------------- #

class PersonalData(Base):
    """A personal data element detected during a scan."""

    __tablename__ = "personal_data"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    scan_id = Column(String(36), ForeignKey("scans.id"), nullable=False)
    data_category = Column(String(50), nullable=False)  # name|email|phone|address|health|religion|financial|biometric
    data_type = Column(String(100), nullable=False)  # e.g. "email_address", "first_name", "medical_record"
    is_sensitive = Column(Boolean, default=False)  # RGPD Art.9 sensitive data
    source_location = Column(String(500), nullable=True)  # Where found: "column: email", "field: contact_phone"
    sample_value_hash = Column(String(64), nullable=True)  # SHA-256 of sample (never store raw PII)
    occurrences = Column(Integer, default=1)
    risk_level = Column(String(20), default="medium")  # low|medium|high|critical
    recommendation = Column(Text, nullable=True)  # AI-generated recommendation
    detected_at = Column(DateTime, default=utc_now)

    # Relationships
    scan = relationship("Scan", back_populates="findings")


# --------------------------------------------------------------------------- #
#  Treatment Registry (Registre des Traitements — Art. 30 RGPD)
# --------------------------------------------------------------------------- #

class TreatmentRecord(Base):
    """A treatment record in the CNIL-compliant registry."""

    __tablename__ = "treatment_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    treatment_name = Column(String(255), nullable=False)  # e.g. "Gestion des clients"
    purpose = Column(Text, nullable=False)  # Finalité du traitement
    legal_basis = Column(String(100), nullable=False)  # consent|contract|legal_obligation|legitimate_interest|vital_interest|public_task
    data_categories = Column(JSON, nullable=False)  # ["name", "email", "phone"]
    data_subjects = Column(JSON, nullable=False)  # ["clients", "prospects", "employees"]
    recipients = Column(JSON, nullable=True)  # ["internal_sales", "mailchimp"]
    retention_period = Column(String(255), nullable=True)  # e.g. "3 ans après dernier contact"
    security_measures = Column(JSON, nullable=True)  # ["encryption", "access_control", "pseudonymization"]
    transfers_outside_eu = Column(Boolean, default=False)
    transfer_safeguards = Column(Text, nullable=True)  # If transfers outside EU
    dpia_required = Column(Boolean, default=False)  # Data Protection Impact Assessment
    is_compliant = Column(Boolean, default=False)
    compliance_notes = Column(Text, nullable=True)  # AI-generated compliance notes
    auto_generated = Column(Boolean, default=True)  # Was this generated by ShieldFlow AI?
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    organization = relationship("Organization")


# --------------------------------------------------------------------------- #
#  Compliance Score History
# --------------------------------------------------------------------------- #

class ComplianceScore(Base):
    """Historical compliance score for trend tracking."""

    __tablename__ = "compliance_scores"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    overall_score = Column(Integer, nullable=False)  # 0-100
    data_inventory_score = Column(Integer, default=0)  # 0-100
    legal_basis_score = Column(Integer, default=0)  # 0-100
    security_score = Column(Integer, default=0)  # 0-100
    rights_management_score = Column(Integer, default=0)  # 0-100
    details = Column(JSON, nullable=True)  # Detailed breakdown
    recommendations = Column(JSON, nullable=True)  # AI recommendations
    scored_at = Column(DateTime, default=utc_now)

    # Relationships
    organization = relationship("Organization", back_populates="compliance_scores")


# --------------------------------------------------------------------------- #
#  Alerts
# --------------------------------------------------------------------------- #

class Alert(Base):
    """Compliance alert triggered by monitoring."""

    __tablename__ = "alerts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    alert_type = Column(String(50), nullable=False)  # new_personal_data|missing_legal_basis|retention_expired|sensitive_data_exposed
    severity = Column(String(20), default="medium")  # low|medium|high|critical
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    source_scan_id = Column(String(36), ForeignKey("scans.id"), nullable=True)
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    organization = relationship("Organization")
