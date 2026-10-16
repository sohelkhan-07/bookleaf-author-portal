import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  FileText,
  Headphones,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/useAuth";

const destinations = [
  {
    title: "My books",
    description:
      "Review your registered books and the publishing details available to you.",
    link: "/author/books",
    action: "Explore my books",
    icon: BookOpen,
    color: "bg-rose-50 text-rose-600",
  },
  {
    title: "My support tickets",
    description:
      "Follow your requests, review their status, and read support responses.",
    link: "/author/tickets",
    action: "View my tickets",
    icon: MessageCircle,
    color: "bg-violet-50 text-violet-600",
  },
  {
    title: "Publishing questions",
    description:
      "Need help with your book, royalties, or publishing process? Contact support.",
    link: "/author/tickets",
    action: "Get support",
    icon: Headphones,
    color: "bg-amber-50 text-amber-700",
  },
];

export default function AuthorDashboard() {
  const { user, session } = useAuth();

  // Support either user or session.user, depending on the auth context.
  const currentUser = user ?? session?.user;
  const firstName =
    currentUser?.name?.trim().split(/\s+/)[0] || "Author";

  return (
    <div className="min-w-0 space-y-8">
      <header className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-600">
            Author portal
          </p>

          <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl lg:text-4xl">
            Welcome back, {firstName}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
            Your publishing journey, all in one place.
          </p>
        </div>

        <span
          className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600 sm:flex"
          aria-hidden="true"
        >
          <BookOpen size={24} />
        </span>
      </header>

      <section className="relative isolate overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-br from-white via-rose-50 to-pink-100 p-5 shadow-sm sm:p-8 lg:p-10">
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-20 -z-10 h-64 w-64 rounded-full bg-rose-200/40 blur-3xl"
        />

        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-rose-700">
            <Sparkles size={14} aria-hidden="true" />
            YOUR PUBLISHING JOURNEY
          </span>

          <h2 className="mt-5 max-w-2xl text-2xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-3xl lg:text-4xl">
            Your story deserves to find its readers.
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-600 sm:text-base">
            Keep track of your books, stay up to date with support responses,
            and get help when you need it.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to="/author/books"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
            >
              <BookOpen size={17} aria-hidden="true" />
              Explore my books
              <ArrowRight size={16} aria-hidden="true" />
            </Link>

            <Link
              to="/author/tickets"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
            >
              <MessageCircle size={17} aria-hidden="true" />
              My support tickets
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-600">
            Your workspace
          </p>

          <h2 className="mt-1 text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
            What would you like to do?
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Access your books and support information whenever you need it.
          </p>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-3">
          {destinations.map(
            ({ title, description, link, action, icon: Icon, color }) => (
              <Link
                key={title}
                to={link}
                className="group flex min-w-0 flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 sm:p-6"
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}
                >
                  <Icon size={22} aria-hidden="true" />
                </span>

                <span className="mt-5 block break-words text-base font-bold leading-6 text-zinc-900">
                  {title}
                </span>

                <span className="mt-2 block flex-1 break-words text-sm leading-6 text-zinc-600">
                  {description}
                </span>

                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-rose-600">
                  {action}
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            ),
          )}
        </div>
      </section>

      <section className="flex min-w-0 flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
          <FileText size={22} aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-zinc-900">
            Have a question about your book?
          </h2>

          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Submit a support request with the details of your concern so the
            team can review it.
          </p>
        </div>

        <Link
          to="/author/tickets"
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
        >
          Get support
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>

      <footer className="border-t border-zinc-200 pt-5 text-xs text-zinc-500">
        BookLeaf Publishing · Author Portal
      </footer>
    </div>
  );
}