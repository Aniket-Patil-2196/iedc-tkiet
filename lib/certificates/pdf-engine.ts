import { PDFDocument, rgb, StandardFonts, PDFFont } from "pdf-lib";
import sharp from "sharp";
import {
  ICertificateFieldConfig,
  ITemplateSnapshot,
  SupportedFontFamily,
} from "@/types/certificate";

/**
 * Converts Hex string (e.g. "#1e3a8a" or "#000") to pdf-lib rgb object (0-1 values).
 */
export function hexToRgb(hex: string) {
  let cleanHex = hex.replace("#", "").trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) {
    return rgb(0, 0, 0);
  }
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return rgb(r / 255, g / 255, b / 255);
}

/**
 * Maps SupportedFontFamily string to StandardFonts enum.
 */
function getStandardFontName(fontFamily: SupportedFontFamily): StandardFonts {
  switch (fontFamily) {
    case "HelveticaBold":
      return StandardFonts.HelveticaBold;
    case "TimesRoman":
      return StandardFonts.TimesRoman;
    case "TimesRomanBold":
      return StandardFonts.TimesRomanBold;
    case "Courier":
      return StandardFonts.Courier;
    case "CourierBold":
      return StandardFonts.CourierBold;
    case "Helvetica":
    default:
      return StandardFonts.Helvetica;
  }
}

/**
 * Cleans string for StandardFonts WinAnsi encoding.
 * Replaces non-printable or unsupported characters safely.
 */
function sanitizeForStandardFont(text: string): string {
  if (!text) return "";
  // Decompose accents e.g. é -> e
  const normalized = text.normalize("NFKD");
  // Replace characters outside basic Latin/WinAnsi range with closest ascii or remove
  return normalized.replace(/[^\x20-\x7E\xA0-\xFF]/g, "");
}

export interface ParticipantRenderData {
  participantName: string;
  certificateId: string;
  eventName: string;
  eventDate?: string;
  certificateType?: string;
  issueDate?: string;
  additionalFields?: Record<string, string>;
}

/**
 * Generates an individual personalized PDF certificate.
 */
export async function renderCertificatePdf(
  templateBuffer: Buffer,
  templateSnapshot: ITemplateSnapshot,
  data: ParticipantRenderData
): Promise<Buffer> {
  let pdfDoc: PDFDocument;
  let page: any;
  let pageWidth = templateSnapshot.pageWidth || 842;
  let pageHeight = templateSnapshot.pageHeight || 595;

  const isPdf = templateSnapshot.mimeType === "application/pdf";

  if (isPdf) {
    pdfDoc = await PDFDocument.load(templateBuffer);
    page = pdfDoc.getPages()[0];
    const size = page.getSize();
    pageWidth = size.width;
    pageHeight = size.height;
  } else {
    pdfDoc = await PDFDocument.create();

    // If WebP, convert to PNG with sharp first
    let imageBuffer = templateBuffer;
    let mime = templateSnapshot.mimeType;

    if (mime === "image/webp") {
      imageBuffer = await sharp(templateBuffer).png().toBuffer();
      mime = "image/png";
    }

    let embeddedImage: any;
    if (mime === "image/png") {
      embeddedImage = await pdfDoc.embedPng(imageBuffer);
    } else {
      embeddedImage = await pdfDoc.embedJpg(imageBuffer);
    }

    page = pdfDoc.addPage([pageWidth, pageHeight]);
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
    });
  }

  // Cache embedded fonts for efficiency
  const fontCache = new Map<SupportedFontFamily, PDFFont>();

  async function getFont(fontFamily: SupportedFontFamily): Promise<PDFFont> {
    if (fontCache.has(fontFamily)) {
      return fontCache.get(fontFamily)!;
    }
    const standardName = getStandardFontName(fontFamily);
    const font = await pdfDoc.embedFont(standardName);
    fontCache.set(fontFamily, font);
    return font;
  }

  // Render each field
  for (const field of templateSnapshot.fields || []) {
    let rawText = "";

    switch (field.fieldKey) {
      case "participantName":
        rawText = data.participantName;
        break;
      case "certificateId":
        rawText = data.certificateId;
        break;
      case "eventName":
        rawText = data.eventName;
        break;
      case "eventDate":
        rawText = data.eventDate || "";
        break;
      case "certificateType":
        rawText = data.certificateType || "";
        break;
      case "issueDate":
        rawText = data.issueDate || new Date().toLocaleDateString("en-IN");
        break;
      case "customText":
      default:
        rawText =
          data.additionalFields?.[field.id] ||
          data.additionalFields?.[field.fieldKey] ||
          field.defaultValue ||
          "";
        break;
    }

    if (!rawText) continue;

    const font = await getFont(field.fontFamily || "HelveticaBold");
    const sanitizedText = sanitizeForStandardFont(rawText);
    const textColor = hexToRgb(field.color || "#000000");

    let currentFontSize = field.fontSize || 24;
    const minFontSize = field.minFontSize || 12;
    const maxWidthPoints = field.maxWidth
      ? (field.maxWidth / 100) * pageWidth
      : pageWidth * 0.8;

    // Shrink-to-fit calculation
    let textWidth = font.widthOfTextAtSize(sanitizedText, currentFontSize);
    if (textWidth > maxWidthPoints && currentFontSize > minFontSize) {
      const scale = maxWidthPoints / textWidth;
      currentFontSize = Math.max(minFontSize, Math.floor(currentFontSize * scale));
      textWidth = font.widthOfTextAtSize(sanitizedText, currentFontSize);
    }

    // Convert normalized browser coordinates (% from left and top) to PDF coordinates (points from left and bottom)
    const anchorX = (field.x / 100) * pageWidth;
    const anchorYFromTop = (field.y / 100) * pageHeight;
    const anchorYPdf = pageHeight - anchorYFromTop;

    let drawX = anchorX;
    if (field.alignment === "center") {
      drawX = anchorX - textWidth / 2;
    } else if (field.alignment === "right") {
      drawX = anchorX - textWidth;
    }

    // Baseline adjustment so text vertically centers at anchor point
    const drawY = anchorYPdf - currentFontSize * 0.35;

    page.drawText(sanitizedText, {
      x: drawX,
      y: drawY,
      size: currentFontSize,
      font,
      color: textColor,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Generate a unique collision-resistant certificate ID.
 * Example: IEDC-TKIET-2026-A1B2C3D4
 */
export function generateCertificateId(eventYear?: number | string): string {
  const year = eventYear || new Date().getFullYear();
  const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `IEDC-TKIET-${year}-${randomPart}`;
}
