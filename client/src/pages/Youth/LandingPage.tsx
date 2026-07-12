import { Link } from "react-router-dom";
import { youthEvents, youthImages } from "./youthData";

export default function LandingPage() {
  return (
    <main>
      <section
        className="min-h-[72vh] bg-cover bg-center px-6 py-24 text-white"
        style={{ backgroundImage: `linear-gradient(rgba(11,31,59,.72), rgba(11,31,59,.72)), url(${youthImages.galas})` }}
      >
        <div className="mx-auto max-w-6xl">
          <h1 className="max-w-2xl text-5xl font-bold leading-tight">SK Kabataan - Barangay Galas Maasim</h1>
          <p className="mt-5 max-w-xl text-lg text-white/85">
            Discover youth programs, events, announcements, and opportunities in our community.
          </p>
          <div className="mt-8 flex gap-3">
            <Link className="rounded-lg bg-white px-5 py-3 font-semibold text-[#0b1f3b]" to="/login">Login to Join</Link>
            <Link className="rounded-lg border border-white px-5 py-3 font-semibold text-white" to="/youth-events">View Events</Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-2xl font-bold text-[#0b1f3b]">Upcoming Programs</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {youthEvents.map((event) => (
            <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" key={event.title}>
              <img className="h-44 w-full object-cover" src={event.image} alt="" />
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{event.date}</p>
                <h3 className="mt-1 font-bold text-slate-900">{event.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{event.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
