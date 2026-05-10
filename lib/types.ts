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

export type AnalysisResult = AnalysisRequest & {
  claims: string[];
  risks: Risk[];
  sources: EvidenceSource[];
  memo: string;
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
