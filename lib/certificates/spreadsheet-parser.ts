import * as XLSX from "xlsx";
import {
  SpreadsheetParsedRow,
  SpreadsheetValidationReport,
} from "@/types/certificate";

/**
 * Standard email validation regex according to RFC 5322 (practical subset)
 */
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Common column name synonyms for auto-mapping
 */
const NAME_COLUMN_HINTS = [
  "name",
  "fullname",
  "full name",
  "participant name",
  "student name",
  "candidate name",
  "attendee",
  "recipient",
];

const EMAIL_COLUMN_HINTS = [
  "email",
  "email address",
  "mail",
  "e-mail",
  "student email",
  "participant email",
  "candidate email",
];

const TYPE_COLUMN_HINTS = [
  "type",
  "certificate type",
  "category",
  "participation type",
  "award",
  "role",
];

/**
 * Detects probable column match given header list
 */
export function detectDefaultColumnMapping(headers: string[]): {
  nameColumn?: string;
  emailColumn?: string;
  typeColumn?: string;
} {
  let nameColumn: string | undefined;
  let emailColumn: string | undefined;
  let typeColumn: string | undefined;

  for (const header of headers) {
    const lower = header.trim().toLowerCase();
    if (!nameColumn && NAME_COLUMN_HINTS.includes(lower)) {
      nameColumn = header;
    }
    if (!emailColumn && EMAIL_COLUMN_HINTS.includes(lower)) {
      emailColumn = header;
    }
    if (!typeColumn && TYPE_COLUMN_HINTS.includes(lower)) {
      typeColumn = header;
    }
  }

  return { nameColumn, emailColumn, typeColumn };
}

/**
 * Reads workbook sheets and headers from buffer.
 */
export function inspectSpreadsheet(buffer: Buffer): {
  sheetNames: string[];
  firstSheetHeaders: string[];
  suggestedMapping: { nameColumn?: string; emailColumn?: string; typeColumn?: string };
} {
  const workbook = XLSX.read(buffer, { type: "buffer", cellFormula: false });
  const sheetNames = workbook.SheetNames;
  if (!sheetNames || sheetNames.length === 0) {
    throw new Error("Spreadsheet contains no worksheets.");
  }

  const firstSheet = workbook.Sheets[sheetNames[0]];
  const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(firstSheet, {
    header: 1,
    defval: "",
    blankrows: false,
  });

  const headers: string[] = ((jsonRows[0] as any[]) || []).map((h) =>
    String(h || "").trim()
  ).filter(Boolean);

  const suggestedMapping = detectDefaultColumnMapping(headers);

  return {
    sheetNames,
    firstSheetHeaders: headers,
    suggestedMapping,
  };
}

export interface ColumnMappingConfig {
  sheetName?: string;
  nameColumn: string;
  emailColumn: string;
  typeColumn?: string;
  allowDuplicates?: boolean;
}

/**
 * Parses spreadsheet rows with user mapping and returns comprehensive validation report.
 */
export function parseAndValidateSpreadsheet(
  buffer: Buffer,
  mapping: ColumnMappingConfig
): SpreadsheetValidationReport {
  const workbook = XLSX.read(buffer, { type: "buffer", cellFormula: false });
  const targetSheetName = mapping.sheetName || workbook.SheetNames[0];
  const sheet = workbook.Sheets[targetSheetName];

  if (!sheet) {
    throw new Error(`Worksheet "${targetSheetName}" not found in workbook.`);
  }

  // Convert to object array
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, {
    defval: "",
    blankrows: false,
    raw: false, // Convert dates/numbers to strings
  });

  const parsedRows: SpreadsheetParsedRow[] = [];
  const seenEmails = new Map<string, number>(); // email -> first rowNumber seen

  let totalRows = 0;
  let validRows = 0;
  let invalidRows = 0;
  let duplicateRows = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const rowNumber = i + 2; // 1-indexed header is row 1
    const raw = rawRows[i];

    // Check if entire row is empty
    const allValues = Object.values(raw).map((v) => String(v).trim());
    if (allValues.every((v) => v === "")) {
      continue;
    }

    totalRows++;

    const errors: string[] = [];
    const rawName = String(raw[mapping.nameColumn] || "").trim();
    const rawEmail = String(raw[mapping.emailColumn] || "").trim().toLowerCase();
    const rawType = mapping.typeColumn
      ? String(raw[mapping.typeColumn] || "").trim()
      : undefined;

    // Validate Name
    if (!rawName) {
      errors.push("Missing participant name.");
    } else if (rawName.length < 2) {
      errors.push("Participant name is too short (min 2 characters).");
    }

    // Validate Email
    let isDuplicate = false;
    if (!rawEmail) {
      errors.push("Missing email address.");
    } else if (!EMAIL_REGEX.test(rawEmail)) {
      errors.push(`Invalid email format: "${rawEmail}".`);
    } else {
      if (seenEmails.has(rawEmail)) {
        isDuplicate = true;
        duplicateRows++;
        if (!mapping.allowDuplicates) {
          errors.push(
            `Duplicate email found (first seen at row ${seenEmails.get(rawEmail)}).`
          );
        }
      } else {
        seenEmails.set(rawEmail, rowNumber);
      }
    }

    const isValid = errors.length === 0;
    if (isValid) {
      validRows++;
    } else {
      invalidRows++;
    }

    parsedRows.push({
      rowNumber,
      data: raw,
      mappedName: rawName,
      mappedEmail: rawEmail,
      mappedType: rawType,
      isValid,
      errors,
      isDuplicate,
    });
  }

  // Extract detected headers
  const detectedColumns = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];

  return {
    totalRows,
    validRows,
    invalidRows,
    duplicateRows,
    rows: parsedRows,
    sheetNames: workbook.SheetNames,
    detectedColumns,
  };
}

/**
 * Escapes formulas in CSV export strings to prevent CSV injection
 */
export function sanitizeForCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}
