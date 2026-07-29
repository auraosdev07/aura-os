import { getNotifications, buildActivityTimeline } from "@/services/notification";
import { NotificationFeature } from "@/features/notifications/notification-feature";

export default async function NotificationsPage() {
  const notifications = await getNotifications();
  const timeline = await buildActivityTimeline();

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
