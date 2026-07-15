import { useEffect, useState } from "react";
import { Bell, CalendarDays, ImageIcon } from "lucide-react";
import {
  getVisibleAnnouncements,
  type Announcement,
} from "../../Admin/SurveysAnnouncements/AnnouncementsService";
import YouthSectionCard from "../shared/YouthSectionCard";

function formatDate(value: string | null) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function YouthAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAnnouncements() {
      setIsLoading(true);
      setErrorMessage(null);
      const { data, error } = await getVisibleAnnouncements();

      if (!isMounted) return;
      if (error) setErrorMessage(error.message);
      setAnnouncements(data);
      setIsLoading(false);
    }

    loadAnnouncements();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-6 sm:px-6 lg:px-8">
      <YouthSectionCard
        icon={<Bell className="h-5 w-5" />}
        subtitle="Updates from SK"
        title="Announcements"
      >
        {errorMessage ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {errorMessage}
          </div>
        ) : null}
        {isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            Loading announcements...
          </div>
        ) : null}
        {!isLoading && announcements.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            No published announcements right now.
          </div>
        ) : null}
        <div className="grid gap-4">
          {announcements.map((announcement) => (
            <article
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              key={announcement.announcement_id}
            >
              {announcement.image_path ? (
                <img
                  alt=""
                  className="h-48 w-full object-cover"
                  src={announcement.image_path}
                />
              ) : null}
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDate(announcement.publish_at)}
                  </span>
                  {announcement.category ? <span>{announcement.category}</span> : null}
                  {announcement.priority > 0 ? (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                      Priority {announcement.priority}
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-2 text-lg font-semibold text-slate-900">
                  {announcement.title}
                </h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                  {announcement.content}
                </p>
                {!announcement.image_path ? (
                  <div className="mt-4 inline-flex items-center gap-2 text-xs text-slate-400">
                    <ImageIcon className="h-3.5 w-3.5" />
                    No image attached
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </YouthSectionCard>
    </div>
  );
}
