"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Award,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Upload,
  FileText,
  FileSpreadsheet,
  Settings,
  Eye,
  Plus,
  Trash2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Loader2,
  Check,
  Type,
  Move,
  Layers,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/Button";
import {
  ICertificateFieldConfig,
  ITemplateSnapshot,
  SupportedFontFamily,
  TextAlignment,
  CertificateFieldType,
  SpreadsheetValidationReport,
} from "@/types/certificate";

const FONT_OPTIONS: { label: string; value: SupportedFontFamily }[] = [
  { label: "Helvetica Regular", value: "Helvetica" },
  { label: "Helvetica Bold", value: "HelveticaBold" },
  { label: "Times Roman Regular", value: "TimesRoman" },
  { label: "Times Roman Bold", value: "TimesRomanBold" },
  { label: "Courier Regular", value: "Courier" },
  { label: "Courier Bold", value: "CourierBold" },
];

export default function NewCertificateBatchPage() {
  const router = useRouter();

  // Wizard Step (1 to 5)
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Batch Details
  const [batchName, setBatchName] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [certificateType, setCertificateType] = useState("Participation");
  const [emailSubject, setEmailSubject] = useState(
    "Your Certificate of Participation — {{eventName}}"
  );
  const [emailBody, setEmailBody] = useState(
    "Dear {{participantName}},\n\nThank you for participating in {{eventName}} organized by IEDC TKIET.\n\nPlease find your personalized certificate attached to this email.\n\nCertificate ID: {{certificateId}}\n\nWe appreciate your participation and look forward to seeing you at our future events.\n\nRegards,\nInnovation and Entrepreneurship Development Cell (IEDC)\nTKIET"
  );
  const [existingEvents, setExistingEvents] = useState<any[]>([]);

  // Step 2: Template Upload
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templateSnapshot, setTemplateSnapshot] = useState<ITemplateSnapshot | null>(null);
  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);
  const [templateUploadError, setTemplateUploadError] = useState<string | null>(null);
  const [saveTemplateName, setSaveTemplateName] = useState("");
  const [saveTemplateForReuse, setSaveTemplateForReuse] = useState(false);

  // Step 3: Visual Field Placement Editor
  const [fields, setFields] = useState<ICertificateFieldConfig[]>([
    {
      id: "name_field",
      fieldKey: "participantName",
      label: "Participant Name",
      x: 50,
      y: 50,
      fontSize: 32,
      fontFamily: "HelveticaBold",
      color: "#1e3a8a",
      alignment: "center",
      maxWidth: 80,
      minFontSize: 16,
      defaultValue: "Dr. Rajesh Sharma",
    },
    {
      id: "cert_id_field",
      fieldKey: "certificateId",
      label: "Certificate ID",
      x: 85,
      y: 92,
      fontSize: 12,
      fontFamily: "Courier",
      color: "#4b5563",
      alignment: "right",
      maxWidth: 40,
      minFontSize: 9,
      defaultValue: "IEDC-TKIET-2026-X8Y9Z0A1",
    },
  ]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>("name_field");
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Step 4: Participant Spreadsheet Import
  const [spreadsheetFile, setSpreadsheetFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [sampleRows, setSampleRows] = useState<any[]>([]);
  const [nameColumn, setNameColumn] = useState<string>("");
  const [emailColumn, setEmailColumn] = useState<string>("");
  const [typeColumn, setTypeColumn] = useState<string>("");
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [isInspectingSheet, setIsInspectingSheet] = useState(false);
  const [isValidatingData, setIsValidatingData] = useState(false);
  const [validationReport, setValidationReport] = useState<SpreadsheetValidationReport | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);

  // Step 5: Submitting
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load existing events and saved templates on mount
  useEffect(() => {
    fetch("/api/admin/events")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.events) {
          setExistingEvents(data.events);
        }
      })
      .catch(() => {});

    fetch("/api/admin/certificates/templates")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.templates) {
          setSavedTemplates(data.templates);
        }
      })
      .catch(() => {});
  }, []);

  // When an event is selected from dropdown
  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    const ev = existingEvents.find((e) => e._id === eventId);
    if (ev) {
      setEventName(ev.title);
      if (ev.startDate) setEventDate(ev.startDate);
      if (!batchName) setBatchName(`${ev.title} Certificates`);
    }
  };

  // Upload template file to server
  const handleTemplateUpload = async (file: File) => {
    setTemplateFile(file);
    setIsUploadingTemplate(true);
    setTemplateUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/certificates/templates/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload template file");
      }

      const snapshot: ITemplateSnapshot = {
        fileReference: data.fileReference,
        fileName: data.fileName,
        mimeType: data.mimeType,
        pageWidth: data.pageWidth,
        pageHeight: data.pageHeight,
        orientation: data.orientation,
        fields,
      };

      setTemplateSnapshot(snapshot);
    } catch (err: any) {
      setTemplateUploadError(err.message || "Failed to process template");
    } finally {
      setIsUploadingTemplate(false);
    }
  };

  // Select an already saved template
  const handleSelectSavedTemplate = (tmpl: any) => {
    const snapshot: ITemplateSnapshot = {
      templateId: tmpl._id,
      fileReference: tmpl.fileReference,
      fileName: tmpl.fileName,
      mimeType: tmpl.mimeType,
      pageWidth: tmpl.pageWidth,
      pageHeight: tmpl.pageHeight,
      orientation: tmpl.orientation,
      fields: tmpl.fields,
    };
    setTemplateSnapshot(snapshot);
    if (tmpl.fields && tmpl.fields.length > 0) {
      setFields(tmpl.fields);
    }
  };

  // Visual Editor Field Positioning
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasContainerRef.current) return;
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xPercent = Math.max(0, Math.min(100, Math.round((clickX / rect.width) * 100)));
    const yPercent = Math.max(0, Math.min(100, Math.round((clickY / rect.height) * 100)));

    if (selectedFieldId) {
      setFields((prev) =>
        prev.map((f) => (f.id === selectedFieldId ? { ...f, x: xPercent, y: yPercent } : f))
      );
    }
  };

  const addField = (fieldKey: CertificateFieldType, label: string) => {
    const newField: ICertificateFieldConfig = {
      id: `field_${Date.now()}`,
      fieldKey,
      label,
      x: 50,
      y: 65,
      fontSize: 20,
      fontFamily: "Helvetica",
      color: "#111827",
      alignment: "center",
      maxWidth: 70,
      minFontSize: 12,
      defaultValue: label,
    };
    setFields((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
  };

  const removeField = (id: string) => {
    if (fields.find((f) => f.id === id)?.fieldKey === "participantName") {
      alert("The Participant Name field is required and cannot be removed.");
      return;
    }
    setFields((prev) => prev.filter((f) => f.id !== id));
    if (selectedFieldId === id) {
      setSelectedFieldId(fields[0]?.id || "");
    }
  };

  const updateSelectedField = (props: Partial<ICertificateFieldConfig>) => {
    setFields((prev) =>
      prev.map((f) => (f.id === selectedFieldId ? { ...f, ...props } : f))
    );
  };

  // Inspect spreadsheet headers
  const handleSpreadsheetSelect = async (file: File) => {
    setSpreadsheetFile(file);
    setIsInspectingSheet(true);
    setSheetError(null);
    setValidationReport(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/certificates/batches/inspect-spreadsheet", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to inspect spreadsheet file");
      }

      setSheetNames(data.sheetNames || []);
      setSelectedSheet(data.sheetNames?.[0] || "");
      setDetectedColumns(data.headers || []);
      setSampleRows(data.sampleRows || []);

      if (data.suggestedMapping) {
        if (data.suggestedMapping.nameColumn) setNameColumn(data.suggestedMapping.nameColumn);
        if (data.suggestedMapping.emailColumn) setEmailColumn(data.suggestedMapping.emailColumn);
        if (data.suggestedMapping.typeColumn) setTypeColumn(data.suggestedMapping.typeColumn);
      }
    } catch (err: any) {
      setSheetError(err.message || "Failed to read spreadsheet");
    } finally {
      setIsInspectingSheet(false);
    }
  };

  // Run dry-run validation on mapped columns
  const handleValidateSpreadsheet = async () => {
    if (!spreadsheetFile || !nameColumn || !emailColumn) return;
    setIsValidatingData(true);
    setSheetError(null);

    const formData = new FormData();
    formData.append("file", spreadsheetFile);
    formData.append("sheetName", selectedSheet);
    formData.append("nameColumn", nameColumn);
    formData.append("emailColumn", emailColumn);
    if (typeColumn) formData.append("typeColumn", typeColumn);
    formData.append("allowDuplicates", allowDuplicates ? "true" : "false");
    formData.append("dryRun", "true");

    try {
      const res = await fetch("/api/admin/certificates/batches/validate-spreadsheet", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Spreadsheet validation failed");
      }
      setValidationReport(data.report);
    } catch (err: any) {
      setSheetError(err.message || "Failed to validate spreadsheet data");
    } finally {
      setIsValidatingData(false);
    }
  };

  // Final Step: Create Batch and Import Recipients
  const handleFinalSubmit = async () => {
    if (!batchName || !eventName || !templateSnapshot || !spreadsheetFile) {
      alert("Please complete all required steps before finalizing.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1. If saveTemplateForReuse was checked, optionally save template definition
      if (saveTemplateForReuse && saveTemplateName.trim()) {
        await fetch("/api/admin/certificates/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: saveTemplateName.trim(),
            fileReference: templateSnapshot.fileReference,
            fileName: templateSnapshot.fileName,
            mimeType: templateSnapshot.mimeType,
            pageWidth: templateSnapshot.pageWidth,
            pageHeight: templateSnapshot.pageHeight,
            orientation: templateSnapshot.orientation,
            fields,
          }),
        });
      }

      // 2. Create the batch record
      const updatedSnapshot: ITemplateSnapshot = {
        ...templateSnapshot,
        fields,
      };

      const batchRes = await fetch("/api/admin/certificates/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchName,
          eventId: selectedEventId || undefined,
          eventName,
          eventDate,
          certificateType,
          templateSnapshot: updatedSnapshot,
          emailSubject,
          emailBody,
        }),
      });

      const batchData = await batchRes.json();
      if (!batchRes.ok || !batchData.success) {
        throw new Error(batchData.error || "Failed to create certificate batch");
      }

      const createdBatchId = batchData.batch._id;

      // 3. Import recipients into the created batch
      const importFormData = new FormData();
      importFormData.append("file", spreadsheetFile);
      importFormData.append("sheetName", selectedSheet);
      importFormData.append("nameColumn", nameColumn);
      importFormData.append("emailColumn", emailColumn);
      if (typeColumn) importFormData.append("typeColumn", typeColumn);
      importFormData.append("allowDuplicates", allowDuplicates ? "true" : "false");
      importFormData.append("dryRun", "false");

      const importRes = await fetch(
        `/api/admin/certificates/batches/${createdBatchId}/import-recipients`,
        {
          method: "POST",
          body: importFormData,
        }
      );

      const importData = await importRes.json();
      if (!importRes.ok || !importData.success) {
        throw new Error(importData.error || "Failed to import participant records");
      }

      // 4. Redirect to the batch management page!
      router.push(`/admin/dashboard/certificates/${createdBatchId}`);
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred during submission");
      setIsSubmitting(false);
    }
  };

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  return (
    <div className="min-h-screen bg-foundation-space text-typo-white">
      <AdminHeader
        title="Create Certificate Batch"
        subtitle="Follow the step-by-step wizard to upload templates, configure field positioning, and validate participants."
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-typo-gray">
          <Link href="/admin/dashboard/certificates" className="hover:text-typo-white flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Batches
          </Link>
          <span>/</span>
          <span className="text-brand-cyan">New Certificate Batch</span>
        </div>

        {/* Multi-Step Stepper Bar */}
        <div className="p-4 rounded-2xl bg-foundation-dark border border-foundation-slate/80">
          <div className="grid grid-cols-5 gap-2 sm:gap-4 text-center">
            {[
              { num: 1, label: "Batch Details" },
              { num: 2, label: "Upload Template" },
              { num: 3, label: "Position Fields" },
              { num: 4, label: "Import Participants" },
              { num: 5, label: "Review & Create" },
            ].map((step) => {
              const isActive = currentStep === step.num;
              const isPast = currentStep > step.num;

              return (
                <div
                  key={step.num}
                  onClick={() => {
                    if (isPast) setCurrentStep(step.num);
                  }}
                  className={`flex flex-col items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? "text-brand-cyan font-bold"
                      : isPast
                      ? "text-emerald-400"
                      : "text-typo-gray/60"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      isActive
                        ? "bg-brand-cyan text-foundation-space ring-4 ring-brand-cyan/20"
                        : isPast
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : "bg-foundation-space border border-foundation-slate text-typo-gray"
                    }`}
                  >
                    {isPast ? <Check className="w-4 h-4" /> : step.num}
                  </div>
                  <span className="text-xs hidden sm:block">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wizard Form Panels */}
        <div className="p-6 sm:p-8 rounded-2xl bg-foundation-dark border border-foundation-slate/80 shadow-xl space-y-6">
          {/* STEP 1: BATCH DETAILS */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold font-display text-typo-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-brand-cyan" />
                  Step 1: Batch & Event Details
                </h3>
                <p className="text-sm text-typo-gray mt-1">
                  Provide batch identification and optional event association.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-typo-gray uppercase tracking-wider mb-2">
                    Batch Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    placeholder="e.g. AI & Robotics Bootcamp 2026 Batch"
                    className="w-full px-4 py-2.5 bg-foundation-space border border-foundation-slate rounded-xl text-sm text-typo-white focus:outline-none focus:border-brand-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-typo-gray uppercase tracking-wider mb-2">
                    Associate with Existing Event (Optional)
                  </label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => handleSelectEvent(e.target.value)}
                    className="w-full px-4 py-2.5 bg-foundation-space border border-foundation-slate rounded-xl text-sm text-typo-white focus:outline-none focus:border-brand-blue"
                  >
                    <option value="">-- Standalone Batch (No Event Link) --</option>
                    {existingEvents.map((ev) => (
                      <option key={ev._id} value={ev._id}>
                        {ev.title} ({ev.startDate || "Date unset"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-typo-gray uppercase tracking-wider mb-2">
                    Event / Certificate Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="e.g. Ideathon 2026: Spark the Future"
                    className="w-full px-4 py-2.5 bg-foundation-space border border-foundation-slate rounded-xl text-sm text-typo-white focus:outline-none focus:border-brand-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-typo-gray uppercase tracking-wider mb-2">
                    Event Date (Displayed on Certificate)
                  </label>
                  <input
                    type="text"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    placeholder="e.g. 15th October 2026"
                    className="w-full px-4 py-2.5 bg-foundation-space border border-foundation-slate rounded-xl text-sm text-typo-white focus:outline-none focus:border-brand-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-typo-gray uppercase tracking-wider mb-2">
                    Default Certificate Type
                  </label>
                  <input
                    type="text"
                    value={certificateType}
                    onChange={(e) => setCertificateType(e.target.value)}
                    placeholder="e.g. Participation / Appreciation / Winner"
                    className="w-full px-4 py-2.5 bg-foundation-space border border-foundation-slate rounded-xl text-sm text-typo-white focus:outline-none focus:border-brand-blue"
                  />
                </div>
              </div>

              {/* Email Content Configuration */}
              <div className="pt-4 border-t border-foundation-slate/60 space-y-4">
                <h4 className="text-sm font-bold text-typo-white">Email Notification Template</h4>
                <div>
                  <label className="block text-xs font-semibold text-typo-gray uppercase tracking-wider mb-2">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-4 py-2.5 bg-foundation-space border border-foundation-slate rounded-xl text-sm text-typo-white focus:outline-none focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-typo-gray uppercase tracking-wider mb-2">
                    Email Message Body
                  </label>
                  <textarea
                    rows={5}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full px-4 py-2.5 bg-foundation-space border border-foundation-slate rounded-xl text-sm text-typo-white focus:outline-none focus:border-brand-blue font-mono text-xs"
                  />
                  <p className="text-xs text-typo-gray mt-1">
                    Available placeholders: <code className="text-brand-cyan">{"{{participantName}}"}</code>,{" "}
                    <code className="text-brand-cyan">{"{{eventName}}"}</code>,{" "}
                    <code className="text-brand-cyan">{"{{certificateId}}"}</code>,{" "}
                    <code className="text-brand-cyan">{"{{certificateType}}"}</code>.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => {
                    if (!batchName.trim() || !eventName.trim()) {
                      alert("Please provide both Batch Name and Event Name.");
                      return;
                    }
                    setCurrentStep(2);
                  }}
                  className="bg-brand-blue text-white inline-flex items-center gap-2"
                >
                  Continue to Template <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: UPLOAD CERTIFICATE TEMPLATE */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold font-display text-typo-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-brand-cyan" />
                  Step 2: Upload Certificate Template
                </h3>
                <p className="text-sm text-typo-gray mt-1">
                  Upload an official single-page PDF, PNG, or JPEG certificate design.
                </p>
              </div>

              {templateUploadError && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {templateUploadError}
                </div>
              )}

              {/* Saved templates selection if available */}
              {savedTemplates.length > 0 && (
                <div className="p-4 rounded-xl bg-foundation-space border border-foundation-slate space-y-2">
                  <label className="block text-xs font-semibold text-typo-gray uppercase tracking-wider">
                    Or Select a Saved Template Layout:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {savedTemplates.map((t) => (
                      <button
                        key={t._id}
                        type="button"
                        onClick={() => handleSelectSavedTemplate(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          templateSnapshot?.templateId === t._id
                            ? "bg-brand-blue text-white border-brand-blue"
                            : "bg-foundation-dark text-typo-white border-foundation-slate hover:border-brand-blue"
                        }`}
                      >
                        {t.name} ({t.orientation})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* File upload drag drop zone */}
              <div className="border-2 border-dashed border-foundation-slate/80 hover:border-brand-blue rounded-2xl p-8 text-center transition-colors">
                <input
                  type="file"
                  id="template-upload"
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleTemplateUpload(f);
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="template-upload"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-3"
                >
                  {isUploadingTemplate ? (
                    <Loader2 className="w-12 h-12 text-brand-blue animate-spin" />
                  ) : (
                    <FileText className="w-12 h-12 text-brand-cyan" />
                  )}

                  <div>
                    <span className="text-sm font-semibold text-typo-white block">
                      {isUploadingTemplate
                        ? "Analyzing dimensions & storing template..."
                        : templateSnapshot
                        ? `Uploaded: ${templateSnapshot.fileName}`
                        : "Click to upload certificate template"}
                    </span>
                    <span className="text-xs text-typo-gray mt-1 block">
                      Supports PDF, PNG, and JPEG (Max 15MB)
                    </span>
                  </div>
                </label>
              </div>

              {templateSnapshot && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      Template ready: <strong>{templateSnapshot.fileName}</strong> (
                      {templateSnapshot.orientation}, {templateSnapshot.pageWidth} ×{" "}
                      {templateSnapshot.pageHeight} pt)
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button
                  onClick={() => setCurrentStep(1)}
                  className="bg-foundation-space text-typo-gray border border-foundation-slate"
                >
                  Back
                </Button>
                <Button
                  disabled={!templateSnapshot || isUploadingTemplate}
                  onClick={() => setCurrentStep(3)}
                  className="bg-brand-blue text-white inline-flex items-center gap-2"
                >
                  Continue to Field Editor <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: VISUAL FIELD PLACEMENT EDITOR */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold font-display text-typo-white flex items-center gap-2">
                    <Move className="w-5 h-5 text-brand-cyan" />
                    Step 3: Visual Field Placement Editor
                  </h3>
                  <p className="text-sm text-typo-gray mt-1">
                    Click anywhere on the preview canvas to position the selected field.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => addField("certificateId", "Certificate ID")}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-foundation-space border border-foundation-slate hover:border-brand-blue text-typo-white"
                  >
                    + Add Certificate ID
                  </button>
                  <button
                    type="button"
                    onClick={() => addField("eventName", "Event Title")}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-foundation-space border border-foundation-slate hover:border-brand-blue text-typo-white"
                  >
                    + Add Event Title
                  </button>
                  <button
                    type="button"
                    onClick={() => addField("eventDate", "Event Date")}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-foundation-space border border-foundation-slate hover:border-brand-blue text-typo-white"
                  >
                    + Add Event Date
                  </button>
                </div>
              </div>

              {/* Editor Workspace: Preview Canvas + Field Properties Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Visual Canvas (2 Cols) */}
                <div className="lg:col-span-2 space-y-2">
                  <div className="text-xs text-typo-gray flex items-center justify-between">
                    <span>Click on canvas to move selected field: <strong className="text-brand-cyan">{selectedField?.label}</strong></span>
                    <span>Coordinates: X: {selectedField?.x}%, Y: {selectedField?.y}%</span>
                  </div>

                  <div
                    ref={canvasContainerRef}
                    onClick={handleCanvasClick}
                    className="relative w-full aspect-[842/595] rounded-xl border-2 border-foundation-slate bg-slate-900 overflow-hidden cursor-crosshair select-none shadow-2xl"
                  >
                    {/* Background template preview */}
                    {templateSnapshot?.fileReference && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/admin/certificates/templates/file?ref=${encodeURIComponent(
                          templateSnapshot.fileReference
                        )}`}
                        alt="Template preview"
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                      />
                    )}

                    {/* Dynamic Field Markers overlay */}
                    {fields.map((f) => {
                      const isSelected = f.id === selectedFieldId;
                      return (
                        <div
                          key={f.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFieldId(f.id);
                          }}
                          style={{
                            left: `${f.x}%`,
                            top: `${f.y}%`,
                            transform:
                              f.alignment === "center"
                                ? "translate(-50%, -50%)"
                                : f.alignment === "right"
                                ? "translate(-100%, -50%)"
                                : "translate(0, -50%)",
                            color: f.color,
                            fontSize: `${Math.max(10, Math.min(28, f.fontSize * 0.7))}px`,
                            fontFamily: f.fontFamily.includes("Times")
                              ? "serif"
                              : f.fontFamily.includes("Courier")
                              ? "monospace"
                              : "sans-serif",
                            fontWeight: f.fontFamily.includes("Bold") ? "bold" : "normal",
                          }}
                          className={`absolute px-2 py-0.5 rounded cursor-pointer whitespace-nowrap transition-shadow ${
                            isSelected
                              ? "ring-2 ring-brand-cyan bg-brand-cyan/20 backdrop-blur-sm z-20 shadow-lg"
                              : "border border-dashed border-white/50 bg-black/40 hover:bg-black/60 z-10"
                          }`}
                        >
                          {f.defaultValue || f.label}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Field Controls Panel (1 Col) */}
                <div className="p-4 rounded-xl bg-foundation-space border border-foundation-slate space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-foundation-slate">
                    <span className="font-bold text-typo-white">Active Field Properties</span>
                    {selectedField && selectedField.fieldKey !== "participantName" && (
                      <button
                        onClick={() => removeField(selectedField.id)}
                        className="text-rose-400 hover:text-rose-300 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>

                  {selectedField ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-typo-gray mb-1">Field Label</label>
                        <input
                          type="text"
                          value={selectedField.label}
                          onChange={(e) => updateSelectedField({ label: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-foundation-dark border border-foundation-slate rounded-lg text-typo-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-typo-gray mb-1">Font Size (pt)</label>
                          <input
                            type="number"
                            min={8}
                            max={72}
                            value={selectedField.fontSize}
                            onChange={(e) =>
                              updateSelectedField({ fontSize: parseInt(e.target.value, 10) || 24 })
                            }
                            className="w-full px-2.5 py-1.5 bg-foundation-dark border border-foundation-slate rounded-lg text-typo-white"
                          />
                        </div>

                        <div>
                          <label className="block text-typo-gray mb-1">Min Font Size</label>
                          <input
                            type="number"
                            min={6}
                            max={36}
                            value={selectedField.minFontSize || 12}
                            onChange={(e) =>
                              updateSelectedField({ minFontSize: parseInt(e.target.value, 10) || 12 })
                            }
                            className="w-full px-2.5 py-1.5 bg-foundation-dark border border-foundation-slate rounded-lg text-typo-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-typo-gray mb-1">Font Family</label>
                        <select
                          value={selectedField.fontFamily}
                          onChange={(e) =>
                            updateSelectedField({ fontFamily: e.target.value as SupportedFontFamily })
                          }
                          className="w-full px-2.5 py-1.5 bg-foundation-dark border border-foundation-slate rounded-lg text-typo-white"
                        >
                          {FONT_OPTIONS.map((f) => (
                            <option key={f.value} value={f.value}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-typo-gray mb-1">Text Alignment</label>
                        <div className="grid grid-cols-3 gap-1">
                          {(["left", "center", "right"] as TextAlignment[]).map((align) => (
                            <button
                              key={align}
                              type="button"
                              onClick={() => updateSelectedField({ alignment: align })}
                              className={`py-1 rounded capitalize ${
                                selectedField.alignment === align
                                  ? "bg-brand-blue text-white font-bold"
                                  : "bg-foundation-dark text-typo-gray"
                              }`}
                            >
                              {align}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-typo-gray mb-1">Text Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={selectedField.color}
                            onChange={(e) => updateSelectedField({ color: e.target.value })}
                            className="w-8 h-8 rounded bg-transparent border-0 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={selectedField.color}
                            onChange={(e) => updateSelectedField({ color: e.target.value })}
                            className="flex-1 px-2.5 py-1 bg-foundation-dark border border-foundation-slate rounded-lg text-typo-white font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-typo-gray mb-1">Max Width (% of Page)</label>
                        <input
                          type="range"
                          min={20}
                          max={100}
                          value={selectedField.maxWidth || 80}
                          onChange={(e) =>
                            updateSelectedField({ maxWidth: parseInt(e.target.value, 10) })
                          }
                          className="w-full"
                        />
                        <div className="text-right text-[11px] text-typo-gray">
                          {selectedField.maxWidth || 80}%
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-typo-gray text-center py-6">Select a field to edit its properties.</p>
                  )}

                  {/* Save template for future reuse option */}
                  <div className="pt-4 border-t border-foundation-slate space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveTemplateForReuse}
                        onChange={(e) => setSaveTemplateForReuse(e.target.checked)}
                        className="rounded border-foundation-slate text-brand-blue focus:ring-0"
                      />
                      <span className="text-xs text-typo-white">Save this layout for reuse</span>
                    </label>
                    {saveTemplateForReuse && (
                      <input
                        type="text"
                        placeholder="Template Name e.g. Standard Landscape 2026"
                        value={saveTemplateName}
                        onChange={(e) => setSaveTemplateName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-foundation-dark border border-foundation-slate rounded-lg text-typo-white"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  onClick={() => setCurrentStep(2)}
                  className="bg-foundation-space text-typo-gray border border-foundation-slate"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setCurrentStep(4)}
                  className="bg-brand-blue text-white inline-flex items-center gap-2"
                >
                  Continue to Participants <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: IMPORT PARTICIPANT DATA */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold font-display text-typo-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-brand-cyan" />
                  Step 4: Import & Validate Participant Spreadsheet
                </h3>
                <p className="text-sm text-typo-gray mt-1">
                  Upload an Excel (.xlsx, .xls) or CSV participant list to map fields and review records.
                </p>
              </div>

              {sheetError && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {sheetError}
                </div>
              )}

              {/* Upload file box */}
              <div className="border-2 border-dashed border-foundation-slate/80 hover:border-brand-blue rounded-2xl p-6 text-center">
                <input
                  type="file"
                  id="sheet-upload"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleSpreadsheetSelect(f);
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="sheet-upload"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  {isInspectingSheet ? (
                    <Loader2 className="w-10 h-10 text-brand-blue animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-10 h-10 text-brand-cyan" />
                  )}
                  <div>
                    <span className="text-sm font-semibold text-typo-white block">
                      {spreadsheetFile ? `Selected: ${spreadsheetFile.name}` : "Click to upload participant spreadsheet"}
                    </span>
                    <span className="text-xs text-typo-gray mt-0.5 block">
                      Accepts .xlsx, .xls, and .csv files (Max 10MB)
                    </span>
                  </div>
                </label>
              </div>

              {/* Sheet & Column Mapping Controls */}
              {detectedColumns.length > 0 && (
                <div className="p-4 rounded-xl bg-foundation-space border border-foundation-slate space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {sheetNames.length > 1 && (
                      <div>
                        <label className="block text-xs font-semibold text-typo-gray uppercase tracking-wider mb-1">
                          Select Worksheet
                        </label>
                        <select
                          value={selectedSheet}
                          onChange={(e) => setSelectedSheet(e.target.value)}
                          className="w-full px-3 py-2 bg-foundation-dark border border-foundation-slate rounded-lg text-sm text-typo-white"
                        >
                          {sheetNames.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-typo-gray uppercase tracking-wider mb-1">
                        Participant Name Column <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={nameColumn}
                        onChange={(e) => setNameColumn(e.target.value)}
                        className="w-full px-3 py-2 bg-foundation-dark border border-foundation-slate rounded-lg text-sm text-typo-white"
                      >
                        <option value="">-- Choose Name Column --</option>
                        {detectedColumns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-typo-gray uppercase tracking-wider mb-1">
                        Email Address Column <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={emailColumn}
                        onChange={(e) => setEmailColumn(e.target.value)}
                        className="w-full px-3 py-2 bg-foundation-dark border border-foundation-slate rounded-lg text-sm text-typo-white"
                      >
                        <option value="">-- Choose Email Column --</option>
                        {detectedColumns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-typo-gray uppercase tracking-wider mb-1">
                        Certificate Type Column (Optional)
                      </label>
                      <select
                        value={typeColumn}
                        onChange={(e) => setTypeColumn(e.target.value)}
                        className="w-full px-3 py-2 bg-foundation-dark border border-foundation-slate rounded-lg text-sm text-typo-white"
                      >
                        <option value="">-- None (Use Default) --</option>
                        {detectedColumns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-typo-white">
                      <input
                        type="checkbox"
                        checked={allowDuplicates}
                        onChange={(e) => setAllowDuplicates(e.target.checked)}
                        className="rounded border-foundation-slate text-brand-blue focus:ring-0"
                      />
                      <span>Allow intentional duplicate emails (e.g. multiple distinct attendees)</span>
                    </label>

                    <Button
                      onClick={handleValidateSpreadsheet}
                      disabled={!nameColumn || !emailColumn || isValidatingData}
                      className="bg-brand-blue text-white text-xs px-3 py-1.5"
                    >
                      {isValidatingData ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Validating...
                        </>
                      ) : (
                        "Validate Participant Rows"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Validation Report Card */}
              {validationReport && (
                <div className="p-4 rounded-xl bg-foundation-dark border border-foundation-slate space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-foundation-slate">
                    <h4 className="text-sm font-bold text-typo-white flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Spreadsheet Validation Report
                    </h4>
                  </div>

                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-lg bg-foundation-space">
                      <p className="text-xs text-typo-gray">Total Rows</p>
                      <p className="text-lg font-bold text-typo-white">{validationReport.totalRows}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-foundation-space">
                      <p className="text-xs text-emerald-400">Valid Records</p>
                      <p className="text-lg font-bold text-emerald-400">{validationReport.validRows}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-foundation-space">
                      <p className="text-xs text-rose-400">Invalid Records</p>
                      <p className="text-lg font-bold text-rose-400">{validationReport.invalidRows}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-foundation-space">
                      <p className="text-xs text-amber-400">Duplicate Emails</p>
                      <p className="text-lg font-bold text-amber-400">{validationReport.duplicateRows}</p>
                    </div>
                  </div>

                  {/* Sample preview rows */}
                  <div className="overflow-x-auto max-h-48 border border-foundation-slate rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-foundation-space text-typo-gray border-b border-foundation-slate">
                        <tr>
                          <th className="py-2 px-3">Row</th>
                          <th className="py-2 px-3">Participant Name</th>
                          <th className="py-2 px-3">Email Address</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-foundation-slate/50">
                        {validationReport.rows.slice(0, 8).map((r) => (
                          <tr key={r.rowNumber} className={r.isValid ? "" : "bg-rose-500/10"}>
                            <td className="py-2 px-3 font-mono">{r.rowNumber}</td>
                            <td className="py-2 px-3 font-medium text-typo-white">{r.mappedName || "—"}</td>
                            <td className="py-2 px-3 text-typo-gray">{r.mappedEmail || "—"}</td>
                            <td className="py-2 px-3">
                              {r.isValid ? (
                                <span className="text-emerald-400 font-semibold">Valid</span>
                              ) : (
                                <span className="text-rose-400 font-semibold">{r.errors.join(", ")}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button
                  onClick={() => setCurrentStep(3)}
                  className="bg-foundation-space text-typo-gray border border-foundation-slate"
                >
                  Back
                </Button>
                <Button
                  disabled={!validationReport || validationReport.validRows === 0}
                  onClick={() => setCurrentStep(5)}
                  className="bg-brand-blue text-white inline-flex items-center gap-2"
                >
                  Review Batch <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & CONFIRM */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold font-display text-typo-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-brand-cyan" />
                  Step 5: Review & Finalize Batch Creation
                </h3>
                <p className="text-sm text-typo-gray mt-1">
                  Please review the batch summary before generating certificates and scheduling delivery.
                </p>
              </div>

              {submitError && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {submitError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-foundation-space border border-foundation-slate space-y-2 text-sm">
                  <h4 className="font-bold text-typo-white text-xs uppercase tracking-wider">Batch Information</h4>
                  <div className="flex justify-between"><span className="text-typo-gray">Batch Name:</span> <strong className="text-typo-white">{batchName}</strong></div>
                  <div className="flex justify-between"><span className="text-typo-gray">Event Title:</span> <strong className="text-typo-white">{eventName}</strong></div>
                  <div className="flex justify-between"><span className="text-typo-gray">Event Date:</span> <strong className="text-typo-white">{eventDate || "Not specified"}</strong></div>
                  <div className="flex justify-between"><span className="text-typo-gray">Certificate Type:</span> <strong className="text-typo-white">{certificateType}</strong></div>
                </div>

                <div className="p-4 rounded-xl bg-foundation-space border border-foundation-slate space-y-2 text-sm">
                  <h4 className="font-bold text-typo-white text-xs uppercase tracking-wider">Template & Participants</h4>
                  <div className="flex justify-between"><span className="text-typo-gray">Template File:</span> <strong className="text-typo-white">{templateSnapshot?.fileName}</strong></div>
                  <div className="flex justify-between"><span className="text-typo-gray">Configured Fields:</span> <strong className="text-typo-white">{fields.length} dynamic fields</strong></div>
                  <div className="flex justify-between"><span className="text-typo-gray">Approved Participants:</span> <strong className="text-emerald-400">{validationReport?.validRows || 0} valid records</strong></div>
                  <div className="flex justify-between"><span className="text-typo-gray">Excluded Rows:</span> <strong className="text-rose-400">{validationReport?.invalidRows || 0} rows</strong></div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-brand-blue/10 border border-brand-blue/20 text-brand-cyan text-xs leading-relaxed">
                <p>
                  <strong>Notice:</strong> Once created, you will be redirected to the Batch Control Center where you can trigger bulk PDF generation, preview individual certificates, send test emails, and start automated email delivery.
                </p>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  onClick={() => setCurrentStep(4)}
                  className="bg-foundation-space text-typo-gray border border-foundation-slate"
                >
                  Back
                </Button>
                <Button
                  disabled={isSubmitting}
                  onClick={handleFinalSubmit}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold inline-flex items-center gap-2 px-6 py-2.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Creating Batch & Importing...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Create Batch & Import Participants
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
