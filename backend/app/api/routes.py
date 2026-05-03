"""ShieldFlow — Core API Routes (Connectors, Scans, Registry, Dashboard)."""

import csv
import io
import time
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (User, Connector, Scan, PersonalData,
                         TreatmentRecord, ComplianceScore, Alert, utc_now)
from app.schemas import (
    ConnectorCreate, ConnectorOut, ScanOut, ScanDetailOut,
    PersonalDataOut, TreatmentRecordOut, TreatmentRecordCreate,
    ComplianceScoreOut, DashboardOut, AlertOut,
)
from app.core import get_current_user
from app.core.ai_client import ai_classify_data, ai_generate_registry, ai_compute_compliance_score

router = APIRouter(tags=["ShieldFlow Core"])


# --- Connectors ---
@router.get("/connectors", response_model=List[ConnectorOut])
def list_connectors(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Connector).filter(Connector.organization_id == current_user.organization_id).all()

@router.post("/connectors", response_model=ConnectorOut, status_code=201)
def create_connector(payload: ConnectorCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    connector = Connector(organization_id=current_user.organization_id, name=payload.name, connector_type=payload.connector_type)
    db.add(connector)
    db.commit()
    db.refresh(connector)
    return connector


# --- CSV Upload + Scan ---
@router.post("/connectors/{connector_id}/upload-csv", response_model=ScanOut)
async def upload_csv_and_scan(connector_id: str, file: UploadFile = File(...),
                               current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Upload a CSV file and trigger an AI-powered RGPD scan."""
    connector = db.query(Connector).filter(Connector.id == connector_id,
                                            Connector.organization_id == current_user.organization_id).first()
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")

    scan = Scan(organization_id=current_user.organization_id, connector_id=connector_id,
                status="running", started_at=utc_now())
    db.add(scan)
    db.flush()

    try:
        content = await file.read()
        text = content.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(text))
        rows = list(reader)
        scan.total_records_scanned = len(rows)

        ai_result = await ai_classify_data(rows[:50], context=f"Fichier: {file.filename}")
        if "error" in ai_result:
            scan.status = "failed"
            scan.error_message = str(ai_result.get("raw", "AI failed"))
            db.commit()
            raise HTTPException(status_code=500, detail="AI classification failed")

        findings = ai_result.get("findings", [])
        personal_count = sensitive_count = 0
        for f in findings:
            pd = PersonalData(scan_id=scan.id, data_category=f.get("data_category", "unknown"),
                               data_type=f.get("data_type", "unknown"), is_sensitive=f.get("is_sensitive", False),
                               source_location=f.get("field_name", ""), occurrences=f.get("occurrences", len(rows)),
                               risk_level=f.get("risk_level", "medium"), recommendation=f.get("recommendation", ""))
            db.add(pd)
            personal_count += 1
            if f.get("is_sensitive"):
                sensitive_count += 1
            if f.get("risk_level") in ("high", "critical"):
                alert = Alert(organization_id=current_user.organization_id,
                              alert_type="sensitive_data_exposed" if f.get("is_sensitive") else "new_personal_data",
                              severity=f.get("risk_level", "high"),
                              title=f"Donnee {f.get('data_category', 'personnelle')} detectee",
                              description=f.get("recommendation", "Verification requise"), source_scan_id=scan.id)
                db.add(alert)

        scan.personal_data_found = personal_count
        scan.sensitive_data_found = sensitive_count
        scan.risk_level = ai_result.get("overall_risk", "medium")
        scan.status = "completed"
        scan.completed_at = utc_now()
        connector.last_scan_at = utc_now()
        db.commit()
        db.refresh(scan)
        return scan
    except HTTPException:
        raise
    except Exception as e:
        scan.status = "failed"
        scan.error_message = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")


# --- Scans ---
@router.get("/scans", response_model=List[ScanOut])
def list_scans(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Scan).filter(Scan.organization_id == current_user.organization_id).order_by(Scan.created_at.desc()).all()

@router.get("/scans/{scan_id}", response_model=ScanDetailOut)
def get_scan_detail(scan_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id, Scan.organization_id == current_user.organization_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan


# --- Registry ---
@router.get("/registry", response_model=List[TreatmentRecordOut])
def list_treatments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(TreatmentRecord).filter(TreatmentRecord.organization_id == current_user.organization_id).all()

@router.post("/registry/generate", response_model=List[TreatmentRecordOut])
async def generate_registry(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org_id = current_user.organization_id
    findings = db.query(PersonalData).join(Scan).filter(Scan.organization_id == org_id).all()
    if not findings:
        raise HTTPException(status_code=400, detail="No scan data. Run a scan first.")
    findings_data = [{"data_category": f.data_category, "data_type": f.data_type, "is_sensitive": f.is_sensitive,
                       "source_location": f.source_location, "occurrences": f.occurrences} for f in findings]
    org = current_user.organization
    ai_result = await ai_generate_registry(findings_data, org.name if org else "Organisation")
    if "error" in ai_result:
        raise HTTPException(status_code=500, detail="AI registry generation failed")
    created = []
    for t in ai_result.get("treatments", []):
        record = TreatmentRecord(organization_id=org_id, treatment_name=t.get("treatment_name", ""),
                                  purpose=t.get("purpose", ""), legal_basis=t.get("legal_basis", "legitimate_interest"),
                                  data_categories=t.get("data_categories", []), data_subjects=t.get("data_subjects", []),
                                  recipients=t.get("recipients"), retention_period=t.get("retention_period"),
                                  security_measures=t.get("security_measures"), transfers_outside_eu=t.get("transfers_outside_eu", False),
                                  is_compliant=t.get("is_compliant", False), compliance_notes=t.get("compliance_notes"), auto_generated=True)
        db.add(record)
        created.append(record)
    db.commit()
    for r in created:
        db.refresh(r)
    return created

@router.post("/registry", response_model=TreatmentRecordOut, status_code=201)
def create_treatment_manual(payload: TreatmentRecordCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = TreatmentRecord(organization_id=current_user.organization_id, auto_generated=False, **payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


# --- Compliance Score ---
@router.post("/compliance/score", response_model=ComplianceScoreOut)
async def compute_compliance_score(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org_id = current_user.organization_id
    treatments = db.query(TreatmentRecord).filter(TreatmentRecord.organization_id == org_id).all()
    findings = db.query(PersonalData).join(Scan).filter(Scan.organization_id == org_id).all()
    t_data = [{"treatment_name": t.treatment_name, "legal_basis": t.legal_basis, "is_compliant": t.is_compliant} for t in treatments]
    f_data = [{"data_category": f.data_category, "is_sensitive": f.is_sensitive, "risk_level": f.risk_level} for f in findings]
    ai_result = await ai_compute_compliance_score(t_data, f_data)
    if "error" in ai_result:
        raise HTTPException(status_code=500, detail="AI scoring failed")
    score = ComplianceScore(organization_id=org_id, overall_score=ai_result.get("overall_score", 0),
                             data_inventory_score=ai_result.get("data_inventory_score", 0),
                             legal_basis_score=ai_result.get("legal_basis_score", 0),
                             security_score=ai_result.get("security_score", 0),
                             rights_management_score=ai_result.get("rights_management_score", 0),
                             recommendations=ai_result.get("recommendations"), details=ai_result)
    db.add(score)
    db.commit()
    db.refresh(score)
    return score


# --- Dashboard ---
@router.get("/dashboard", response_model=DashboardOut)
def get_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org_id = current_user.organization_id
    latest_score = db.query(ComplianceScore).filter(ComplianceScore.organization_id == org_id).order_by(ComplianceScore.scored_at.desc()).first()
    connectors_count = db.query(Connector).filter(Connector.organization_id == org_id).count()
    scans_q = db.query(Scan).filter(Scan.organization_id == org_id)
    all_scans = scans_q.all()
    total_personal = sum(s.personal_data_found or 0 for s in all_scans)
    total_sensitive = sum(s.sensitive_data_found or 0 for s in all_scans)
    active_alerts = db.query(Alert).filter(Alert.organization_id == org_id, Alert.is_resolved == False).count()
    treatments_count = db.query(TreatmentRecord).filter(TreatmentRecord.organization_id == org_id).count()
    recent = scans_q.order_by(Scan.created_at.desc()).limit(5).all()
    score_history = db.query(ComplianceScore).filter(ComplianceScore.organization_id == org_id).order_by(ComplianceScore.scored_at.desc()).limit(10).all()
    return DashboardOut(compliance_score=latest_score.overall_score if latest_score else 0,
                         total_connectors=connectors_count, total_scans=len(all_scans),
                         personal_data_found=total_personal, sensitive_data_found=total_sensitive,
                         active_alerts=active_alerts, treatment_records_count=treatments_count,
                         recent_scans=recent, score_history=score_history)


# --- Alerts ---
@router.get("/alerts", response_model=List[AlertOut])
def list_alerts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Alert).filter(Alert.organization_id == current_user.organization_id).order_by(Alert.created_at.desc()).all()

@router.patch("/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id, Alert.organization_id == current_user.organization_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_resolved = True
    alert.resolved_at = utc_now()
    db.commit()
    return {"status": "resolved"}
