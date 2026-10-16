import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, SearchX } from "lucide-react";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fcfaf9] px-5 py-12">
      <div className="w-full max-w-lg text-center">
        <Link
          to="/"
          className="mx-auto inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-gray-900"
        >
          <BookOpen size={24} className="text-rose-600" aria-hidden="true" />
          <span>BookLeaf Publishing</span>
        </Link>

        <div className="mx-auto mt-12 flex size-20 items-center justify-center rounded-3xl bg-rose-50 text-rose-600">
          <SearchX size={38} strokeWidth={1.5} aria-hidden="true" />
        </div>

        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">
          Error 404
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
          We couldn't find that page
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-gray-600 sm:text-base">
          The page may have moved, or the link might be incorrect. Let's get
          you back to the BookLeaf portal.
        </p>

        <Link
          to="/"
          className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-200"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Return to portal
        </Link>

        <p className="mt-10 text-xs text-gray-400">
          BookLeaf Publishing · Author Support Portal
        </p>
      </div>
    </main>
  );
}