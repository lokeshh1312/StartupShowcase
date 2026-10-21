import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Eye,
  MapPin,
  Calendar,
  Sparkles,
  Target,
  Zap,
  Cpu,
  BarChart3,
  Quote,
} from "lucide-react";
import { getStartupBySlug, listStartups } from "@/server/startups";
import { getCurrentUser } from "@/lib/supabase/server";
import { formatLocation, getCountryName } from "@/lib/validation";
import type { FounderInfo } from "@/db/schema";
import { StartupLogo } from "@/components/common/startup-logo";
import { Badge, StageBadge } from "@/components/common/badge";
import { VoteButton } from "@/components/startup/vote-button";
import { SaveButton } from "@/components/startup/save-button";
import { ShareButton } from "@/components/startup/share-modal";
import { CommentsSection } from "@/components/startup/comments-section";
import { StartupCard } from "@/components/startup/startup-card";
import {
  createMetadata,
  buildStartupJsonLd,
  buildBreadcrumbJsonLd,
} from "@/lib/seo";
import { JsonLd } from "@/components/common/json-ld";
import { absoluteUrl } from "@/lib/urls";
import type { Metadata } from "next";

interface StartupPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: StartupPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getStartupBySlug(slug);
  if (!result) {
    return {
      title: "Startup Not Found | Startup Showcase",
      robots: { index: false, follow: false },
    };
  }

  const { startup } = result;
  const tagline = startup.tagline || startup.ideaTitle || "Early-stage startup";
  const title = `${startup.name}: ${tagline} | Startup Showcase`;
  const description = startup.description || tagline;

  // =========================================================================
  // CRITICAL REQUIREMENT:
  // Sample startups (is_sample = true) are fake test data for development/demo.
  // Their pages MUST be served with `noindex, nofollow` to prevent search engines
  // from indexing placeholder content before production launch.
  // =========================================================================
  const robots = startup.isSample
    ? { index: false, follow: false }
    : { index: true, follow: true };

  return createMetadata({
    title,
    description,
    path: `/startup/${startup.slug}`,
    robots,
    image: absoluteUrl(`/startup/${startup.slug}/opengraph-image`),
    type: "article",
  });
}

export default async function StartupDetailPage({ params }: StartupPageProps) {
  const { slug } = await params;
  const user = await getCurrentUser();

  const data = await getStartupBySlug(slug, user?.id);

  if (!data) {
    notFound();
  }

  const { startup, comments } = data;

  // Fetch 3 related startups from same category
  const relatedResult = await listStartups(
    { category: startup.category, pageSize: 4 },
    user?.id
  );
  const relatedStartups = relatedResult.items.filter((s) => s.id !== startup.id).slice(0, 3);

  const locationText = formatLocation({
    countryCode: startup.countryCode,
    region: startup.region,
    city: startup.city,
    remoteFirst: startup.remoteFirst,
  });

  const founderObj = (startup.founderJson || {}) as FounderInfo;
  const techStackList = (startup.techStackJson || []) as string[];
  const keyFeaturesList = (startup.keyFeaturesJson || []) as string[];

  // JSON-LD Structured Data: SoftwareApplication & BreadcrumbList
  const startupJsonLd = buildStartupJsonLd(startup);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Directory", path: "/browse" },
    { name: startup.category, path: `/categories/${startup.category.toLowerCase()}` },
    { name: startup.name, path: `/startup/${startup.slug}` },
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Structured Data: SoftwareApplication & BreadcrumbList */}
      <JsonLd data={startupJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Discovery</span>
        </Link>

        <div className="flex items-center gap-2">
          <ShareButton name={startup.name} slug={startup.slug} tagline={startup.tagline} />
          <SaveButton
            startupId={startup.id}
            initialSaved={Boolean(startup.isSaved)}
            size="default"
          />
        </div>
      </div>

      {/* Main Profile Header */}
      <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-5">
            <StartupLogo
              name={startup.name}
              category={startup.category}
              logoType={startup.logoType}
              logoColor={startup.logoColor}
              size="xl"
            />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {startup.name}
                </h1>
                <StageBadge stage={startup.stage} />
                <Badge variant="blue">{startup.category}</Badge>
              </div>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium max-w-2xl">
                {startup.tagline || startup.ideaTitle}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="grow sm:grow-0">
              <VoteButton
                startupId={startup.id}
                initialLikes={startup.likes}
                initialLiked={Boolean(startup.isLiked)}
                size="lg"
              />
            </div>

            {startup.websiteUrl && (
              <a
                href={startup.websiteUrl}
                target="_blank"
                rel="ugc nofollow noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-xs"
              >
                <span>Visit Website</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Metadata Badges Bar */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="inline-flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>{locationText || getCountryName(startup.countryCode)}</span>
          </div>

          <div className="inline-flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Cohort {startup.monthLabel}</span>
          </div>

          <div className="inline-flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-slate-400" />
            <span>{startup.views} views</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Overview */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>About the Product</span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {startup.description}
            </p>
            {startup.fullStory && startup.fullStory !== startup.description && (
              <div className="pt-2 text-xs text-slate-500 leading-relaxed whitespace-pre-line border-t border-slate-100 dark:border-slate-800">
                {startup.fullStory}
              </div>
            )}
          </div>

          {/* Problem & Solution */}
          {(startup.problem || startup.solution) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {startup.problem && (
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                    <Target className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">The Problem</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {startup.problem}
                  </p>
                </div>
              )}

              {startup.solution && (
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Our Solution</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {startup.solution}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tech Stack & Key Features */}
          {(techStackList.length > 0 || keyFeaturesList.length > 0) && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Technologies & Features</span>
              </h2>

              {techStackList.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tech Stack</p>
                  <div className="flex flex-wrap gap-2">
                    {techStackList.map((tech: string) => (
                      <span
                        key={tech}
                        className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {keyFeaturesList.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Key Highlights</p>
                  <div className="flex flex-wrap gap-2">
                    {keyFeaturesList.map((feat: string) => (
                      <span
                        key={feat}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-medium"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Community Discussion */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <CommentsSection
              startupSlug={startup.slug}
              initialComments={comments}
              currentUser={user}
            />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Founder Spotlight Card */}
          {founderObj && founderObj.name && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Founder Spotlight
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold text-sm flex items-center justify-center shrink-0">
                  {founderObj.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {founderObj.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {founderObj.role || "Founder"}
                  </p>
                </div>
              </div>

              {founderObj.quote && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs italic text-slate-600 dark:text-slate-300 relative">
                  <Quote className="w-3.5 h-3.5 text-blue-500 mb-1" />
                  &ldquo;{founderObj.quote}&rdquo;
                </div>
              )}
            </div>
          )}

          {/* Traction / Milestones */}
          {startup.traction && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                <span>Traction & Milestones</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {startup.traction}
              </p>
            </div>
          )}

          {/* Related Startups */}
          {relatedStartups.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                More in {startup.category}
              </h3>
              <div className="space-y-3">
                {relatedStartups.map((item) => (
                  <StartupCard key={item.id} startup={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
