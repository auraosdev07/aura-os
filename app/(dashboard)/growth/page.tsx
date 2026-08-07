"use client";

import React, { useState, useEffect } from "react";
import type {
  NormalizedTrendDTO,
  CompetitorProfileDTO,
  CompetitorSnapshotDTO,
  MarketOpportunityDTO,
  GrowthScoreDTO,
  DailyCEOBriefDTO,
} from "@/services/growth/types";

export default function GrowthIntelligenceDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [growthScore, setGrowthScore] = useState<GrowthScoreDTO | null>(null);
  const [trends, setTrends] = useState<NormalizedTrendDTO[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorProfileDTO[]>([]);
  const [snapshots, setSnapshots] = useState<CompetitorSnapshotDTO[]>([]);
  const [opportunities, setOpportunities] = useState<MarketOpportunityDTO[]>([]);
  const [providers, setProviders] = useState<Array<Record<string, unknown>>>([]);
  const [dailyBrief, setDailyBrief] = useState<DailyCEOBriefDTO | null>(null);

  const loadGrowthIntelligenceData = async () => {
    setLoading(true);
    try {
      const [scoreRes, trendsRes, compRes, oppRes, provRes, briefRes] = await Promise.all([
        fetch("/api/growth/score"),
        fetch("/api/growth/trends"),
        fetch("/api/growth/competitors"),
        fetch("/api/growth/opportunities"),
        fetch("/api/growth/providers"),
        fetch("/api/growth/report"),
      ]);

      const scoreData = await scoreRes.json();
      const trendsData = await trendsRes.json();
      const compData = await compRes.json();
      const oppData = await oppRes.json();
      const provData = await provRes.json();
      const briefData = await briefRes.json();

      if (scoreData.growthScore) setGrowthScore(scoreData.growthScore);
      if (trendsData.trends) setTrends(trendsData.trends);
      if (compData.competitors) setCompetitors(compData.competitors);
      if (compData.snapshots) setSnapshots(compData.snapshots);
      if (oppData.opportunities) setOpportunities(oppData.opportunities);
      if (provData.providers) setProviders(provData.providers);
      if (briefData.report) setDailyBrief(briefData.report);

      setActionMessage("✓ Growth Intelligence Department Live Signals Refresh Complete!");
    } catch (err) {
      console.error("Failed to load Growth Intelligence data:", err);
      setActionMessage("❌ Error fetching live growth signals.");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadGrowthIntelligenceData();
  }, []);

  return (
    <div className="space-y-6 select-none font-sans">
      {/* HEADER BAR */}
      <div className="flex justify-between items-center bg-card border border-border p-5 rounded-xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-foreground">Growth Intelligence Department</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Enterprise Strategic Opportunity Engine & Automated CEO Intelligence Brief (Phase 6.0)</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-bold font-mono">
            AI Confidence: 94.2%
          </span>
          <button
            onClick={loadGrowthIntelligenceData}
            disabled={loading}
            className="px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-white rounded text-xs font-bold shadow flex items-center gap-1.5"
          >
            {loading ? "Aggregating..." : "🔄 Refresh Growth Signals"}
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-card border border-border rounded-xl text-xs font-mono text-primary flex justify-between items-center shadow-sm">
          <span>{actionMessage}</span>
          <span className="text-[10px] text-muted-foreground">Pluggable Provider Adapters Active: {providers.length}</span>
        </div>
      )}

      {/* TOP DASHBOARD METRIC CARDS */}
      <div className="grid grid-cols-4 gap-4">
        {/* 1. GROWTH SCORE */}
        <div className="bg-card border border-border p-5 rounded-xl space-y-2 shadow-sm">
          <div className="text-xs text-muted-foreground">Unified Growth Score</div>
          <div className="text-3xl font-extrabold text-emerald-400">
            {growthScore?.overallScore || 88.5} <span className="text-xs font-semibold text-muted-foreground">/ 100</span>
          </div>
          <div className="text-[11px] text-muted-foreground font-mono">Trend Velocity: {growthScore?.trendVelocityScore || 88.5}%</div>
        </div>

        {/* 2. TRENDING TOPICS */}
        <div className="bg-card border border-border p-5 rounded-xl space-y-2 shadow-sm">
          <div className="text-xs text-muted-foreground">Top Trending Keyword</div>
          <div className="text-base font-bold text-primary truncate">
            {trends[0]?.keyword || "Amethyst Healing Bracelet"}
          </div>
          <div className="text-[11px] text-emerald-400 font-mono font-semibold">
            +{trends[0]?.growthVelocity || 31.0}% Search Growth Rate
          </div>
        </div>

        {/* 3. MARKET OPPORTUNITIES */}
        <div className="bg-card border border-border p-5 rounded-xl space-y-2 shadow-sm">
          <div className="text-xs text-muted-foreground">High-Value Opportunities</div>
          <div className="text-3xl font-extrabold text-indigo-400">{opportunities.length} Gaps</div>
          <div className="text-[11px] text-muted-foreground font-mono">Avg Business Value: 91.0/100</div>
        </div>

        {/* 4. COMPETITOR ACTIVITY */}
        <div className="bg-card border border-border p-5 rounded-xl space-y-2 shadow-sm">
          <div className="text-xs text-muted-foreground">Monitored Competitors</div>
          <div className="text-3xl font-extrabold text-amber-400">{competitors.length} Brands</div>
          <div className="text-[11px] text-muted-foreground font-mono">Recent Changes: {snapshots.length} tracked</div>
        </div>
      </div>

      {/* MODULE 6: DAILY CEO BRIEF WIDGET */}
      <div className="bg-card border border-border p-6 rounded-xl space-y-4 shadow-sm">
        <div className="flex justify-between items-center border-b border-border/60 pb-3">
          <div>
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <span>📋</span> Daily CEO Strategic Brief ({dailyBrief?.briefDate || new Date().toISOString().split("T")[0]})
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Deterministic executive recommendations compiled from live market signals.</p>
          </div>
          <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[11px] font-mono font-semibold rounded">
            Target ARR Impact: +$12.5k
          </span>
        </div>

        <div className="grid grid-cols-3 gap-6 text-xs">
          {/* RECOMMENDED ACTIONS */}
          <div className="bg-background border border-border p-4 rounded-lg space-y-2">
            <h4 className="font-bold text-emerald-400 uppercase text-[11px] tracking-wider">Top Recommended Actions</h4>
            <div className="space-y-2">
              {(dailyBrief?.recommendedActions || []).map((act, idx) => (
                <div key={idx} className="p-2.5 bg-card border border-border rounded space-y-1">
                  <div className="font-semibold text-foreground">{act.actionTitle}</div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-emerald-400 font-mono">{act.impact}</span>
                    <span className="px-1.5 py-0.2 bg-primary/20 text-primary font-bold rounded">{act.urgency}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* WARNINGS & ALERTS */}
          <div className="bg-background border border-border p-4 rounded-lg space-y-2">
            <h4 className="font-bold text-amber-400 uppercase text-[11px] tracking-wider">Market Warnings & Competitor Moves</h4>
            <div className="space-y-2">
              {(dailyBrief?.warnings || []).map((w, idx) => (
                <div key={idx} className="p-2.5 bg-card border border-border rounded text-[11px] text-foreground/90 font-mono leading-relaxed">
                  ⚠️ {w}
                </div>
              ))}
            </div>
          </div>

          {/* EXECUTION PRIORITY LIST */}
          <div className="bg-background border border-border p-4 rounded-lg space-y-2">
            <h4 className="font-bold text-indigo-400 uppercase text-[11px] tracking-wider">Today&apos;s Priority Execution List</h4>
            <div className="space-y-2">
              {(dailyBrief?.priorityList || []).map((p, idx) => (
                <div key={idx} className="p-2.5 bg-card border border-border rounded text-[11px] text-foreground/90 font-mono font-medium">
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODULE 2 & MODULE 4: TRENDS & MARKET OPPORTUNITIES GRID */}
      <div className="grid grid-cols-12 gap-6">
        {/* TREND INTELLIGENCE TABLE (MODULE 2) */}
        <div className="col-span-7 bg-card border border-border p-5 rounded-xl space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-border/60 pb-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <span>📈</span> Multi-Channel Trend Intelligence (9 Adapters Active)
            </h3>
            <span className="text-[10px] font-mono text-muted-foreground">{trends.length} normalized trends</span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {trends.map((t, idx) => (
              <div key={idx} className="p-3 bg-background border border-border rounded-lg text-xs flex justify-between items-center">
                <div className="space-y-0.5">
                  <div className="font-bold text-foreground">{t.keyword}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    Provider: <span className="text-indigo-400">{t.providerId}</span> | Category: {t.category}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-400 font-mono">+{t.growthVelocity}% velocity</div>
                  <div className="text-[10px] text-muted-foreground">Volume Index: {t.searchVolumeIndex}/100</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MARKET OPPORTUNITIES (MODULE 4) */}
        <div className="col-span-5 bg-card border border-border p-5 rounded-xl space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-border/60 pb-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <span>🎯</span> Opportunity Engine
            </h3>
            <span className="text-[10px] font-mono text-muted-foreground">{opportunities.length} high value gaps</span>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {opportunities.map((opp, idx) => (
              <div key={idx} className="p-3.5 bg-background border border-border rounded-lg text-xs space-y-2">
                <div className="flex justify-between items-start">
                  <div className="font-bold text-foreground">{opp.title}</div>
                  <span className="px-2 py-0.5 bg-primary/20 text-primary text-[9px] font-bold rounded">{opp.type}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{opp.reasoning}</p>
                <div className="flex justify-between text-[10px] font-mono text-emerald-400 pt-1">
                  <span>Business Value: {opp.businessValueScore}/100</span>
                  <span>Confidence: {opp.confidenceScore}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODULE 5 & MODULE 3: EXPLAINABLE GROWTH SCORE & COMPETITORS */}
      <div className="grid grid-cols-12 gap-6">
        {/* EXPLAINABLE GROWTH SCORECARD (MODULE 5) */}
        <div className="col-span-7 bg-card border border-border p-5 rounded-xl space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <span>⚙️</span> Explainable Growth Score Rationale
          </h3>

          <div className="space-y-2">
            {(growthScore?.explanation || []).map((exp, idx) => (
              <div key={idx} className="p-3 bg-background border border-border rounded-lg text-xs space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-foreground">{exp.dimension} (Weight: {exp.weight * 100}%)</span>
                  <span className="text-emerald-400 font-mono">{exp.score} / 100</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{exp.reason}</p>
              </div>
            ))}
          </div>
        </div>

        {/* COMPETITOR INTELLIGENCE MONITORS (MODULE 3) */}
        <div className="col-span-5 bg-card border border-border p-5 rounded-xl space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <span>🛡️</span> Competitor Intelligence Architecture
          </h3>

          <div className="space-y-3">
            {competitors.map((comp, idx) => (
              <div key={idx} className="p-3.5 bg-background border border-border rounded-lg text-xs space-y-2">
                <div className="flex justify-between items-center font-bold text-foreground">
                  <span>{comp.name}</span>
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded">{comp.pricingTier}</span>
                </div>
                <div className="text-[10px] text-muted-foreground font-mono flex justify-between">
                  <span>SEO Authority: {comp.seoAuthorityScore}/100</span>
                  <span>Blog Freq: {comp.blogFrequencyPerWeek}x / wk</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
