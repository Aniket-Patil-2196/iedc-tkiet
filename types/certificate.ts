export type CertificateFieldType =
  | "participantName"
  | "eventName"
  | "eventDate"
  | "certificateId"
  | "certificateType"
  | "issueDate"
  | "customText";

export type SupportedFontFamily =
  | "Helvetica"
  | "HelveticaBold"
  | "TimesRoman"
  | "TimesRomanBold"
  | "Courier"
  | "CourierBold";

export type TextAlignment = "left" | "center" | "right";

export interface ICertificateFieldConfig {
  id: string;
  fieldKey: CertificateFieldType;
  label: string;
  x: number; // 0 to 100 (% of page width from left)
  y: number; // 0 to 100 (% of page height from top)
  fontSize: number; // font size in points (e.g. 24)
  fontFamily: SupportedFontFamily;
  color: string; // Hex color e.g. "#111827"
  alignment: TextAlignment;
  maxWidth?: number; // max width % (e.g. 80)
  minFontSize?: number; // min font size if shrinking
  defaultValue?: string; // fallback or sample text
}

export interface ITemplateSnapshot {
  templateId?: string;
  fileReference: string; // Storage reference ID
  fileName: string;
  mimeType: "application/pdf" | "image/png" | "image/jpeg" | "image/webp";
  pageWidth: number; // in PDF points (e.g. 842 for A4 landscape)
  pageHeight: number; // in PDF points (e.g. 595 for A4 landscape)
  orientation: "landscape" | "portrait";
  fields: ICertificateFieldConfig[];
}

export type CertificateBatchStatus =
  | "draft"
  | "ready"
  | "generating"
  | "generated"
  | "sending"
  | "completed"
  | "failed"
  | "cancelled";

export type RecipientGenerationStatus =
  | "pending"
  | "generating"
  | "generated"
  | "failed";

export type RecipientEmailStatus =
  | "pending"
  | "sending"
  | "sent"
  | "failed"
  | "cancelled";

export interface ICertificateBatch {
  _id: string;
  batchName: string;
  eventId?: string;
  eventName: string;
  eventDate?: string;
  certificateType?: string;
  templateSnapshot: ITemplateSnapshot;
  status: CertificateBatchStatus;
  totalParticipants: number;
  validParticipants: number;
  invalidParticipants: number;
  generationCounts: {
    total: number;
    generated: number;
    failed: number;
  };
  emailCounts: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
  };
  emailSubject: string;
  emailBody: string;
  createdBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  completedAt?: string | Date;
}

export interface ICertificateRecipient {
  _id: string;
  batchId: string;
  sourceRowNumber: number;
  participantName: string;
  email: string;
  certificateId: string;
  certificateType?: string;
  additionalFields?: Record<string, string>;
  generationStatus: RecipientGenerationStatus;
  generationError?: string;
  certificateFileReference?: string;
  emailStatus: RecipientEmailStatus;
  emailAttempts: number;
  lastEmailAttemptAt?: string | Date;
  lastEmailError?: string;
  sentAt?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ICertificateEmailAttempt {
  _id: string;
  recipientId: string;
  batchId: string;
  attemptNumber: number;
  attemptedAt: string | Date;
  status: "sent" | "failed";
  providerMessageId?: string;
  errorCategory?: "transient" | "permanent" | "config";
  errorMessage?: string;
  createdAt?: string | Date;
}

export interface SpreadsheetParsedRow {
  rowNumber: number;
  data: Record<string, any>;
  mappedName?: string;
  mappedEmail?: string;
  mappedType?: string;
  isValid: boolean;
  errors: string[];
  isDuplicate?: boolean;
}

export interface SpreadsheetValidationReport {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  rows: SpreadsheetParsedRow[];
  sheetNames: string[];
  detectedColumns: string[];
}
