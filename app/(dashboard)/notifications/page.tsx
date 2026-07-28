import { getNotifications, buildActivityTimeline } from "@/services/notification";
import { NotificationFeature } from "@/features/notifications/notification-feature";
import { redirect } from "next/navigation";

export default async function NotificationsPage() {
  let notifications;
  let timeline;
  try {
    notifications = await getNotifications();
    timeline = await buildActivityTimeline();
  } catch (error) {
    console.error("Failed to load notifications page", error);
    redirect("/login");
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Notifications & Activity</h1>
        <p className="text-muted-foreground">
          Centralized event stream of everything happening across Aura OS.
        </p>
      </div>

      <NotificationFeature 
        initialNotifications={notifications} 
        initialTimeline={timeline} 
      />
    </div>
  );
}
