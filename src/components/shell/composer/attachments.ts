import type { PendingAttachment } from "./types";

const MAX_TEXT_FILE_BYTES = 500_000;
// Increased to allow larger binary file previews (was 500KB, now 1MB)
const MAX_BINARY_PREVIEW_BYTES = 1_000_000;

// Maximum dimension for image resizing to control token usage
// 1024px is a good balance between quality and token consumption
// Most vision models process images in patches/tiles; 1024px keeps token count reasonable
const MAX_IMAGE_DIMENSION = 1024;
// JPEG quality for resized images (0.85 = good balance of quality vs size)
const IMAGE_QUALITY = 0.85;

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "0 B";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function fileToText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Résultat texte invalide."));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("Impossible de lire le texte."));
    };
    reader.readAsText(file);
  });
}

async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (!(reader.result instanceof ArrayBuffer)) {
        reject(new Error("Résultat binaire invalide."));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("Impossible de lire le binaire."));
    };
    reader.readAsArrayBuffer(file);
  });
}

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

/**
 * Resize an image to fit within MAX_IMAGE_DIMENSION while maintaining aspect ratio.
 * Uses HTML Canvas API for resizing and outputs JPEG for better compression.
 * This significantly reduces token usage when sending images to vision models.
 */
async function resizeImage(file: File): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;
      const maxDim = MAX_IMAGE_DIMENSION;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      // Create canvas and resize
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Impossible de créer le contexte canvas"));
        return;
      }

      // Use better quality scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      // Export as JPEG with compression
      const dataUrl = canvas.toDataURL("image/jpeg", IMAGE_QUALITY);
      resolve({ dataUrl, width, height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Impossible de charger l'image: ${file.name}`));
    };

    img.src = url;
  });
}

export async function buildAttachment(file: File): Promise<PendingAttachment> {
  const mimeType = file.type || "application/octet-stream";
  const isImage = mimeType.startsWith("image/");
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  if (isImage) {
    // Resize image to control token usage with vision models
    const { dataUrl, width, height } = await resizeImage(file);
    const commaIndex = dataUrl.indexOf(",");
    if (commaIndex < 0) {
      throw new Error(`Image invalide: ${file.name}`);
    }
    const base64Data = dataUrl.slice(commaIndex + 1);
    // Estimate new size from base64 length (base64 is ~4/3 of binary size)
    const estimatedSize = Math.round((base64Data.length * 3) / 4);
    return {
      id,
      name: file.name,
      // Use JPEG mime type since resizeImage outputs JPEG
      mimeType: "image/jpeg",
      size: estimatedSize,
      isImage: true,
      image: {
        type: "image",
        data: base64Data,
        mimeType: "image/jpeg",
      },
      // Include base64 data in textForPrompt so it can be parsed for UI display
      // Format: "Nom: ...\nType: ...\nTaille: ...\ndata:mimeType;base64,..."
      // Note: original dimensions are preserved for display, but image is resized to MAX_IMAGE_DIMENSION
      textForPrompt: `Nom: ${file.name}\nType: image/jpeg (redimensionnée ${width}x${height})\nTaille originale: ${formatBytes(file.size)}\nTaille optimisée: ${formatBytes(estimatedSize)}\ndata:image/jpeg;base64,${base64Data}`,
    };
  }

  const seemsText =
    mimeType.startsWith("text/") ||
    /json|xml|yaml|csv|markdown|javascript|typescript|html|css/.test(mimeType);

  if (seemsText && file.size <= MAX_TEXT_FILE_BYTES) {
    const text = await fileToText(file);
    return {
      id,
      name: file.name,
      mimeType,
      size: file.size,
      isImage: false,
      file: {
        type: "file",
        name: file.name,
        mimeType,
        data: text,
        size: file.size,
      },
      textForPrompt: `Nom: ${file.name}\nType: ${mimeType}\nTaille: ${formatBytes(file.size)}\nContenu:\n${text}`,
    };
  }

  const buffer = await fileToArrayBuffer(file);
  const truncated = buffer.byteLength > MAX_BINARY_PREVIEW_BYTES;
  const previewBuffer = truncated ? buffer.slice(0, MAX_BINARY_PREVIEW_BYTES) : buffer;
  const previewBase64 = toBase64(previewBuffer);
  const truncationNote = truncated
    ? `\n[ATTENTION: Fichier tronqué. Seuls les premiers ${formatBytes(MAX_BINARY_PREVIEW_BYTES)} sont inclus. Le fichier complet est disponible dans le workspace si nécessaire.]`
    : "";

  return {
    id,
    name: file.name,
    mimeType,
    size: file.size,
    isImage: false,
    file: {
      type: "file",
      name: file.name,
      mimeType,
      data: previewBase64,
      size: file.size,
    },
    textForPrompt: `Nom: ${file.name}\nType: ${mimeType}\nTaille: ${formatBytes(file.size)}\nAperçu base64 (fichier binaire)${truncated ? " - TRONQUÉ" : ""}:${truncationNote}\n${previewBase64}`,
  };
}

export function buildMessageWithAttachments(
  message: string,
  attachments: PendingAttachment[],
): string {
  if (attachments.length === 0) {
    return message;
  }
  const sections = attachments.map((piece, index) => {
    return `--- Pièce jointe ${index + 1} ---\n${piece.textForPrompt}`;
  });
  return `${message}\n\n${sections.join("\n\n")}`;
}
