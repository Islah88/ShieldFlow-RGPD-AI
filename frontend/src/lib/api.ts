/**
 * ShieldFlow — API Client
 * Wrapper fetch léger avec gestion JWT automatique.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

class ApiClient {
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("shieldflow_token");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("shieldflow_token");
        localStorage.removeItem("shieldflow_user");
        window.location.href = "/login";
      }
      throw new Error("Non autorisé");
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Erreur serveur" }));
      throw new Error(error.detail || `Erreur ${res.status}`);
    }

    return res.json();
  }

  // --- Auth ---
  async login(email: string, password: string) {
    const data = await this.request<{
      access_token: string;
      user_id: string;
      organization_id: string | null;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem("shieldflow_token", data.access_token);
    localStorage.setItem("shieldflow_user", JSON.stringify(data));
    return data;
  }

  async getMe() {
    return this.request<{
      id: string;
      email: string;
      full_name: string | null;
      role: string;
      organization_id: string | null;
    }>("/auth/me");
  }

  // --- Dashboard ---
  async getDashboard() {
    return this.request<{
      compliance_score: number;
      total_connectors: number;
      total_scans: number;
      personal_data_found: number;
      sensitive_data_found: number;
      active_alerts: number;
      treatment_records_count: number;
      recent_scans: Scan[];
      score_history: ComplianceScore[];
    }>("/dashboard");
  }

  // --- Connectors ---
  async getConnectors() {
    return this.request<Connector[]>("/connectors");
  }

  async createConnector(name: string, connector_type: string) {
    return this.request<Connector>("/connectors", {
      method: "POST",
      body: JSON.stringify({ name, connector_type }),
    });
  }

  // --- Scans ---
  async getScans() {
    return this.request<Scan[]>("/scans");
  }

  async getScanDetail(scanId: string) {
    return this.request<ScanDetail>(`/scans/${scanId}`);
  }

  async uploadCSV(connectorId: string, file: File) {
    const token = this.getToken();
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(
      `${API_BASE}/connectors/${connectorId}/upload-csv`,
      {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      }
    );

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Upload échoué" }));
      throw new Error(error.detail || "Erreur upload");
    }
    return res.json() as Promise<Scan>;
  }

  // --- Registry ---
  async getRegistry() {
    return this.request<TreatmentRecord[]>("/registry");
  }

  async generateRegistry() {
    return this.request<TreatmentRecord[]>("/registry/generate", {
      method: "POST",
    });
  }

  async createTreatment(data: TreatmentRecordCreate) {
    return this.request<TreatmentRecord>("/registry", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // --- Compliance ---
  async computeScore() {
    return this.request<ComplianceScore>("/compliance/score", {
      method: "POST",
    });
  }

  // --- Alerts ---
  async getAlerts() {
    return this.request<Alert[]>("/alerts");
  }

  async resolveAlert(alertId: string) {
    return this.request<{ status: string }>(`/alerts/${alertId}/resolve`, {
      method: "PATCH",
    });
  }
}

// --- Types ---
export interface Connector {
  id: string;
  name: string;
  connector_type: string;
  status: string;
  last_scan_at: string | null;
  created_at: string;
}

export interface Scan {
  id: string;
  connector_id: string;
  status: string;
  total_records_scanned: number;
  personal_data_found: number;
  sensitive_data_found: number;
  risk_level: string | null;
  scan_duration_seconds: number | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface PersonalDataFinding {
  id: string;
  data_category: string;
  data_type: string;
  is_sensitive: boolean;
  source_location: string | null;
  occurrences: number;
  risk_level: string;
  recommendation: string | null;
}

export interface ScanDetail extends Scan {
  findings: PersonalDataFinding[];
}

export interface TreatmentRecord {
  id: string;
  treatment_name: string;
  purpose: string;
  legal_basis: string;
  data_categories: string[];
  data_subjects: string[];
  recipients: string[] | null;
  retention_period: string | null;
  security_measures: string[] | null;
  transfers_outside_eu: boolean;
  is_compliant: boolean;
  compliance_notes: string | null;
  auto_generated: boolean;
  created_at: string;
}

export interface TreatmentRecordCreate {
  treatment_name: string;
  purpose: string;
  legal_basis: string;
  data_categories: string[];
  data_subjects: string[];
  recipients?: string[];
  retention_period?: string;
  security_measures?: string[];
  transfers_outside_eu?: boolean;
}

export interface ComplianceScore {
  id: string;
  overall_score: number;
  data_inventory_score: number;
  legal_basis_score: number;
  security_score: number;
  rights_management_score: number;
  recommendations: string[] | null;
  scored_at: string;
}

export interface Alert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  is_resolved: boolean;
  created_at: string;
}

export const api = new ApiClient();
