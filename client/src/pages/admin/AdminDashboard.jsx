import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowRight,
  ClipboardList,
  Clock3,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  TicketCheck,
} from "lucide-react";
import { useAuth } from "../../context/useAuth";

const actions = [
  {
    title: "Ticket queue",
    description:
      "Review incoming requests, filter tickets, and update their status.",
    icon: ClipboardList,
    color: "bg-rose-50 text-rose-600",
  },
  {
    title: "AI-assisted replies",
    description:
      "Generate knowledge-base-informed drafts and review them before sending.",
    icon: Sparkles,
    color: "bg-violet-50 text-violet-600",
  },
  {
    title: "Pending follow-ups",
    description:
      "Find unresolved requests and identify tickets that need attention.",
    icon: Clock3,
    color: "bg-amber-50 text-amber-700",
  },
  {
    title: "Author communication",
    description:
      "Keep responses clear, empathetic, and grounded in publishing information.",
    icon: MessageSquareText,
    color: "bg-emerald-50 text-emerald-700",
  },
];

export default function AdminDashboard() {
  const { user, session } = useAuth();
  const currentUser = user ?? session?.user;
  const firstName = currentUser?.name?.trim().split(/\s+/)[0] || "Admin";

  return (
    <div className="mx-auto w-full max-w-7xl min-w-0 space-y-8">
      <header className="flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-600">
            Operations portal
          </p>

          <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl lg:text-4xl">
            Welcome back, {firstName}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
            Manage author support requests and keep every conversation moving
            forward.
          </p>
        </div>

        <div className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-rose-100 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm sm:text-sm">
          <ShieldCheck
            size={17}
            className="text-rose-600"
            aria-hidden="true"
          />
          Administrator access
        </div>
      </header>

      <section className="relative isolate overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-br from-white via-rose-50 to-pink-100 p-5 shadow-sm sm:p-8 lg:p-10">
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-20 -z-10 h-64 w-64 rounded-full bg-rose-200/40 blur-3xl"
        />

        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-rose-700">
            <Sparkles size={14} aria-hidden="true" />
            AUTHOR SUPPORT
          </span>

          <h2 className="mt-5 max-w-2xl text-2xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-3xl lg:text-4xl">
            Every query deserves a thoughtful response.
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-600 sm:text-base">
            Review support requests, use AI-assisted drafts as a starting point,
            and help authors navigate their publishing journey.
          </p>

          <Link
            to="/admin/tickets"
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 sm:w-auto"
          >
            Open ticket queue
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-600">
              Your workspace
            </p>

            <h2 className="mt-1 text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
              Support operations
            </h2>
          </div>

          <p className="text-sm leading-6 text-zinc-500">
            Shortcuts for your daily workflow.
          </p>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:gap-5">
          {actions.map(({ title, description, icon: Icon, color }) => (
            <Link
              key={title}
              to="/admin/tickets"
              className="group flex min-w-0 items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 sm:p-6"
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}
              >
                <Icon size={21} aria-hidden="true" />
              </span>

              <span className="flex min-w-0 flex-1 flex-col items-start gap-2">
                <span className="block w-full break-words text-sm font-bold leading-6 text-zinc-900 sm:text-base">
                  {title}
                </span>

                <span className="block w-full break-words text-sm leading-6 text-zinc-600">
                  {description}
                </span>

                <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600">
                  Open workspace
                  <ArrowRight
                    size={15}
                    className="transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex min-w-0 flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
          <TicketCheck size={22} aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-zinc-900">
            Ready to review requests?
          </h2>

          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Open the queue to review tickets, update priorities, and respond to
            authors.
          </p>
        </div>

        <Link
          to="/admin/tickets"
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
        >
          View tickets
          <ArrowDownRight size={16} aria-hidden="true" />
        </Link>
      </section>

      <footer className="border-t border-zinc-200 pt-5 text-xs text-zinc-500">
        BookLeaf Publishing · Author Support Portal
      </footer>
    </div>
  );
}