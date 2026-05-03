"""ShieldFlow — AI Client (Gemini LLM wrapper with structured output)."""

import json
from typing import Optional
from google import genai
from google.genai import types

from app.config import get_settings

settings = get_settings()

# Initialize Gemini client
_client = None


def get_ai_client() -> genai.Client:
    global _client
    if _client is None:
        if not settings.GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY is not set in .env")
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client


async def ai_classify_data(raw_data: list[dict], context: str = "") -> dict:
    """
    Classify raw data records to identify personal data categories.
    Returns structured JSON with findings.
    """
    client = get_ai_client()

    prompt = f"""Tu es un expert RGPD et Data Privacy. Analyse les données suivantes et identifie 
toutes les données à caractère personnel selon le RGPD (Règlement UE 2016/679).

CONTEXTE : {context or "Scan de données d'entreprise"}

DONNÉES À ANALYSER (échantillon) :
{json.dumps(raw_data[:50], ensure_ascii=False, indent=2)}

MISSION :
1. Identifie chaque champ contenant des données personnelles
2. Classifie selon les catégories RGPD : name, email, phone, address, date_of_birth, 
   national_id, financial, health, biometric, political, religious, sexual_orientation, 
   criminal, genetic, trade_union
3. Marque les données sensibles (Art. 9 RGPD)
4. Évalue le niveau de risque (low/medium/high/critical)
5. Propose une recommandation pour chaque finding

Réponds UNIQUEMENT en JSON valide avec cette structure :
{{
  "findings": [
    {{
      "field_name": "nom du champ",
      "data_category": "catégorie RGPD",
      "data_type": "type précis",
      "is_sensitive": false,
      "risk_level": "medium",
      "occurrences": 1,
      "recommendation": "Recommandation en français"
    }}
  ],
  "total_personal_fields": 0,
  "total_sensitive_fields": 0,
  "overall_risk": "medium",
  "summary": "Résumé en français"
}}"""

    response = client.models.generate_content(
        model=settings.AI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.1,  # Low temperature for classification accuracy
        ),
    )

    try:
        return json.loads(response.text)
    except json.JSONDecodeError:
        return {"error": "Failed to parse AI response", "raw": response.text}


async def ai_generate_registry(findings: list[dict], org_name: str) -> dict:
    """
    Generate CNIL-compliant treatment registry from scan findings.
    """
    client = get_ai_client()

    prompt = f"""Tu es un DPO (Délégué à la Protection des Données) expert. 
À partir des données personnelles identifiées ci-dessous, génère un registre des traitements 
conforme à l'Article 30 du RGPD pour l'organisation "{org_name}".

DONNÉES PERSONNELLES IDENTIFIÉES :
{json.dumps(findings, ensure_ascii=False, indent=2)}

Pour chaque traitement identifié, fournis :
- treatment_name : Nom du traitement (ex: "Gestion de la relation client")
- purpose : Finalité détaillée
- legal_basis : Base légale (consent|contract|legal_obligation|legitimate_interest|vital_interest|public_task)
- data_categories : Liste des catégories de données
- data_subjects : Liste des personnes concernées
- recipients : Destinataires des données
- retention_period : Durée de conservation recommandée
- security_measures : Mesures de sécurité recommandées
- transfers_outside_eu : Boolean
- is_compliant : Boolean (estimation)
- compliance_notes : Notes de conformité

Réponds UNIQUEMENT en JSON :
{{
  "treatments": [ ... ],
  "global_recommendations": ["..."]
}}"""

    response = client.models.generate_content(
        model=settings.AI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.2,
        ),
    )

    try:
        return json.loads(response.text)
    except json.JSONDecodeError:
        return {"error": "Failed to parse AI response", "raw": response.text}


async def ai_compute_compliance_score(treatments: list[dict], findings: list[dict]) -> dict:
    """
    Compute an overall RGPD compliance score based on treatments and findings.
    """
    client = get_ai_client()

    prompt = f"""Tu es un auditeur RGPD. Évalue la conformité RGPD de cette organisation.

REGISTRE DES TRAITEMENTS :
{json.dumps(treatments, ensure_ascii=False, indent=2)}

DONNÉES PERSONNELLES DÉTECTÉES :
{json.dumps(findings[:30], ensure_ascii=False, indent=2)}

Calcule un score de conformité sur 4 axes (0-100 chacun) :
1. data_inventory_score : Complétude de l'inventaire des données
2. legal_basis_score : Chaque traitement a-t-il une base légale valide ?
3. security_score : Les mesures de sécurité sont-elles adéquates ?
4. rights_management_score : Les droits des personnes sont-ils respectables ?

Réponds en JSON :
{{
  "overall_score": 0,
  "data_inventory_score": 0,
  "legal_basis_score": 0,
  "security_score": 0,
  "rights_management_score": 0,
  "recommendations": ["..."],
  "critical_issues": ["..."]
}}"""

    response = client.models.generate_content(
        model=settings.AI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.1,
        ),
    )

    try:
        return json.loads(response.text)
    except json.JSONDecodeError:
        return {"error": "Failed to parse AI response", "raw": response.text}
