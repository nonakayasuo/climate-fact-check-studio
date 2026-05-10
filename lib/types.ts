export type Topic = "猛暑" | "豪雨" | "脱炭素" | "再エネ" | "原発" | "気候政策";

export type MediaType = "新聞記事" | "Web記事" | "SNS投稿" | "見出し";

export type Risk = {
  label: string;
  suggestion: string;
};

export type EvidenceSource = {
  name: string;
  owner: string;
  themes: Topic[];
  note: string;
  url: string;
};

export type AnalysisRequest = {
  title: string;
  mediaType: MediaType;
  topic: Topic;
  body: string;
};

export type CitationCandidate = {
  text: string;
  confidence: number;
  estimated: boolean;
};

export type ClaimEvidenceLink = {
  claimId: string;
  claimText: string;
  sourceId: string;
  sourceTitle: string;
  sourceOwner: string;
  sourceUrl: string;
  score: number;
  citations: CitationCandidate[];
};

export type GapAlertReason =
  | "no_source"
  | "low_confidence_only"
  | "inactive_only";

export type GapAlertSeverity = "low" | "medium" | "high";

export type GapAlert = {
  claimId: string;
  claimText: string;
  severity: GapAlertSeverity;
  priority: number;
  reason: GapAlertReason;
  guidance: string;
};

export type AnalysisResult = AnalysisRequest & {
  claims: string[];
  risks: Risk[];
  sources: EvidenceSource[];
  memo: string;
  claimEvidenceLinks?: ClaimEvidenceLink[];
  gapAlerts?: GapAlert[];
};

export type StructuredAnalysisRisk = {
  label: string;
  reason: string;
  suggestion: string;
};

export type StructuredAnalysisOutput = {
  claims: string[];
  risks: StructuredAnalysisRisk[];
  evidenceFocus: string[];
  memo: string;
};

export type AnalysisErrorCode =
  | "MISSING_API_KEY"
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "UPSTREAM_ERROR"
  | "REFUSAL"
  | "INVALID_RESPONSE";

export type AnalysisError = {
  code: AnalysisErrorCode;
  message: string;
  retryable: boolean;
  status: number;
  details?: string;
};

export type EvidenceSourceType = "url" | "pdf" | "report" | "dataset";

export type EvidenceSourceStatus = "active" | "inactive";

export type EvidenceRegistryEntry = {
  id: string;
  title: string;
  owner: string;
  url: string;
  source_type: EvidenceSourceType;
  themes: Topic[];
  note: string;
  status: EvidenceSourceStatus;
  registered_at: string;
  updated_at: string;
};

export type EvidenceRegistryInput = Omit<
  EvidenceRegistryEntry,
  "id" | "status" | "registered_at" | "updated_at"
> & {
  id?: string;
  status?: EvidenceSourceStatus;
  registered_at?: string;
  updated_at?: string;
};

export type EvidenceRegistryErrorCode =
  | "CONFIG_MISSING"
  | "DB_UNAVAILABLE"
  | "SCHEMA_MISMATCH"
  | "VALIDATION_ERROR"
  | "EVIDENCE_DUPLICATE"
  | "EVIDENCE_INVALID_URL"
  | "EVIDENCE_NOT_FOUND";

export type EvidenceRegistryApiError = {
  code: EvidenceRegistryErrorCode;
  message: string;
  retryable: boolean;
};

export type ResearchLog = {
  id: string;
  timestamp: string;
  input_text: string;
  title: string;
  media_type: MediaType;
  topic: Topic;
  claims: string[];
  ai_memo: string;
  sources: string[];
  risks: string[];
  human_rating_accuracy: number;
  human_rating_usefulness: number;
  human_rating_trust: number;
  human_revision: string;
  revision_reason: string[];
};

export type ResearchLogInput = Omit<ResearchLog, "id" | "timestamp"> & {
  id?: string;
  timestamp?: string;
};

export type ResearchLogErrorCode =
  | "CONFIG_MISSING"
  | "DB_UNAVAILABLE"
  | "SCHEMA_MISMATCH"
  | "DELETE_CONFIRMATION_REQUIRED"
  | "VALIDATION_ERROR";

export type ResearchLogApiError = {
  code: ResearchLogErrorCode;
  message: string;
  retryable: boolean;
};
