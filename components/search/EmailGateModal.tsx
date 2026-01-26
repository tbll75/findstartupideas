"use client";

import { useState, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, Mail, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmailGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  hasReachedLimit: boolean;
}

// Email validation regex - RFC 5322 compliant (simplified)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Sanitize input to prevent XSS
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .slice(0, 255); // Limit length
}

// Validate email format
function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  return EMAIL_REGEX.test(email);
}

// Validate name (optional, but if provided should be reasonable)
function isValidName(name: string): boolean {
  if (!name) return true; // Name is optional
  if (name.length > 100) return false;
  // Allow letters, spaces, hyphens, apostrophes
  return /^[a-zA-Z\s\-']+$/.test(name);
}

/**
 * Modal to collect user email for continued search access
 */
export function EmailGateModal({
  open,
  onOpenChange,
  onSuccess,
  hasReachedLimit,
}: EmailGateModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  /**
   * Validate form inputs
   */
  const validateForm = useCallback((): boolean => {
    let isValid = true;
    setNameError(null);
    setEmailError(null);

    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = sanitizeInput(email);

    if (sanitizedName && !isValidName(sanitizedName)) {
      setNameError("Please enter a valid name (letters only)");
      isValid = false;
    }

    if (!sanitizedEmail) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!isValidEmail(sanitizedEmail)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    }

    return isValid;
  }, [name, email]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);

      try {
        const sanitizedName = sanitizeInput(name);
        const sanitizedEmail = sanitizeInput(email);

        const response = await fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: sanitizedEmail,
            name: sanitizedName || undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          // If validation error from backend
          if (data.error) {
            setError(data.error);
          } else {
            setError("Something went wrong — but you're good to go!");
            // Still mark as success since the user provided their email
            onSuccess();
          }
          return;
        }

        // Success
        onSuccess();
      } catch (err) {
        console.error("Subscription error:", err);
        // Network error - still let them through
        setError("Something went wrong — but you're good to go!");
        onSuccess();
      } finally {
        setIsSubmitting(false);
      }
    },
    [name, email, validateForm, onSuccess]
  );

  /**
   * Handle modal close attempt
   */
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      // If user reached limit and tries to close, don't allow
      if (!newOpen && hasReachedLimit) {
        return;
      }
      onOpenChange(newOpen);
    },
    [hasReachedLimit, onOpenChange]
  );

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md overflow-hidden rounded-2xl bg-card border border-border shadow-elevation-4 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
          onPointerDownOutside={(e) => {
            // Prevent closing by clicking outside when limit reached
            if (hasReachedLimit) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            // Prevent closing by escape when limit reached
            if (hasReachedLimit) {
              e.preventDefault();
            }
          }}
        >
          {/* Header */}
          <div className="relative px-6 pt-6 pb-4">
            {/* Close button - only show if not at limit */}
            {!hasReachedLimit && (
              <Dialog.Close asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-4 top-4 rounded-full"
                >
                  <X className="w-4 h-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </Dialog.Close>
            )}

            {/* Icon */}
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>

            <Dialog.Title className="text-xl font-semibold text-foreground text-center">
              {hasReachedLimit
                ? "You've reached your limit"
                : "Unlock unlimited searches"}
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground mt-2 text-center">
              {hasReachedLimit
                ? "Enter your email to continue discovering startup ideas."
                : "Get unlimited access to discover validated startup ideas."}
            </Dialog.Description>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
            {/* Limit reached error banner */}
            {hasReachedLimit && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                You&apos;ve reached your limit — enter your email to continue.
              </div>
            )}

            {/* Name field (optional) */}
            <div className="space-y-2">
              <label
                htmlFor="gate-name"
                className="text-sm font-medium text-foreground flex items-center gap-2"
              >
                <User className="w-4 h-4 text-muted-foreground" />
                Name
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </label>
              <input
                id="gate-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError(null);
                }}
                placeholder="Your name"
                className={cn(
                  "w-full h-11 px-4 rounded-lg border bg-secondary/30 text-foreground placeholder:text-muted-foreground/50",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                  "transition-all duration-200",
                  nameError && "border-destructive focus:ring-destructive/20"
                )}
                disabled={isSubmitting}
                autoComplete="name"
              />
              {nameError && (
                <p className="text-xs text-destructive">{nameError}</p>
              )}
            </div>

            {/* Email field (required) */}
            <div className="space-y-2">
              <label
                htmlFor="gate-email"
                className="text-sm font-medium text-foreground flex items-center gap-2"
              >
                <Mail className="w-4 h-4 text-muted-foreground" />
                Email
                <span className="text-destructive">*</span>
              </label>
              <input
                id="gate-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(null);
                }}
                placeholder="you@example.com"
                className={cn(
                  "w-full h-11 px-4 rounded-lg border bg-secondary/30 text-foreground placeholder:text-muted-foreground/50",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                  "transition-all duration-200",
                  emailError && "border-destructive focus:ring-destructive/20"
                )}
                disabled={isSubmitting}
                autoComplete="email"
                required
              />
              {emailError && (
                <p className="text-xs text-destructive">{emailError}</p>
              )}
            </div>

            {/* General error */}
            {error && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm text-center">
                {error}
              </div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full h-11 bg-foreground text-background font-medium rounded-xl",
                "hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:-translate-y-0.5",
                "transition-all duration-300"
              )}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Subscribing...
                </span>
              ) : (
                "Continue"
              )}
            </Button>

            {/* Privacy note */}
            <p className="text-xs text-muted-foreground text-center">
              We respect your privacy. No spam, ever.
            </p>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
