"use client";

import React, { useState, useTransition, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Rocket,
  CheckCircle2,
  Sparkles,
  Globe,
  User,
  ArrowRight,
  Upload,
  X,
  Image as ImageIcon,
} from "lucide-react";
import {
  submitStartupAction,
  updateStartupAction,
  uploadStartupImageAction,
  confirmPaymentAction,
} from "@/server/actions";
import { openRazorpayCheckout } from "@/lib/razorpay-client";
import { CATEGORIES, STAGES } from "@/lib/validation";
import { TurnstileWidget } from "@/components/common/turnstile";
import { isAllowedImageUrl } from "@/lib/images";
import { CreditCard } from "lucide-react";
import type { Startup } from "@/db/schema";

interface SubmitFormProps {
  countries: Array<{ code: string; name: string }>;
  userDisplayName?: string;
  initialStartup?: Partial<Startup>;
  formattedPrice?: string;
}

export function SubmitStartupForm({
  countries,
  userDisplayName,
  initialStartup,
  formattedPrice = "$10.00 USD",
}: SubmitFormProps) {
  const isEditing = Boolean(initialStartup?.id);

  const [name, setName] = useState(initialStartup?.name || "");
  const [tagline, setTagline] = useState(initialStartup?.tagline || "");
  const [description, setDescription] = useState(initialStartup?.description || "");
  const [category, setCategory] = useState<string>(
    initialStartup?.category || CATEGORIES[0]
  );
  const [stage, setStage] = useState<string>(initialStartup?.stage || STAGES[0]);
  const [countryCode, setCountryCode] = useState<string>(
    initialStartup?.countryCode || "US"
  );
  const [city, setCity] = useState(initialStartup?.city || "");
  const [region, setRegion] = useState(initialStartup?.region || "");
  const [remoteFirst, setRemoteFirst] = useState(
    Boolean(initialStartup?.remoteFirst)
  );
  const [websiteUrl, setWebsiteUrl] = useState(initialStartup?.websiteUrl || "");
  const [problemStatement, setProblemStatement] = useState(
    initialStartup?.problem || ""
  );
  const [solutionDescription, setSolutionDescription] = useState(
    initialStartup?.solution || ""
  );
  const [techStackInput, setTechStackInput] = useState(
    Array.isArray(initialStartup?.techStackJson)
      ? (initialStartup.techStackJson as string[]).join(", ")
      : ""
  );
  const [keyFeaturesInput, setKeyFeaturesInput] = useState(
    Array.isArray(initialStartup?.keyFeaturesJson)
      ? (initialStartup.keyFeaturesJson as string[]).join(", ")
      : ""
  );
  const [traction, setTraction] = useState(initialStartup?.traction || "");

  const initialFounder = (initialStartup?.founderJson || {}) as {
    name?: string;
    role?: string;
    quote?: string;
  };
  const [founderName, setFounderName] = useState(
    initialFounder.name || userDisplayName || ""
  );
  const [founderRole, setFounderRole] = useState(
    initialFounder.role || "Founder & CEO"
  );
  const [founderQuote, setFounderQuote] = useState(
    initialFounder.quote || ""
  );

  // Image upload states
  const [logoUrl, setLogoUrl] = useState<string>(initialStartup?.thumbnail || "");
  const [coverUrl, setCoverUrl] = useState<string>(initialStartup?.coverImage || "");
  const [logoUploading, setLogoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState("");
  const [coverUploadError, setCoverUploadError] = useState("");

  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // CAPTCHA token
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);

  const [error, setError] = useState("");
  const [submittedStartup, setSubmittedStartup] = useState<{
    id: string;
    name: string;
    slug: string;
  } | null>(null);
  const [pendingPayment, setPendingPayment] = useState<{
    startup: { id: string; name: string; slug: string };
    order: { orderId: string; amount: number; currency: string; keyId: string };
  } | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "cover"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "logo") {
      setLogoUploading(true);
      setLogoUploadError("");
    } else {
      setCoverUploading(true);
      setCoverUploadError("");
    }

    try {
      // Client-side quick validation before upload
      if (file.size > 2 * 1024 * 1024) {
        throw new Error("File exceeds 2 MB limit. Please choose a smaller image.");
      }
      if (
        !["image/png", "image/jpeg", "image/webp"].includes(file.type.toLowerCase())
      ) {
        throw new Error(
          "Invalid file type. Only PNG, JPEG, and WebP are allowed (SVGs are rejected)."
        );
      }

      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadStartupImageAction(formData);

      if (!res.success) {
        if (type === "logo") setLogoUploadError(res.error);
        else setCoverUploadError(res.error);
      } else {
        if (type === "logo") setLogoUrl(res.url);
        else setCoverUrl(res.url);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload image.";
      if (type === "logo") setLogoUploadError(msg);
      else setCoverUploadError(msg);
    } finally {
      if (type === "logo") setLogoUploading(false);
      else setCoverUploading(false);
      // Reset input value so same file can be re-selected if desired
      e.target.value = "";
    }
  };

  const triggerCheckout = async (data: {
    startup: { id: string; name: string; slug: string };
    order: { orderId: string; amount: number; currency: string; keyId: string };
  }) => {
    setPaymentError("");
    const opened = await openRazorpayCheckout({
      keyId: data.order.keyId,
      orderId: data.order.orderId,
      amount: data.order.amount,
      currency: data.order.currency,
      startupName: data.startup.name,
      userName: founderName || userDisplayName,
      onSuccess: async (rzpRes) => {
        setVerifyingPayment(true);
        const confirmRes = await confirmPaymentAction({
          startupId: data.startup.id,
          razorpayOrderId: rzpRes.razorpay_order_id,
          razorpayPaymentId: rzpRes.razorpay_payment_id,
          razorpaySignature: rzpRes.razorpay_signature,
        });
        setVerifyingPayment(false);
        if (confirmRes?.success) {
          setPendingPayment(null);
          setSubmittedStartup({
            id: data.startup.id,
            name: data.startup.name,
            slug: data.startup.slug,
          });
        } else {
          setPaymentError(
            confirmRes?.error ||
              "Payment verification timed out. If payment was deducted, our webhook will verify your submission automatically."
          );
        }
      },
      onDismiss: () => {
        // Keeps user on pending payment screen
      },
    });

    if (!opened) {
      setPaymentError(
        "We couldn't open the payment window. Turn off your ad blocker or Brave Shields for this site, then click Pay again."
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const techStack = techStackInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const keyFeatures = keyFeaturesInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      name,
      tagline,
      description,
      category,
      stage,
      countryCode,
      city: city || undefined,
      region: region || undefined,
      remoteFirst,
      websiteUrl: websiteUrl || undefined,
      thumbnail: logoUrl || undefined,
      coverImage: coverUrl || undefined,
      problem: problemStatement || undefined,
      solution: solutionDescription || undefined,
      techStack: techStack.length > 0 ? techStack : undefined,
      keyFeatures: keyFeatures.length > 0 ? keyFeatures : undefined,
      traction: traction || undefined,
      founder: {
        name: founderName || userDisplayName || "Founder",
        role: founderRole || "Founder",
        quote: founderQuote || "",
      },
      captchaToken: captchaToken || undefined,
    };

    startTransition(async () => {
      try {
        if (isEditing && initialStartup?.id) {
          const res = await updateStartupAction(initialStartup.id, payload);
          if (res?.error) {
            setError(res.error);
            setCaptchaToken("");
            setCaptchaResetSignal((prev) => prev + 1);
          } else if (res?.startup) {
            setSubmittedStartup({
              id: res.startup.id,
              name: res.startup.name,
              slug: res.startup.slug,
            });
          }
        } else {
          const res = await submitStartupAction(payload);
          if (res?.error) {
            setError(res.error);
            setCaptchaToken("");
            setCaptchaResetSignal((prev) => prev + 1);
          } else if (res?.startup) {
            if (res.paymentRequired && res.order) {
              const orderData = {
                startup: { id: res.startup.id, name: res.startup.name, slug: res.startup.slug },
                order: res.order,
              };
              setPendingPayment(orderData);
              triggerCheckout(orderData);
            } else {
              setSubmittedStartup({
                id: res.startup.id,
                name: res.startup.name,
                slug: res.startup.slug,
              });
            }
          } else {
            setError("No response from the server. Please try again.");
          }
        }
      } catch {
        setError("Something went wrong submitting your startup. Please try again.");
        setCaptchaToken("");
        setCaptchaResetSignal((prev) => prev + 1);
      }
    });
  };

  if (pendingPayment) {
    return (
      <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
          {verifyingPayment ? (
            <Sparkles className="w-8 h-8 animate-spin text-blue-600" />
          ) : (
            <CreditCard className="w-8 h-8" />
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {verifyingPayment
              ? "Verifying Payment..."
              : `Payment Pending for "${pendingPayment.startup.name}"`}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            {verifyingPayment
              ? "Please wait while our server authoritatively verifies your payment signature with Razorpay."
              : `Your startup submission details are securely saved as awaiting payment. To enter the review queue, complete the one-time ${formattedPrice} listing fee.`}
          </p>
        </div>

        {paymentError && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 font-medium max-w-md mx-auto">
            {paymentError}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {!verifyingPayment && (
            <button
              type="button"
              onClick={() => triggerCheckout(pendingPayment)}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Pay Listing Fee ({formattedPrice})</span>
            </button>
          )}
          <Link
            href="/me/submissions"
            className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
          >
            Go to My Submissions
          </Link>
        </div>
      </div>
    );
  }

  if (submittedStartup) {
    return (
      <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {isEditing ? "Startup Updated Successfully!" : "Payment Verified & Submitted for Review!"}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            {isEditing
              ? `Your changes for "${submittedStartup.name}" have been saved and remain in the review queue.`
              : `Your payment was confirmed and "${submittedStartup.name}" has officially entered our admin review queue! We have sent a confirmation receipt to your email.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/me/submissions"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-xs"
          >
            Go to My Submissions
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
          >
            Explore Directory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 font-medium">
          {error}
        </div>
      )}

      {/* 1. Basic Info */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Rocket className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Startup Essentials
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Startup Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme AI, TerraVolt"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Tagline (One-liner pitch) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              minLength={10}
              maxLength={160}
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Autonomous irrigation networks powered by edge intelligence"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              minLength={20}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you are building, how it works, and why it matters..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Primary Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Maturity Stage <span className="text-red-500">*</span>
            </label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {STAGES.map((stg) => (
                <option key={stg} value={stg}>
                  {stg}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Visuals & File Uploads (Supabase Storage) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <ImageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Branding & Visuals (Uploads)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Logo / Thumbnail Upload */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Startup Logo (PNG, JPEG, WebP &bull; Max 2 MB)
            </label>

            {logoUrl && isAllowedImageUrl(logoUrl) ? (
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 group">
                <Image
                  src={logoUrl}
                  alt="Uploaded Logo"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => setLogoUrl("")}
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity"
                  title="Remove Logo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  ref={logoFileInputRef}
                  onChange={(e) => handleFileUpload(e, "logo")}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={logoUploading}
                  onClick={() => logoFileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 transition-colors text-slate-600 dark:text-slate-300 cursor-pointer disabled:opacity-60"
                >
                  <Upload className="w-6 h-6 mb-2 text-slate-400" />
                  <span className="text-xs font-bold">
                    {logoUploading ? "Uploading & Verifying..." : "Upload Logo Image"}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">
                    PNG, JPEG, WebP up to 2MB
                  </span>
                </button>
              </div>
            )}
            {logoUploadError && (
              <p className="text-xs text-red-500 font-medium">{logoUploadError}</p>
            )}
          </div>

          {/* Cover Image Upload */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Cover Image / Banner (PNG, JPEG, WebP &bull; Max 2 MB)
            </label>

            {coverUrl && isAllowedImageUrl(coverUrl) ? (
              <div className="relative w-full h-24 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 group">
                <Image
                  src={coverUrl}
                  alt="Uploaded Cover"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => setCoverUrl("")}
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity"
                  title="Remove Cover Image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  ref={coverFileInputRef}
                  onChange={(e) => handleFileUpload(e, "cover")}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={coverUploading}
                  onClick={() => coverFileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 transition-colors text-slate-600 dark:text-slate-300 cursor-pointer disabled:opacity-60"
                >
                  <Upload className="w-6 h-6 mb-2 text-slate-400" />
                  <span className="text-xs font-bold">
                    {coverUploading ? "Uploading & Verifying..." : "Upload Cover Image"}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">
                    Landscape banner image up to 2MB
                  </span>
                </button>
              </div>
            )}
            {coverUploadError && (
              <p className="text-xs text-red-500 font-medium">{coverUploadError}</p>
            )}
          </div>
        </div>
      </div>

      {/* 3. Location & Geography */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Geography & Origin
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Country <span className="text-red-500">*</span>
            </label>
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              City (Optional)
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Berlin, Austin, Tokyo"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              State / Province / Region
            </label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g. Bavaria, California, Kanto"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-3 flex items-center gap-2">
            <input
              type="checkbox"
              id="remoteFirst"
              checked={remoteFirst}
              onChange={(e) => setRemoteFirst(e.target.checked)}
              className="w-4 h-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="remoteFirst"
              className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
            >
              This is a remote-first / distributed startup
            </label>
          </div>
        </div>
      </div>

      {/* 4. Links & Product Details */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Links & Product Details
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Website URL
            </label>
            <input
              type="text"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Problem Statement
            </label>
            <textarea
              rows={2}
              maxLength={1000}
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              placeholder="What specific friction or challenge are your users dealing with?"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Solution Description
            </label>
            <textarea
              rows={2}
              maxLength={1000}
              value={solutionDescription}
              onChange={(e) => setSolutionDescription(e.target.value)}
              placeholder="How does your technology solve this uniquely?"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Technologies / Tech Stack (Comma-separated)
            </label>
            <input
              type="text"
              value={techStackInput}
              onChange={(e) => setTechStackInput(e.target.value)}
              placeholder="e.g. Next.js, PyTorch, Supabase, Rust"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Key Features (Comma-separated)
            </label>
            <input
              type="text"
              value={keyFeaturesInput}
              onChange={(e) => setKeyFeaturesInput(e.target.value)}
              placeholder="e.g. Real-time telemetry, AI forecasting, Multi-tenant"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Current Traction / Milestones (Optional)
            </label>
            <input
              type="text"
              maxLength={500}
              value={traction}
              onChange={(e) => setTraction(e.target.value)}
              placeholder="e.g. 500 active beta testers, $12k ARR, closed $100k pre-seed"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 5. Founder Profile */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Founder Details
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Founder Name
            </label>
            <input
              type="text"
              value={founderName}
              onChange={(e) => setFounderName(e.target.value)}
              placeholder="e.g. Sarah Connor"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Founder Role / Title
            </label>
            <input
              type="text"
              value={founderRole}
              onChange={(e) => setFounderRole(e.target.value)}
              placeholder="e.g. Co-Founder & CTO"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Founder Vision / Quote (Optional)
            </label>
            <input
              type="text"
              maxLength={500}
              value={founderQuote}
              onChange={(e) => setFounderQuote(e.target.value)}
              placeholder="e.g. We are building the operating system for zero-emission transit."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Cloudflare Turnstile CAPTCHA */}
      <TurnstileWidget
        onVerify={(token) => setCaptchaToken(token)}
        onExpire={() => setCaptchaToken("")}
        resetSignal={captchaResetSignal}
      />

      {/* Price line for new submissions */}
      {!isEditing && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Review &amp; Listing Fee
              </p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Listing fee: <span className="font-extrabold text-blue-600 dark:text-blue-400">{formattedPrice}</span>, one time, secure payment by Razorpay
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            USD only &bull; Instant checkout
          </div>
        </div>
      )}

      {/* Submit / Save Button */}
      <div className="flex items-center justify-end gap-4">
        <button
          type="submit"
          disabled={isPending || logoUploading || coverUploading}
          className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-60 flex items-center gap-2 cursor-pointer"
        >
          {isPending ? (
            <span>{isEditing ? "Saving Changes..." : "Processing Order..."}</span>
          ) : (
            <>
              <span>{isEditing ? "Save Changes" : "Submit and pay"}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
