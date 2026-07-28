"use client";

import type { DashboardView } from "@/services/dashboard";
import { DashboardHeader } from "./dashboard-header";
import { DashboardGrid } from "./dashboard-grid";
import { DashboardSection } from "./dashboard-section";
import { DashboardKpiCard } from "./dashboard-kpi-card";
import { DashboardRecentList } from "./dashboard-recent-list";
import { Users, Briefcase, Rocket, BookOpen, CheckCircle2 } from "lucide-react";

interface DashboardFeatureProps {
  data: DashboardView;
}

export function DashboardFeature({ data }: DashboardFeatureProps) {
  const { kpis, recentActivity, distributions } = data;

  return (
    <div className="space-y-8">
      <DashboardHeader />

      {/* KPI Section */}
      <DashboardGrid className="grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5">
        <DashboardKpiCard 
          title="Total Managers" 
          value={kpis.totalManagers} 
          icon={<Briefcase />}
        />
        <DashboardKpiCard 
          title="Total Employees" 
          value={kpis.totalEmployees} 
          icon={<Users />}
        />
        <DashboardKpiCard 
          title="Active Missions" 
          value={kpis.activeMissions} 
          icon={<Rocket />}
        />
        <DashboardKpiCard 
          title="Completed Missions" 
          value={kpis.completedMissions} 
          icon={<CheckCircle2 />}
        />
        <DashboardKpiCard 
          title="Knowledge Entries" 
          value={kpis.totalKnowledge} 
          icon={<BookOpen />}
        />
      </DashboardGrid>

      {/* Grid Layout for Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 spans): Activity & Breakdowns */}
        <div className="lg:col-span-2 space-y-6">
          
          <DashboardSection title="Recent Activity" className="bg-card border rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Latest Missions</h3>
                <DashboardRecentList
                  items={recentActivity.missions.map(m => ({
                    id: m.id,
                    title: m.title,
                    subtitle: `Status: ${m.status}`,
                    href: `/missions/${m.id}`,
                    createdAt: m.createdAt,
                  }))}
                  emptyTitle="No missions found"
                  emptyDescription="Start a new mission to track progress."
                />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Latest Knowledge</h3>
                <DashboardRecentList
                  items={recentActivity.knowledge.map(k => ({
                    id: k.id,
                    title: k.title,
                    subtitle: `Layer: ${k.layer}`,
                    href: `/knowledge/${k.id}`,
                    createdAt: k.createdAt,
                  }))}
                  emptyTitle="No knowledge found"
                  emptyDescription="Document your operations to see them here."
                />
              </div>

            </div>
          </DashboardSection>

          {/* Placeholders for Future Extensions */}
          <DashboardGrid className="grid-cols-1 md:grid-cols-2">
            <DashboardSection title="Recent Notifications" className="bg-card border rounded-lg p-6">
              {data.unreadNotifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No unread notifications.</p>
              ) : (
                <div className="space-y-4">
                  {data.unreadNotifications.map(n => (
                    <div key={n.id} className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="text-sm font-medium">{n.title}</h4>
                        {n.message && <p className="text-xs text-muted-foreground line-clamp-1">{n.message}</p>}
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                        {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(n.createdAt))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </DashboardSection>
            
            <DashboardSection title="Activity Timeline" className="bg-card border rounded-lg p-6">
              {data.timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activity.</p>
              ) : (
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted before:to-transparent">
                  {data.timeline.map(t => (
                    <div key={t.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-4 h-4 rounded-full border border-white bg-muted text-muted-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2" />
                      <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-2 rounded border bg-card shadow-sm">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-xs truncate">{t.title}</h4>
                          <span className="text-[10px] text-muted-foreground shrink-0">{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(t.timestamp))}</span>
                        </div>
                        {t.description && <p className="text-xs text-muted-foreground line-clamp-1">{t.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DashboardSection>
          </DashboardGrid>

        </div>

        {/* Right Column (1 span): Analytics & Future Widgets */}
        <div className="space-y-6">
          
          <DashboardSection title="Distributions" className="bg-card border rounded-lg p-6">
            <div className="space-y-6">
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Missions by Status</h3>
                {Object.keys(distributions.missionStatuses).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active missions.</p>
                ) : (
                  <ul className="space-y-2">
                    {Object.entries(distributions.missionStatuses).map(([status, count]) => (
                      <li key={status} className="flex justify-between items-center text-sm">
                        <span className="capitalize">{status.replace("_", " ").toLowerCase()}</span>
                        <span className="font-medium bg-muted px-2 py-1 rounded-md">{count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Employees by Status</h3>
                {Object.keys(distributions.employeeStatuses).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active employees.</p>
                ) : (
                  <ul className="space-y-2">
                    {Object.entries(distributions.employeeStatuses).map(([status, count]) => (
                      <li key={status} className="flex justify-between items-center text-sm">
                        <span className="capitalize">{status.replace("_", " ").toLowerCase()}</span>
                        <span className="font-medium bg-muted px-2 py-1 rounded-md">{count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Knowledge by Layer</h3>
                {Object.keys(distributions.knowledgeLayers).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active knowledge.</p>
                ) : (
                  <ul className="space-y-2">
                    {Object.entries(distributions.knowledgeLayers).map(([layer, count]) => (
                      <li key={layer} className="flex justify-between items-center text-sm">
                        <span className="capitalize">{layer.toLowerCase()}</span>
                        <span className="font-medium bg-muted px-2 py-1 rounded-md">{count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
            </div>
          </DashboardSection>

          {/* Placeholders for Future Extensions */}
          <DashboardSection title="Pending Tasks" className="bg-card border rounded-lg p-6 opacity-60 border-dashed">
            <p className="text-sm text-muted-foreground">Future integration point for pending approvals and assignments.</p>
          </DashboardSection>

          <DashboardSection title="Automation Queue" className="bg-card border rounded-lg p-6 opacity-60 border-dashed">
            <p className="text-sm text-muted-foreground">Future integration point for agentic task queues and background processing.</p>
          </DashboardSection>

        </div>
      </div>
    </div>
  );
}
