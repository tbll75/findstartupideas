"use client";

import { useState, useCallback } from "react";
import { Link2, Camera, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareModal } from "./share-modal";
import type { SearchResultItem } from "@/types";

interface ShareToolbarProps {
  topic: string;
  painPoints: SearchResultItem[];
  summary?: string | null;
}

/**
 * Toolbar with share buttons for pain point results
 * Appears below the AI Analysis header when results are available
 */
export function ShareToolbar({
  topic,
  painPoints,
  summary,
}: ShareToolbarProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"screenshot" | "twitter">(
    "screenshot"
  );

  /**
   * Copy current URL to clipboard
   */
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  }, []);

  /**
   * Open modal for Twitter sharing
   */
  const handleShareOnX = useCallback(() => {
    setModalMode("twitter");
    setModalOpen(true);
  }, []);

  /**
   * Open modal for screenshot
   */
  const handleScreenshot = useCallback(() => {
    setModalMode("screenshot");
    setModalOpen(true);
  }, []);

  // Don't show if no pain points
  if (painPoints.length === 0) return null;

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Copy Link Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className="gap-1.5 text-xs"
        >
          {copySuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-600" />
              <span className="text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <Link2 className="w-3.5 h-3.5" />
              Copy Link
            </>
          )}
        </Button>

        {/* Share on X Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleShareOnX}
          className="gap-1.5 text-xs"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Share on X
        </Button>

        {/* Screenshot Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleScreenshot}
          className="gap-1.5 text-xs"
        >
          <Camera className="w-3.5 h-3.5" />
          Screenshot
        </Button>
      </div>

      {/* Share Modal */}
      <ShareModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        topic={topic}
        painPoints={painPoints}
        summary={summary}
        mode={modalMode}
      />
    </>
  );
}
