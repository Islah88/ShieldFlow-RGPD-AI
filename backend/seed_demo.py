"""ShieldFlow — Demo Data Seeder."""

from app.database import SessionLocal, init_db
from app.models import Organization, User, Connector, Scan, PersonalData, TreatmentRecord, ComplianceScore, Alert
from app.core import hash_password
from app.models import utc_now
from datetime import timedelta


def seed():
    init_db()
    db = SessionLocal()

    # Check if already seeded
    if db.query(User).first():
        print("⏭️  Database already seeded. Skipping.")
        db.close()
        return

    print("🌱 Seeding ShieldFlow demo data...")

    # --- Organization ---
    org = Organization(
        name="Cabinet Dupont & Associés",
        siren="123456789",
        sector="juridique",
        employee_count=25,
        plan_type="starter",
    )
    db.add(org)
    db.flush()

    # --- User ---
    user = User(
        email="admin@shieldflow.demo",
        hashed_password=hash_password("demo2026"),
        full_name="Marie Dupont",
        role="admin",
        organization_id=org.id,
    )
    db.add(user)
    db.flush()

    # --- Connectors ---
    csv_conn = Connector(
        organization_id=org.id,
        name="Export CRM Clients",
        connector_type="csv",
        status="active",
        last_scan_at=utc_now(),
    )
    csv_conn2 = Connector(
        organization_id=org.id,
        name="Base Employés RH",
        connector_type="csv",
        status="active",
    )
    db.add_all([csv_conn, csv_conn2])
    db.flush()

    # --- Scan with findings ---
    scan = Scan(
        organization_id=org.id,
        connector_id=csv_conn.id,
        status="completed",
        total_records_scanned=1247,
        personal_data_found=8,
        sensitive_data_found=2,
        risk_level="high",
        scan_duration_seconds=12.4,
        started_at=utc_now() - timedelta(hours=2),
        completed_at=utc_now() - timedelta(hours=2, seconds=-12),
    )
    db.add(scan)
    db.flush()

    findings = [
        PersonalData(scan_id=scan.id, data_category="name", data_type="full_name", is_sensitive=False,
                      source_location="colonne: nom_complet", occurrences=1247, risk_level="low",
                      recommendation="Donnée standard, vérifiez la base légale du traitement."),
        PersonalData(scan_id=scan.id, data_category="email", data_type="email_address", is_sensitive=False,
                      source_location="colonne: email", occurrences=1247, risk_level="medium",
                      recommendation="Assurez-vous d'avoir le consentement pour l'envoi d'emails marketing."),
        PersonalData(scan_id=scan.id, data_category="phone", data_type="mobile_phone", is_sensitive=False,
                      source_location="colonne: telephone", occurrences=892, risk_level="medium",
                      recommendation="Vérifiez la finalité de la collecte du numéro de téléphone."),
        PersonalData(scan_id=scan.id, data_category="address", data_type="postal_address", is_sensitive=False,
                      source_location="colonne: adresse_postale", occurrences=1103, risk_level="medium",
                      recommendation="Adresse postale = donnée personnelle. Durée de conservation à vérifier."),
        PersonalData(scan_id=scan.id, data_category="financial", data_type="iban", is_sensitive=False,
                      source_location="colonne: iban_client", occurrences=456, risk_level="high",
                      recommendation="⚠️ Données bancaires détectées. Chiffrement obligatoire et accès restreint."),
        PersonalData(scan_id=scan.id, data_category="national_id", data_type="numero_securite_sociale", is_sensitive=True,
                      source_location="colonne: nss", occurrences=25, risk_level="critical",
                      recommendation="🔴 DONNÉE SENSIBLE. Le N° SS est une donnée hautement réglementée. Vérifiez si sa collecte est légalement justifiée."),
        PersonalData(scan_id=scan.id, data_category="health", data_type="medical_condition", is_sensitive=True,
                      source_location="colonne: notes_dossier", occurrences=12, risk_level="critical",
                      recommendation="🔴 DONNÉE DE SANTÉ (Art. 9 RGPD). Traitement interdit sauf exceptions strictes. DPIA obligatoire."),
        PersonalData(scan_id=scan.id, data_category="date_of_birth", data_type="birth_date", is_sensitive=False,
                      source_location="colonne: date_naissance", occurrences=1247, risk_level="low",
                      recommendation="Vérifiez la nécessité de collecter la date de naissance."),
    ]
    db.add_all(findings)

    # --- Treatment Records ---
    treatments = [
        TreatmentRecord(
            organization_id=org.id, treatment_name="Gestion de la relation client",
            purpose="Suivi des dossiers clients, facturation et communication",
            legal_basis="contract", data_categories=["name", "email", "phone", "address"],
            data_subjects=["clients"], recipients=["service_juridique", "comptabilité"],
            retention_period="5 ans après clôture du dossier",
            security_measures=["access_control", "backup"], is_compliant=True,
            compliance_notes="Traitement conforme. Base légale valide (exécution du contrat).",
        ),
        TreatmentRecord(
            organization_id=org.id, treatment_name="Gestion des ressources humaines",
            purpose="Paie, gestion administrative des employés",
            legal_basis="legal_obligation", data_categories=["name", "national_id", "financial", "health"],
            data_subjects=["employees"], recipients=["rh", "cabinet_comptable_externe"],
            retention_period="5 ans après départ du salarié",
            security_measures=["encryption", "access_control", "audit_log"],
            is_compliant=False,
            compliance_notes="⚠️ Données de santé dans les notes de dossier sans base légale claire. DPIA recommandé.",
        ),
    ]
    db.add_all(treatments)

    # --- Compliance Score ---
    score = ComplianceScore(
        organization_id=org.id, overall_score=62,
        data_inventory_score=75, legal_basis_score=50,
        security_score=55, rights_management_score=40,
        recommendations=[
            "Mettre en place un registre complet des traitements",
            "Chiffrer les données bancaires (IBAN)",
            "Supprimer ou justifier la collecte du N° SS",
            "Implémenter une procédure de réponse aux demandes de droits",
            "Réaliser un DPIA pour le traitement des données de santé",
        ],
    )
    db.add(score)

    # --- Alerts ---
    alerts = [
        Alert(organization_id=org.id, alert_type="sensitive_data_exposed", severity="critical",
              title="Données de santé non protégées", source_scan_id=scan.id,
              description="Des données médicales ont été détectées dans les notes de dossier sans chiffrement ni restriction d'accès."),
        Alert(organization_id=org.id, alert_type="missing_legal_basis", severity="high",
              title="N° Sécurité Sociale sans justification",  source_scan_id=scan.id,
              description="Le numéro de sécurité sociale est collecté sans base légale claire identifiée."),
        Alert(organization_id=org.id, alert_type="new_personal_data", severity="medium",
              title="Données bancaires (IBAN) détectées", source_scan_id=scan.id,
              description="456 enregistrements contiennent des IBAN. Vérifiez le chiffrement et les accès."),
    ]
    db.add_all(alerts)

    db.commit()
    print("✅ ShieldFlow demo data seeded successfully!")
    print(f"   📧 Login: admin@shieldflow.demo / demo2026")
    db.close()


if __name__ == "__main__":
    seed()
