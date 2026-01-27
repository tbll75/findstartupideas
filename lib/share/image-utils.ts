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
 * Convert a color value to hex format
 * Handles oklch(), lab(), rgb(), and other color formats
 */
function convertColorToHex(color: string): string {
  if (!color || color === "transparent" || color === "none" || color === "rgba(0, 0, 0, 0)") {
    return "#ffffff";
  }

  // If already hex, return as is
  if (color.startsWith("#") && (color.length === 4 || color.length === 7)) {
    return color;
  }

  // Try to parse using a temporary element
  try {
    const tempEl = document.createElement("div");
    tempEl.style.color = color;
    tempEl.style.position = "absolute";
    tempEl.style.visibility = "hidden";
    tempEl.style.pointerEvents = "none";
    document.body.appendChild(tempEl);
    const computedColor = window.getComputedStyle(tempEl).color;
    document.body.removeChild(tempEl);

    // Convert rgb/rgba to hex
    const rgbMatch = computedColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, "0");
      const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, "0");
      const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, "0");
      return `#${r}${g}${b}`;
    }
  } catch (e) {
    // Fallback if parsing fails
  }

  // Fallback to white if all else fails
  return "#ffffff";
}

/**
 * Fix color values in cloned DOM to avoid html2canvas parsing errors
 * This prevents issues with modern CSS color functions like oklch() and lab()
 * Since ShareableCard uses inline styles, we can safely remove all external stylesheets
 */
function fixColorsInClone(clonedDoc: Document): void {
  try {
    // Remove all link tags that reference external stylesheets
    // These might contain problematic color functions like oklch() and lab()
    const linkTags = clonedDoc.querySelectorAll("link[rel='stylesheet']");
    linkTags.forEach((tag) => tag.remove());
    
    // Remove ALL style tags - ShareableCard uses inline styles only
    // This prevents html2canvas from parsing problematic color functions
    const styleTags = clonedDoc.querySelectorAll("style");
    styleTags.forEach((tag) => tag.remove());

    // Then fix computed styles on elements
    const allElements = clonedDoc.querySelectorAll("*");
    
    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (!htmlEl) return;
      
      const style = htmlEl.style;
      if (!style) return;
      
      // Get computed styles that might contain problematic color values
      const computedStyle = clonedDoc.defaultView?.getComputedStyle(htmlEl);
      if (!computedStyle) return;
      
      // Fix background-color
      const bgColor = computedStyle.backgroundColor;
      if (bgColor && bgColor !== "transparent" && bgColor !== "rgba(0, 0, 0, 0)") {
        try {
          // Only override if it contains problematic color functions
          if (bgColor.includes("lab(") || bgColor.includes("oklch(") || bgColor.includes("lch(")) {
            style.backgroundColor = convertColorToHex(bgColor);
          }
        } catch (e) {
          // Ignore errors
        }
      }
      
      // Fix color
      const textColor = computedStyle.color;
      if (textColor) {
        try {
          if (textColor.includes("lab(") || textColor.includes("oklch(") || textColor.includes("lch(")) {
            style.color = convertColorToHex(textColor);
          }
        } catch (e) {
          // Ignore errors
        }
      }
      
      // Fix border-color
      const borderColor = computedStyle.borderColor;
      if (borderColor && borderColor !== "transparent") {
        try {
          if (borderColor.includes("lab(") || borderColor.includes("oklch(") || borderColor.includes("lch(")) {
            style.borderColor = convertColorToHex(borderColor);
          }
        } catch (e) {
          // Ignore errors
        }
      }
    });
  } catch (e) {
    // Silently fail - html2canvas will handle it
    console.warn("Error fixing colors in clone:", e);
  }
}

/**
 * Temporarily disable all stylesheets to prevent html2canvas from parsing problematic colors
 * Since ShareableCard uses inline styles, we don't need external stylesheets
 * Returns a function to restore them
 */
function disableProblematicStylesheets(): (() => void) {
  const disabledSheets: { sheet: CSSStyleSheet; originalDisabled: boolean }[] = [];
  
  try {
    // Disable ALL stylesheets - ShareableCard uses inline styles only
    // This prevents html2canvas from parsing oklch() and lab() color functions
    for (let i = 0; i < document.styleSheets.length; i++) {
      const sheet = document.styleSheets[i];
      try {
        disabledSheets.push({
          sheet,
          originalDisabled: sheet.disabled,
        });
        sheet.disabled = true;
      } catch (e) {
        // Skip stylesheets we can't access (cross-origin, etc.)
        continue;
      }
    }
  } catch (e) {
    // If we can't access stylesheets, continue anyway
  }
  
  // Return restore function
  return () => {
    disabledSheets.forEach(({ sheet, originalDisabled }) => {
      try {
        sheet.disabled = originalDisabled;
      } catch (e) {
        // Ignore errors when restoring
      }
    });
  };
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

  // Temporarily disable problematic stylesheets
  const restoreStylesheets = disableProblematicStylesheets();

  try {
    const canvas = await html2canvas(element, {
      scale,
      backgroundColor,
      useCORS: true,
      allowTaint: false,
      logging: false,
      // Improve rendering quality
      imageTimeout: 15000,
      removeContainer: true,
      // Fix color parsing issues with modern CSS color functions
      onclone: (clonedDoc) => {
        fixColorsInClone(clonedDoc);
      },
      // Disable foreign object rendering to avoid color parsing issues
      foreignObjectRendering: false,
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
  } catch (error) {
    // If error is related to color parsing, try with a simpler configuration
    if (error instanceof Error && (error.message.includes("color") || error.message.includes("lab") || error.message.includes("oklch"))) {
      console.warn("Color parsing error detected, retrying with simplified configuration");
      
      try {
        const canvas = await html2canvas(element, {
          scale: 1, // Lower scale for faster processing
          backgroundColor: "#faf9f7",
          useCORS: true,
          allowTaint: false,
          logging: false,
          imageTimeout: 10000,
          removeContainer: true,
          foreignObjectRendering: false,
          // More aggressive color fixing
          onclone: (clonedDoc) => {
            // fixColorsInClone already removes all style and link tags
            fixColorsInClone(clonedDoc);
          },
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
      } catch (retryError) {
        throw new Error(
          `Failed to capture element: ${retryError instanceof Error ? retryError.message : "Unknown error"}`
        );
      }
    }
    
    throw error;
  } finally {
    // Always restore stylesheets
    restoreStylesheets();
  }
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
  return `startup-ideas-${sanitized}-${type}-${timestamp}`;
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
  let text = `🔍 Found ${painPointCount} startup ideas about "${topic}" from Hacker News discussions`;
  
  if (topPainPoint) {
    text += `\n\nTop opportunity: "${topPainPoint}"`;
  }
  
  text += "\n\nDiscover more at findstartupideas.com";
  
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
  return `💡 "${painPointTitle}"\n\n${mentions} people mentioned this pain point about ${topic} on Hacker News.\n\nFound at findstartupideas.com`;
}
