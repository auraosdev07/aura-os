"use client";

import Link from "next/link";
import { Plug, Sparkles, Globe, Mail, MessageSquare, CreditCard, ChevronRight, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import type { IntegrationRow, IntegrationCardDefinition } from "@/types/integrations";

interface IntegrationsFeatureProps {
  initialIntegrations: IntegrationRow[];
}

const INTEGRATION_DEFINITIONS: IntegrationCardDefinition[] = [
  {
    slug: "aura-soul",
    name: "Aura & Soul",
    category: "E-Commerce",
    description: "Connect external live website (auraandsoul.in) Supabase database for AI synchronization.",
    iconName: "Sparkles",
    defaultStatus: "NOT_CONFIGURED",
    detailHref: "/integrations/aura-soul",
  },
  {
    slug: "google",
    name: "Google",
    category: "General",
    description: "Google Search Console, Analytics, and Workspace AI automation.",
    iconName: "Globe",
    defaultStatus: "COMING_SOON",
  },
  {
    slug: "meta",
    name: "Meta",
    category: "Marketing",
    description: "Meta Ads, Instagram Shopping, and Facebook Graph API automation.",
    iconName: "Globe",
    defaultStatus: "COMING_SOON",
  },
  {
    slug: "gmail",
    name: "Gmail",
    category: "Communication",
    description: "Customer inquiry dispatching, email support, and automated response drafting.",
    iconName: "Mail",
    defaultStatus: "COMING_SOON",
  },
  {
    slug: "whatsapp",
    name: "WhatsApp",
    category: "Communication",
    description: "WhatsApp Business API notifications, order alerts, and AI customer support.",
    iconName: "MessageSquare",
    defaultStatus: "COMING_SOON",
  },
  {
    slug: "razorpay",
    name: "Razorpay",
    category: "Payments",
    description: "Payment gateway transaction reconciliation, webhook events, and refund triggers.",
    iconName: "CreditCard",
    defaultStatus: "COMING_SOON",
  },
];

export function IntegrationsFeature({ initialIntegrations }: IntegrationsFeatureProps) {
  const getIntegrationStatus = (def: IntegrationCardDefinition) => {
    const matched = initialIntegrations.find((i) => i.slug === def.slug);
    if (matched) return matched.status;
    return def.defaultStatus;
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "Sparkles":
        return <Sparkles className="w-6 h-6 text-emerald-400" />;
      case "Mail":
        return <Mail className="w-6 h-6 text-blue-400" />;
      case "MessageSquare":
        return <MessageSquare className="w-6 h-6 text-emerald-400" />;
      case "CreditCard":
        return <CreditCard className="w-6 h-6 text-amber-400" />;
      default:
        return <Globe className="w-6 h-6 text-slate-400" />;
    }
  };

  const renderStatusBadge = (status: string) => {
    if (status === "CONNECTED") {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" />
          <span>Connected</span>
        </span>
      );
    }
    if (status === "NOT_CONFIGURED") {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <AlertCircle className="w-3 h-3" />
          <span>Not Configured</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
        <Clock className="w-3 h-3" />
        <span>Coming Soon</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Plug className="w-7 h-7 text-emerald-400" /> Integrations Framework
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Connect third-party platforms, APIs, and external databases to empower Aura OS AI agents.
        </p>
      </div>

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {INTEGRATION_DEFINITIONS.map((def) => {
          const status = getIntegrationStatus(def);
          const isClickable = Boolean(def.detailHref);

          const CardContent = (
            <div
              className={`p-6 rounded-2xl bg-slate-900 border transition-all h-full flex flex-col justify-between ${
                isClickable
                  ? "border-slate-800 hover:border-emerald-500/50 cursor-pointer shadow-lg hover:shadow-emerald-500/5"
                  : "border-slate-800/60 opacity-80"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                    {renderIcon(def.iconName)}
                  </div>
                  {renderStatusBadge(status)}
                </div>

                <h3 className="text-base font-semibold text-slate-100 flex items-center gap-1.5">
                  {def.name}
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded font-mono">
                    {def.category}
                  </span>
                </h3>

                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{def.description}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs">
                {isClickable ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    Configure Settings <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <span className="text-slate-500 font-medium">Integration Framework Ready</span>
                )}
              </div>
            </div>
          );

          if (isClickable && def.detailHref) {
            return (
              <Link key={def.slug} href={def.detailHref}>
                {CardContent}
              </Link>
            );
          }

          return <div key={def.slug}>{CardContent}</div>;
        })}
      </div>
    </div>
  );
}
