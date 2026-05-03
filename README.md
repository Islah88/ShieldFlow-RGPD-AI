# 🛡️ ShieldFlow — Conformité RGPD Automatisée par IA

<div align="center">

![ShieldFlow](https://img.shields.io/badge/ShieldFlow-RGPD%20AI-00b4d8?style=for-the-badge&logo=shield&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.13-3776ab?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285f4?style=flat-square&logo=google&logoColor=white)

**Plateforme SaaS qui scanne automatiquement les données d'entreprise,
détecte les données personnelles sensibles, et génère le registre
des traitements conforme au RGPD — propulsé par Google Gemini AI.**

</div>

---

## 🎬 Démo

![ShieldFlow Démo](https://raw.githubusercontent.com/Islah88/Islah88.github.io/main/images/demo-shieldflow.gif)
> 📸 *Démonstration en direct de l'agent IA en pleine action !*

## ✨ Fonctionnalités

| Fonctionnalité | Description |
|----------------|-------------|
| 🔍 **Scan Automatique** | Upload CSV ou connexion à une base de données, détection IA des données personnelles |
| 📊 **Score de Conformité** | Jauge temps réel 0-100 avec décomposition par critère (inventaire, base légale, sécurité, droits) |
| 📋 **Registre Art. 30** | Génération automatique des fiches de traitement réglementaires par IA |
| ⚠️ **Alertes Intelligentes** | Recommandations correctives avec priorisation par niveau de risque |
| 🤖 **Agent IA Gemini** | Analyse contextuelle, catégorisation de sensibilité, suggestions de mise en conformité |

## 🏗️ Architecture

```
┌──────────────┐     API REST      ┌──────────────┐      SQL       ┌──────────┐
│   Frontend   │ ◄──── JSON ────► │   Backend    │ ◄──────────► │  SQLite  │
│  Next.js 16  │    Port 3001     │   FastAPI    │   Port 8001   │  WAL DB  │
│  React 19    │                  │   Python     │               │          │
│  Tailwind v4 │                  │   JWT Auth   │───► Gemini AI │          │
└──────────────┘                  └──────────────┘               └──────────┘
```

## 🛠️ Stack Technique

| Couche | Technologies |
|--------|-------------|
| **Frontend** | Next.js 16, React 19, TypeScript 5, Tailwind CSS v4, Framer Motion |
| **Backend** | Python 3.13, FastAPI, SQLAlchemy, Pydantic |
| **Base de données** | SQLite (WAL mode) |
| **IA** | Google Gemini API (analyse, scoring, génération) |
| **Auth** | JWT (JSON Web Tokens) + bcrypt |
| **Design** | Glassmorphism dark theme, animations SVG, responsive mobile |

## 🚀 Installation

### Prérequis
- Python 3.11+
- Node.js 18+
- Clé API Google Gemini

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Remplir avec vos clés
python -m app.seed         # Données de démo
uvicorn app.main:app --port 8001
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local  # Optionnel
npm run dev -- --port 3001
```

### Accès
- **Frontend** : http://localhost:3001
- **API Docs** : http://localhost:8001/docs
- **Identifiants démo** : `admin@shieldflow.demo` / `demo2026`

## 📸 Screenshots

<details>
<summary>Voir les screenshots</summary>

### Dashboard principal
![ShieldFlow Dashboard](https://raw.githubusercontent.com/Islah88/Islah88.github.io/main/images/shieldflow-1-dashboard.png)
Score de conformité RGPD avec jauge animée, KPIs en temps réel, scans récents et alertes actives.

### Scan & Upload
![ShieldFlow Scan & Upload](https://raw.githubusercontent.com/Islah88/Islah88.github.io/main/images/shieldflow-2-scan.png)
Zone de dépôt CSV drag & drop avec analyse IA et détection automatique des données personnelles.

### Registre Art. 30
![ShieldFlow Registre Art. 30](https://raw.githubusercontent.com/Islah88/Islah88.github.io/main/images/shieldflow-3-registre.png)
Registre des activités de traitement avec badges de conformité et génération IA.

### Alertes Intelligentes
![ShieldFlow Alertes](https://raw.githubusercontent.com/Islah88/Islah88.github.io/main/images/shieldflow-4-alertes.png)

</details>

## 📝 Structure du projet

```
shieldflow/
├── backend/
│   ├── app/
│   │   ├── main.py          # Point d'entrée FastAPI
│   │   ├── config.py        # Configuration
│   │   ├── models.py        # Modèles SQLAlchemy
│   │   ├── auth.py          # Authentification JWT
│   │   ├── database.py      # Connexion DB
│   │   ├── seed.py          # Données de démo
│   │   └── api/routes.py    # Routes API
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/             # Pages Next.js (App Router)
│   │   ├── components/      # Composants React
│   │   └── lib/             # Client API, Auth, Utilitaires
│   └── package.json
└── README.md
```

## 🔒 Sécurité

- Authentification JWT avec expiration
- Hachage bcrypt des mots de passe
- Variables d'environnement pour tous les secrets
- CORS configuré par whitelist
- Pas de données réelles dans le repository

## 👤 Auteur

**Mhoma EL ISLAH** — *Développeur SaaS IA & Expert SecDevOps*
- 🎓 Bachelor Cybersécurité — ESAIP / Le Havre
- 🎓 Master 2 MIASHS
- 💡 Passionné par la création de plateformes intelligentes (Agentic IA) et la sécurisation des infrastructures cloud.
- 🔗 [Portfolio](https://islah88.github.io) | [LinkedIn](https://linkedin.com/in/el-islah-mhoma/) | [GitHub](https://github.com/Islah88)

## 📄 Licence

Ce projet est sous licence MIT — voir le fichier [LICENSE](LICENSE) pour plus de détails.
