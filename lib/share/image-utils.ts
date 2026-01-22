/**
 * Image utilities for sharing and screenshot functionality
 */

import html2canvas from "html2canvas";

export type ImageFormat = "png" | "jpeg";

interface CaptureOptions {
  format?: ImageFormat;
  quality?: number;
  scale?: number;
  backgroundColor?: string;
}

/**
 * Capture a DOM element as an image blob
 */
export async function captureElement(
  element: HTMLElement,
  options: CaptureOptions = {}
): Promise<Blob> {
  const {
    format = "png",
    quality = 0.95,
    scale = 2, // 2x for retina quality
    backgroundColor = "#faf9f7", // Match app background
  } = options;

  const canvas = await html2canvas(element, {
    scale,
    backgroundColor,
    useCORS: true,
    allowTaint: false,
    logging: false,
    // Improve rendering quality
    imageTimeout: 15000,
    removeContainer: true,
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to create image blob"));
        }
      },
      `image/${format}`,
      quality
    );
  });
}

/**
 * Download an image blob as a file
 */
export function downloadImage(
  blob: Blob,
  filename: string,
  format: ImageFormat = "png"
): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy an image blob to clipboard
 * Note: Only works with PNG format due to browser limitations
 */
export async function copyImageToClipboard(blob: Blob): Promise<boolean> {
  try {
    // Clipboard API requires PNG format
    let pngBlob = blob;
    
    if (blob.type !== "image/png") {
      // Convert to PNG if needed
      pngBlob = await convertToPng(blob);
    }

    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": pngBlob,
      }),
    ]);
    return true;
  } catch (error) {
    console.error("Failed to copy image to clipboard:", error);
    return false;
  }
}

/**
 * Convert any image blob to PNG format
 */
async function convertToPng(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob(
        (pngBlob) => {
          if (pngBlob) {
            resolve(pngBlob);
          } else {
            reject(new Error("Failed to convert to PNG"));
          }
        },
        "image/png",
        1.0
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for conversion"));
    };

    img.src = url;
  });
}

/**
 * Generate a Twitter/X intent URL with pre-filled text
 */
export function generateTwitterIntent(text: string, url?: string): string {
  const params = new URLSearchParams();
  params.set("text", text);
  if (url) {
    params.set("url", url);
  }
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

/**
 * Generate a shareable filename based on topic and type
 */
export function generateFilename(topic: string, type: "full" | "single" = "full"): string {
  const sanitized = topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
  
  const timestamp = Date.now();
  return `reminer-${sanitized}-${type}-${timestamp}`;
}

/**
 * Check if clipboard write is supported
 */
export function isClipboardSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.clipboard !== "undefined" &&
    typeof ClipboardItem !== "undefined"
  );
}

/**
 * Generate tweet text for sharing pain points
 */
export function generateTweetText(
  topic: string,
  painPointCount: number,
  topPainPoint?: string
): string {
  let text = `🔍 Found ${painPointCount} pain points about "${topic}" from Hacker News discussions`;
  
  if (topPainPoint) {
    text += `\n\nTop issue: "${topPainPoint}"`;
  }
  
  text += "\n\nDiscover more with @ReminerApp 👇";
  
  return text;
}

/**
 * Generate tweet text for a single pain point
 */
export function generateSinglePainPointTweet(
  topic: string,
  painPointTitle: string,
  mentions: number
): string {
  return `💡 "${painPointTitle}"\n\n${mentions} people mentioned this pain point about ${topic} on Hacker News.\n\nFound with @ReminerApp 👇`;
}
