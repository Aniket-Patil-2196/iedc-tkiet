import CertificateBatchModel from "@/models/CertificateBatch";
import CertificateRecipientModel from "@/models/CertificateRecipient";
import CertificateEmailAttemptModel from "@/models/CertificateEmailAttempt";
import { renderCertificatePdf } from "@/lib/certificates/pdf-engine";
import {
  storeCertificateFile,
  getCertificateFile,
} from "@/lib/storage/certificate-storage";
import { sendPersonalizedCertificateEmail } from "@/lib/email/certificate-mailer";
import { connectToDatabase } from "@/lib/mongodb/client";

/**
 * Generates certificates for all pending recipients in a batch.
 */
export async function processBatchGeneration(
  batchId: string,
  options: { forceRegenerate?: boolean; maxCount?: number } = {}
) {
  await connectToDatabase();

  const batch = await CertificateBatchModel.findById(batchId);
  if (!batch) {
    throw new Error("Certificate batch not found");
  }

  // Retrieve template file buffer
  const templateFile = await getCertificateFile(
    batch.templateSnapshot.fileReference
  );
  if (!templateFile) {
    throw new Error("Certificate template file not found in storage");
  }

  // Update batch status to generating
  batch.status = "generating";
  await batch.save();

  // Find recipients to generate
  const query: any = { batchId };
  if (!options.forceRegenerate) {
    query.generationStatus = { $ne: "generated" };
  }

  let recipientsQuery = CertificateRecipientModel.find(query);
  if (options.maxCount) {
    recipientsQuery = recipientsQuery.limit(options.maxCount);
  }
  const recipients = await recipientsQuery;

  let generatedCount = 0;
  let failedCount = 0;

  for (const recipient of recipients) {
    try {
      recipient.generationStatus = "generating";
      await recipient.save();

      const pdfBuffer = await renderCertificatePdf(
        templateFile.buffer,
        batch.templateSnapshot,
        {
          participantName: recipient.participantName,
          certificateId: recipient.certificateId,
          eventName: batch.eventName,
          eventDate: batch.eventDate,
          certificateType: recipient.certificateType || batch.certificateType,
          additionalFields: recipient.additionalFields
            ? recipient.additionalFields instanceof Map
              ? Object.fromEntries(recipient.additionalFields)
              : (recipient.additionalFields as any)
            : {},
        }
      );

      const fileRef = await storeCertificateFile(
        pdfBuffer,
        `cert_${recipient.certificateId}.pdf`,
        "application/pdf",
        {
          batchId: batch._id.toString(),
          recipientId: recipient._id.toString(),
          certificateId: recipient.certificateId,
        }
      );

      recipient.generationStatus = "generated";
      recipient.certificateFileReference = fileRef;
      recipient.generationError = undefined;
      await recipient.save();

      generatedCount++;
    } catch (err: any) {
      console.error(
        `[GENERATION FAILED] Recipient ${recipient._id} (${recipient.email}):`,
        err
      );
      recipient.generationStatus = "failed";
      recipient.generationError = err.message || "Failed to generate PDF";
      await recipient.save();

      failedCount++;
    }
  }

  // Recalculate batch generation counts
  const total = await CertificateRecipientModel.countDocuments({ batchId });
  const generated = await CertificateRecipientModel.countDocuments({
    batchId,
    generationStatus: "generated",
  });
  const failed = await CertificateRecipientModel.countDocuments({
    batchId,
    generationStatus: "failed",
  });

  batch.generationCounts = { total, generated, failed };
  batch.status = generated === total ? "generated" : "ready";
  await batch.save();

  return {
    total,
    generated,
    failed,
    processedThisRun: generatedCount + failedCount,
  };
}

/**
 * Processes email distribution for a batch in controlled sequential chunks.
 */
export async function processBatchEmailDistribution(
  batchId: string,
  options: {
    maxCount?: number;
    delayMs?: number;
    retryFailedOnly?: boolean;
    forceResend?: boolean;
  } = {}
) {
  await connectToDatabase();

  const batch = await CertificateBatchModel.findById(batchId);
  if (!batch) {
    throw new Error("Certificate batch not found");
  }

  batch.status = "sending";
  await batch.save();

  const query: any = {
    batchId,
    generationStatus: "generated",
  };

  if (options.retryFailedOnly) {
    query.emailStatus = "failed";
  } else if (!options.forceResend) {
    // Standard run: only send to pending or failed
    query.emailStatus = { $in: ["pending", "failed"] };
  }

  let recipientsQuery = CertificateRecipientModel.find(query);
  if (options.maxCount) {
    recipientsQuery = recipientsQuery.limit(options.maxCount);
  }
  const recipients = await recipientsQuery;

  let sentCount = 0;
  let failedCount = 0;
  const delayBetweenSends = options.delayMs || 150;

  for (const recipient of recipients) {
    // Check if batch got cancelled
    const currentBatch = await CertificateBatchModel.findById(batchId).select("status");
    if (currentBatch?.status === "cancelled") {
      break;
    }

    try {
      recipient.emailStatus = "sending";
      recipient.emailAttempts += 1;
      recipient.lastEmailAttemptAt = new Date();
      await recipient.save();

      // Get generated PDF
      if (!recipient.certificateFileReference) {
        throw new Error("Missing generated certificate file reference");
      }

      const fileData = await getCertificateFile(recipient.certificateFileReference);
      if (!fileData) {
        throw new Error("Certificate PDF file not found in storage");
      }

      const sendResult = await sendPersonalizedCertificateEmail({
        recipientEmail: recipient.email,
        recipientName: recipient.participantName,
        certificateId: recipient.certificateId,
        eventName: batch.eventName,
        certificateType: recipient.certificateType || batch.certificateType,
        subjectTemplate: batch.emailSubject,
        bodyTemplate: batch.emailBody,
        pdfBuffer: fileData.buffer,
      });

      // Record audit attempt
      await CertificateEmailAttemptModel.create({
        recipientId: recipient._id,
        batchId: batch._id,
        attemptNumber: recipient.emailAttempts,
        attemptedAt: new Date(),
        status: sendResult.success ? "sent" : "failed",
        providerMessageId: sendResult.providerMessageId,
        errorCategory: sendResult.errorCategory,
        errorMessage: sendResult.error,
      });

      if (sendResult.success) {
        recipient.emailStatus = "sent";
        recipient.sentAt = new Date();
        recipient.lastEmailError = undefined;
        await recipient.save();
        sentCount++;
      } else {
        recipient.emailStatus = "failed";
        recipient.lastEmailError = sendResult.error || "Email delivery failed";
        await recipient.save();
        failedCount++;
      }
    } catch (err: any) {
      console.error(`[EMAIL DISPATCH ERROR] Recipient ${recipient._id}:`, err);
      recipient.emailStatus = "failed";
      recipient.lastEmailError = err.message || "Failed during dispatch";
      await recipient.save();

      await CertificateEmailAttemptModel.create({
        recipientId: recipient._id,
        batchId: batch._id,
        attemptNumber: recipient.emailAttempts,
        attemptedAt: new Date(),
        status: "failed",
        errorCategory: "transient",
        errorMessage: err.message,
      });

      failedCount++;
    }

    // Rate limiting delay
    if (delayBetweenSends > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenSends));
    }
  }

  // Recalculate batch email counts
  const total = await CertificateRecipientModel.countDocuments({ batchId });
  const sent = await CertificateRecipientModel.countDocuments({
    batchId,
    emailStatus: "sent",
  });
  const failed = await CertificateRecipientModel.countDocuments({
    batchId,
    emailStatus: "failed",
  });
  const pending = await CertificateRecipientModel.countDocuments({
    batchId,
    emailStatus: "pending",
  });

  batch.emailCounts = { total, sent, failed, pending };
  if (sent === total) {
    batch.status = "completed";
    batch.completedAt = new Date();
  } else if (pending === 0 && failed > 0) {
    batch.status = "failed";
  } else {
    batch.status = "generated";
  }
  await batch.save();

  return {
    total,
    sent,
    failed,
    pending,
    processedThisRun: sentCount + failedCount,
  };
}
