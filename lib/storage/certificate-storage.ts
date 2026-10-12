import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb/client";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import os from "os";

const BUCKET_NAME = "certificate_files";
const LOCAL_STORAGE_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), "certificates")
  : path.join(process.cwd(), "private_storage", "certificates");

// Ensure local directory exists for dev/fallback caching
try {
  if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
    fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
  }
} catch {
  // If running in read-only environment like Vercel Lambda, ignore error
}

/**
 * Gets the GridFS bucket for certificate files.
 */
async function getGridFSBucket(): Promise<mongoose.mongo.GridFSBucket | null> {
  const conn = await connectToDatabase();
  if (!conn || !conn.connection.db) {
    return null;
  }
  return new mongoose.mongo.GridFSBucket(conn.connection.db, {
    bucketName: BUCKET_NAME,
  });
}

/**
 * Stores a binary buffer in private storage (GridFS with local filesystem fallback)
 * Returns a stable storage reference string.
 */
export async function storeCertificateFile(
  buffer: Buffer,
  filename: string,
  contentType: string,
  metadata?: Record<string, any>
): Promise<string> {
  const bucket = await getGridFSBucket();

  if (bucket) {
    return new Promise((resolve, reject) => {
      const uploadStream = bucket.openUploadStream(filename, {
        contentType,
        metadata: {
          ...metadata,
          uploadedAt: new Date(),
          size: buffer.length,
        },
      });

      uploadStream.on("error", (err) => {
        console.error("[GRIDFS UPLOAD ERROR]", err);
        // Fall back to local file if GridFS fails
        fallbackLocalSave(buffer, filename)
          .then(resolve)
          .catch(reject);
      });

      uploadStream.on("finish", () => {
        resolve(`gridfs:${uploadStream.id.toString()}`);
      });

      uploadStream.end(buffer);
    });
  }

  // Fallback to local storage if DB is not reachable
  return fallbackLocalSave(buffer, filename);
}

async function fallbackLocalSave(buffer: Buffer, filename: string): Promise<string> {
  const fileId = `${crypto.randomUUID()}_${path.basename(filename)}`;
  const filePath = path.join(LOCAL_STORAGE_DIR, fileId);
  await fs.promises.writeFile(filePath, buffer);
  return `local:${fileId}`;
}

/**
 * Retrieves a binary buffer from private storage given its reference string.
 */
export async function getCertificateFile(
  fileReference: string
): Promise<{ buffer: Buffer; filename: string; contentType: string } | null> {
  if (!fileReference) return null;

  if (fileReference.startsWith("gridfs:")) {
    const idStr = fileReference.replace("gridfs:", "");
    const bucket = await getGridFSBucket();
    if (!bucket) {
      console.warn("[STORAGE] GridFS bucket unavailable while fetching file", idStr);
      return null;
    }

    try {
      const objectId = new mongoose.Types.ObjectId(idStr);
      const files = await bucket.find({ _id: objectId }).toArray();
      if (!files || files.length === 0) {
        return null;
      }
      const fileDoc = files[0];

      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        const downloadStream = bucket.openDownloadStream(objectId);

        downloadStream.on("data", (chunk) => {
          chunks.push(Buffer.from(chunk));
        });

        downloadStream.on("error", (err) => {
          console.error("[GRIDFS DOWNLOAD ERROR]", err);
          reject(err);
        });

        downloadStream.on("end", () => {
          resolve({
            buffer: Buffer.concat(chunks),
            filename: fileDoc.filename,
            contentType: fileDoc.contentType || "application/octet-stream",
          });
        });
      });
    } catch (err) {
      console.error("[STORAGE GET ERROR]", err);
      return null;
    }
  }

  if (fileReference.startsWith("local:")) {
    const fileId = fileReference.replace("local:", "");
    // Prevent directory traversal
    const safeName = path.basename(fileId);
    const filePath = path.join(LOCAL_STORAGE_DIR, safeName);
    try {
      if (fs.existsSync(filePath)) {
        const buffer = await fs.promises.readFile(filePath);
        return {
          buffer,
          filename: safeName,
          contentType: safeName.endsWith(".pdf")
            ? "application/pdf"
            : safeName.endsWith(".png")
            ? "image/png"
            : "application/octet-stream",
        };
      }
    } catch (err) {
      console.error("[LOCAL FILE READ ERROR]", err);
    }
  }

  return null;
}

/**
 * Deletes a stored certificate file.
 */
export async function deleteCertificateFile(fileReference: string): Promise<boolean> {
  if (!fileReference) return false;

  try {
    if (fileReference.startsWith("gridfs:")) {
      const idStr = fileReference.replace("gridfs:", "");
      const bucket = await getGridFSBucket();
      if (bucket) {
        await bucket.delete(new mongoose.Types.ObjectId(idStr));
        return true;
      }
    } else if (fileReference.startsWith("local:")) {
      const fileId = fileReference.replace("local:", "");
      const safeName = path.basename(fileId);
      const filePath = path.join(LOCAL_STORAGE_DIR, safeName);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }
    }
  } catch (err) {
    console.error("[STORAGE DELETE ERROR]", err);
  }
  return false;
}
