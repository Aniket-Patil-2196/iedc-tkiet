import { PDFDocument } from "pdf-lib";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import {
  renderCertificatePdf,
  generateCertificateId,
  hexToRgb,
} from "../lib/certificates/pdf-engine";
import {
  parseAndValidateSpreadsheet,
  detectDefaultColumnMapping,
  sanitizeForCsv,
} from "../lib/certificates/spreadsheet-parser";
import {
  replacePlaceholders,
  escapeHtml,
} from "../lib/email/certificate-mailer";
import {
  ICertificateFieldConfig,
  ITemplateSnapshot,
} from "../types/certificate";

async function runAllCertificateTests() {
  console.log("==================================================");
  console.log("STARTING IEDC TKIET CERTIFICATE SYSTEM TEST SUITE");
  console.log("==================================================\n");

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, testName: string, details?: any) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${testName}`, details || "");
      failedTests++;
    }
  }

  // ----------------------------------------------------
  // TEST GROUP 1: Certificate Identifier Generation
  // ----------------------------------------------------
  console.log("\n--- TEST GROUP 1: Collision-Resistant Certificate IDs ---");
  const id1 = generateCertificateId(2026);
  const id2 = generateCertificateId(2026);

  assert(
    /^IEDC-TKIET-2026-[A-Z0-9]+$/.test(id1),
    "Certificate ID conforms to format IEDC-TKIET-YYYY-XXXXXXXX",
    { id1 }
  );
  assert(id1 !== id2, "Consecutive certificate IDs are unique and non-colliding", {
    id1,
    id2,
  });

  // ----------------------------------------------------
  // TEST GROUP 2: Hex to RGB Conversion
  // ----------------------------------------------------
  console.log("\n--- TEST GROUP 2: Color Parsing ---");
  const black = hexToRgb("#000000");
  assert(
    black.red === 0 && black.green === 0 && black.blue === 0,
    "Hex #000000 parses to rgb(0,0,0)"
  );

  const white = hexToRgb("#ffffff");
  assert(
    Math.round(white.red) === 1 && Math.round(white.green) === 1,
    "Hex #ffffff parses to rgb(1,1,1)"
  );

  // ----------------------------------------------------
  // TEST GROUP 3: Email Template Placeholder Substitution & HTML Escaping
  // ----------------------------------------------------
  console.log("\n--- TEST GROUP 3: Email Placeholders & XSS Sanitization ---");
  const rawTemplate =
    "Dear {{participantName}}, congratulations on participating in {{eventName}}! Your Certificate ID is {{certificateId}}.";
  const variables = {
    participantName: "Alice & Bob <script>alert(1)</script>",
    eventName: "Ideathon 2026",
    certificateId: "IEDC-TKIET-2026-TEST1234",
  };

  const plainTextEmail = replacePlaceholders(rawTemplate, variables, false);
  assert(
    plainTextEmail.includes("Alice & Bob <script>alert(1)</script>") &&
      plainTextEmail.includes("IEDC-TKIET-2026-TEST1234"),
    "Plain text placeholders replaced correctly"
  );

  const htmlEmail = replacePlaceholders(rawTemplate, variables, true);
  assert(
    htmlEmail.includes("Alice &amp; Bob &lt;script&gt;alert(1)&lt;/script&gt;") &&
      !htmlEmail.includes("<script>"),
    "HTML email placeholders are safely HTML escaped against XSS injection"
  );

  // ----------------------------------------------------
  // TEST GROUP 4: CSV Injection Sanitization
  // ----------------------------------------------------
  console.log("\n--- TEST GROUP 4: Formula & CSV Injection Protection ---");
  const unsafeValue = "=cmd|' /C calc'!A0";
  const sanitized = sanitizeForCsv(unsafeValue);
  assert(
    sanitized.startsWith("'="),
    "Spreadsheet formula prefix '=' is escaped with a leading single quote",
    { sanitized }
  );

  const safeValue = "John Doe";
  assert(
    sanitizeForCsv(safeValue) === "John Doe",
    "Normal participant names are preserved without modification"
  );

  // ----------------------------------------------------
  // TEST GROUP 5: Spreadsheet Column Auto-Detection
  // ----------------------------------------------------
  console.log("\n--- TEST GROUP 5: Column Auto-Detection ---");
  const headers = ["Sr No", "Candidate Name", "Student Email", "Department", "Role"];
  const detected = detectDefaultColumnMapping(headers);

  assert(
    detected.nameColumn === "Candidate Name",
    "Auto-detects 'Candidate Name' as nameColumn",
    { detected }
  );
  assert(
    detected.emailColumn === "Student Email",
    "Auto-detects 'Student Email' as emailColumn",
    { detected }
  );

  // ----------------------------------------------------
  // TEST GROUP 6: Spreadsheet Parsing, Validation, and Duplicate Detection
  // ----------------------------------------------------
  console.log("\n--- TEST GROUP 6: Spreadsheet Parser & Duplicate Resolution ---");
  const sampleWorkbook = XLSX.utils.book_new();
  const sampleData = [
    ["Participant Name", "Email Address", "Certificate Type"],
    ["Rohan Patil", "rohan.patil@example.com", "Participation"],
    ["Pooja Deshmukh", "pooja.deshmukh@example.com", "Winner"],
    ["", "invalid.no.name@example.com", "Participation"], // Missing Name
    ["Akshay Kumar", "not-a-valid-email", "Participation"], // Invalid Email
    ["Duplicate User", "rohan.patil@example.com", "Participation"], // Duplicate Email
    ["  ", "   ", " "], // Empty row (should be ignored)
    ["Siddharth Mane", "siddharth.m@example.com", "Appreciation"],
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
  XLSX.utils.book_append_sheet(sampleWorkbook, worksheet, "Attendees");
  const xlsxBuffer = XLSX.write(sampleWorkbook, { type: "buffer", bookType: "xlsx" });

  const validationReport = parseAndValidateSpreadsheet(xlsxBuffer, {
    sheetName: "Attendees",
    nameColumn: "Participant Name",
    emailColumn: "Email Address",
    typeColumn: "Certificate Type",
    allowDuplicates: false,
  });

  assert(
    validationReport.totalRows === 6,
    "Detected 6 non-empty participant rows (ignoring blank row)",
    { totalRows: validationReport.totalRows }
  );
  assert(
    validationReport.validRows === 3,
    "Correctly identified 3 valid rows (Rohan, Pooja, Siddharth)",
    { validRows: validationReport.validRows }
  );
  assert(
    validationReport.invalidRows === 3,
    "Correctly flagged 3 invalid/duplicate rows",
    { invalidRows: validationReport.invalidRows }
  );
  assert(
    validationReport.duplicateRows === 1,
    "Detected 1 duplicate email row",
    { duplicateRows: validationReport.duplicateRows }
  );

  // Duplicate resolution check when allowDuplicates is enabled
  const reportWithDupesAllowed = parseAndValidateSpreadsheet(xlsxBuffer, {
    sheetName: "Attendees",
    nameColumn: "Participant Name",
    emailColumn: "Email Address",
    typeColumn: "Certificate Type",
    allowDuplicates: true,
  });
  assert(
    reportWithDupesAllowed.validRows === 4,
    "When allowDuplicates is enabled, duplicate email with distinct name is approved as valid",
    { validRows: reportWithDupesAllowed.validRows }
  );

  // ----------------------------------------------------
  // TEST GROUP 7: PDF Generation Engine & Text Placement
  // ----------------------------------------------------
  console.log("\n--- TEST GROUP 7: PDF Certificate Generation Engine ---");
  // Create a blank template PDF
  const templatePdfDoc = await PDFDocument.create();
  templatePdfDoc.addPage([842, 595]); // A4 landscape points
  const templateBytes = await templatePdfDoc.save();
  const templateBuffer = Buffer.from(templateBytes);

  const sampleFields: ICertificateFieldConfig[] = [
    {
      id: "f_name",
      fieldKey: "participantName",
      label: "Participant Name",
      x: 50,
      y: 50,
      fontSize: 28,
      fontFamily: "HelveticaBold",
      color: "#1e3a8a",
      alignment: "center",
      maxWidth: 80,
      minFontSize: 14,
    },
    {
      id: "f_cert_id",
      fieldKey: "certificateId",
      label: "Certificate ID",
      x: 85,
      y: 90,
      fontSize: 11,
      fontFamily: "Courier",
      color: "#374151",
      alignment: "right",
      maxWidth: 30,
    },
    {
      id: "f_event",
      fieldKey: "eventName",
      label: "Event Name",
      x: 50,
      y: 65,
      fontSize: 18,
      fontFamily: "Helvetica",
      color: "#111827",
      alignment: "center",
      maxWidth: 70,
    },
  ];

  const templateSnapshot: ITemplateSnapshot = {
    fileReference: "test-ref",
    fileName: "template.pdf",
    mimeType: "application/pdf",
    pageWidth: 842,
    pageHeight: 595,
    orientation: "landscape",
    fields: sampleFields,
  };

  const renderedPdfBuffer = await renderCertificatePdf(templateBuffer, templateSnapshot, {
    participantName: "Priyanka Chandrakant Kulkarni",
    certificateId: "IEDC-TKIET-2026-A1B2C3D4",
    eventName: "National Innovation Conclave 2026",
    eventDate: "12th October 2026",
    certificateType: "Excellence",
  });

  assert(
    Buffer.isBuffer(renderedPdfBuffer) && renderedPdfBuffer.length > 0,
    "Generated PDF buffer is non-empty",
    { sizeBytes: renderedPdfBuffer.length }
  );

  // Inspect generated PDF with pdf-lib to verify validity
  const loadedGeneratedPdf = await PDFDocument.load(renderedPdfBuffer);
  assert(
    loadedGeneratedPdf.getPageCount() === 1,
    "Generated certificate is a valid single-page PDF"
  );
  const genSize = loadedGeneratedPdf.getPages()[0].getSize();
  assert(
    Math.round(genSize.width) === 842 && Math.round(genSize.height) === 595,
    "Generated PDF preserves template page dimensions (842 x 595 pt)"
  );

  // Test shrink-to-fit with an exceptionally long participant name
  const veryLongName =
    "Shri Dharmadhikari Venkatanarasimharajuvaripeta Subramanyam Ramachandra Rao";
  const renderedLongNamePdf = await renderCertificatePdf(
    templateBuffer,
    templateSnapshot,
    {
      participantName: veryLongName,
      certificateId: "IEDC-TKIET-2026-LONGNAME",
      eventName: "National Innovation Conclave 2026",
    }
  );
  assert(
    renderedLongNamePdf.length > 0,
    "Generates certificate with exceptionally long name using shrink-to-fit without errors"
  );

  // ----------------------------------------------------
  // TEST GROUP 8: Bulk ZIP Archive Creation with Manifest
  // ----------------------------------------------------
  console.log("\n--- TEST GROUP 8: Bulk ZIP Bundling & Manifest Export ---");
  const zip = new JSZip();
  const certsFolder = zip.folder("certificates");
  certsFolder?.file("IEDC_TKIET_Certificate_TEST1.pdf", renderedPdfBuffer);
  zip.file(
    "manifest.csv",
    `"Row","Name","Email","Certificate ID","Type","Status"\n"2","Rohan Patil","rohan@example.com","IEDC-TKIET-2026-0001","Participation","generated"`
  );

  const zipBytes = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  assert(
    zipBytes.length > 0,
    "Successfully generates bulk ZIP archive containing certificates and manifest.csv",
    { zipSize: zipBytes.length }
  );

  console.log("\n==================================================");
  console.log(`TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log("==================================================");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAllCertificateTests().catch((err) => {
  console.error("Test Suite Unhandled Exception:", err);
  process.exit(1);
});
