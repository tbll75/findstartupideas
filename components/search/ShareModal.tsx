"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  X,
  Download,
  Copy,
  Check,
  Loader2,
  ImageIcon,
  FileImage,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareableCard } from "./ShareableCard";
import type { SearchResultItem } from "@/types";
import {
  captureElement,
  downloadImage,
  copyImageToClipboard,
  generateFilename,
  generateTwitterIntent,
  generateTweetText,
  generateSinglePainPointTweet,
  isClipboardSupported,
  type ImageFormat,
} from "@/lib/share/image-utils";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topic: string;
  painPoints: SearchResultItem[];
  summary?: string | null;
  /** Pre-selected pain point index for single share mode */
  selectedPainPointIndex?: number;
  mode: "screenshot" | "twitter";
}

type ShareVariant = "full" | "single";

/**
 * Modal for sharing/downloading pain point screenshots
 */
export function ShareModal({
  open,
  onOpenChange,
  topic,
  painPoints,
  summary,
  selectedPainPointIndex,
  mode,
}: ShareModalProps) {
  const [variant, setVariant] = useState<ShareVariant>(
    selectedPainPointIndex !== undefined ? "single" : "full"
  );
  const [selectedIndex, setSelectedIndex] = useState(selectedPainPointIndex ?? 0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setVariant(selectedPainPointIndex !== undefined ? "single" : "full");
      setSelectedIndex(selectedPainPointIndex ?? 0);
      setCopySuccess(false);
    }
  }, [open, selectedPainPointIndex]);

  const selectedPainPoint = painPoints[selectedIndex];
  const clipboardSupported = isClipboardSupported();

  /**
   * Capture and download image
   */
  const handleDownload = useCallback(
    async (format: ImageFormat) => {
      if (!cardRef.current) return;

      setIsCapturing(true);
      try {
        const blob = await captureElement(cardRef.current, { format });
        const filename = generateFilename(topic, variant);
        downloadImage(blob, filename, format);
      } catch (error) {
        console.error("Failed to capture image:", error);
      } finally {
        setIsCapturing(false);
      }
    },
    [topic, variant]
  );

  /**
   * Capture and copy to clipboard
   */
  const handleCopyToClipboard = useCallback(async () => {
    if (!cardRef.current) return;

    setIsCapturing(true);
    try {
      const blob = await captureElement(cardRef.current, { format: "png" });
      const success = await copyImageToClipboard(blob);
      if (success) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    } finally {
      setIsCapturing(false);
    }
  }, []);

  /**
   * Share on Twitter/X
   */
  const handleShareOnX = useCallback(async () => {
    // Generate tweet text
    let tweetText: string;
    if (variant === "full") {
      tweetText = generateTweetText(
        topic,
        painPoints.length,
        painPoints[0]?.painTitle
      );
    } else {
      tweetText = generateSinglePainPointTweet(
        topic,
        selectedPainPoint?.painTitle || "",
        selectedPainPoint?.mentions || 0
      );
    }

    // Build share URL
    const shareUrl = `${window.location.origin}/?q=${encodeURIComponent(topic)}`;
    const intentUrl = generateTwitterIntent(tweetText, shareUrl);

    // If in twitter mode, also capture and copy image first
    if (mode === "twitter" && cardRef.current && clipboardSupported) {
      setIsCapturing(true);
      try {
        const blob = await captureElement(cardRef.current, { format: "png" });
        await copyImageToClipboard(blob);
      } catch (error) {
        console.error("Failed to copy image for Twitter:", error);
      } finally {
        setIsCapturing(false);
      }
    }

    // Open Twitter intent
    window.open(intentUrl, "_blank", "noopener,noreferrer");
  }, [variant, topic, painPoints, selectedPainPoint, mode, clipboardSupported]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-card border border-border shadow-elevation-4 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <Dialog.Title className="text-lg font-semibold text-foreground">
                {mode === "twitter" ? "Share" : "Download Screenshot"}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground mt-0.5">
                {mode === "twitter"
                  ? "Image will be copied to clipboard. Paste it in your tweet."
                  : "Choose format and download your shareable image."}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon-sm" className="rounded-full">
                <X className="w-4 h-4" />
                <span className="sr-only">Close</span>
              </Button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="flex flex-col lg:flex-row gap-6 p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Options Panel */}
            <div className="lg:w-56 flex-shrink-0 space-y-4">
              {/* Variant Toggle */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                  Share Type
                </label>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setVariant("full")}
                    className={`cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-left ${
                      variant === "full"
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
                    }`}
                  >
                    <FileImage className="w-4 h-4" />
                    <div>
                      <div className="text-sm font-medium">Full Results</div>
                      <div className="text-xs opacity-70">All pain points</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setVariant("single")}
                    className={`cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-left ${
                      variant === "single"
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <div>
                      <div className="text-sm font-medium">Single Point</div>
                      <div className="text-xs opacity-70">With quotes</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Pain Point Selector (for single variant) */}
              {variant === "single" && painPoints.length > 1 && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                    Select Pain Point
                  </label>
                  <select
                    value={selectedIndex}
                    onChange={(e) => setSelectedIndex(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-secondary/30 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {painPoints.map((pp, i) => (
                      <option key={pp.id} value={i}>
                        #{i + 1}: {pp.painTitle.slice(0, 40)}...
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-border space-y-2">
                {mode === "twitter" ? (
                  <>
                    <Button
                      onClick={handleShareOnX}
                      disabled={isCapturing}
                      className="cursor-pointer w-full justify-center gap-2 bg-black hover:bg-black/90 text-white"
                    >
                      {isCapturing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      )}
                      Post on X
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Image copied to clipboard automatically
                    </p>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => handleDownload("png")}
                      disabled={isCapturing}
                      className="cursor-pointer w-full justify-center gap-2"
                    >
                      {isCapturing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      Download PNG
                    </Button>
                    <Button
                      onClick={() => handleDownload("jpeg")}
                      disabled={isCapturing}
                      variant="outline"
                      className="cursor-pointer w-full justify-center gap-2"
                    >
                      {isCapturing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      Download JPG
                    </Button>
                    {clipboardSupported && (
                      <Button
                        onClick={handleCopyToClipboard}
                        disabled={isCapturing}
                        variant="outline"
                        className="cursor-pointer w-full justify-center gap-2"
                      >
                        {isCapturing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : copySuccess ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        {copySuccess ? "Copied!" : "Copy to Clipboard"}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Preview Panel */}
            <div className="flex-1 min-w-0">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 block">
                Preview
              </label>
              <div className="bg-secondary/30 rounded-xl p-4 overflow-auto">
                <div className="inline-block">
                  {variant === "full" ? (
                    <ShareableCard
                      ref={cardRef}
                      variant="full"
                      topic={topic}
                      painPoints={painPoints}
                      summary={summary}
                    />
                  ) : selectedPainPoint ? (
                    <ShareableCard
                      ref={cardRef}
                      variant="single"
                      topic={topic}
                      painPoint={selectedPainPoint}
                      index={selectedIndex}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
