import { useCallback, useEffect, useState } from "react";
import { BookOpen, RefreshCw } from "lucide-react";
import LoadingState from "../../components/LoadingState";
import { apiRequest } from "../../lib/api";
import { useAuth } from "../../context/useAuth";

export default function MyBooksPage() {
  const { session } = useAuth();
  const token = session?.token;

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBooks = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/books/my-books", { token });
      setBooks(Array.isArray(data) ? data : data.books ?? []);
    } catch (err) {
      setError(err.message || "Unable to load your books.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  return (
    <div className="min-w-0 space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-600">
          Your library
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          My books
        </h1>
        <p className="mt-2 text-sm leading-6 text-gray-500 sm:text-base">
          Review your registered books and the publishing details available to
          you.
        </p>
      </header>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white">
          <LoadingState message="Loading your books..." />
        </div>
      ) : error ? (
        <section
          className="rounded-2xl border border-red-200 bg-white p-6"
          role="alert"
        >
          <h2 className="font-semibold text-gray-900">
            We couldn't load your books
          </h2>
          <p className="mt-2 text-sm leading-6 text-red-700">{error}</p>
          <button
            type="button"
            onClick={loadBooks}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Try again
          </button>
        </section>
      ) : books.length === 0 ? (
        <section className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <BookOpen size={26} aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            No books found
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
            There are no books linked to your account yet. If you expected to
            see a book here, please contact the support team through a ticket.
          </p>
        </section>
      ) : (
        <section
          className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          aria-label="Your books"
        >
          {books.map((book) => (
            <article
              key={book._id || book.id}
              className="flex min-w-0 flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-rose-200 hover:shadow-md"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <BookOpen size={22} aria-hidden="true" />
              </span>

              <h2 className="mt-4 break-words text-base font-bold text-gray-900">
                {book.title || "Untitled book"}
              </h2>

              {book.author && (
                <p className="mt-1 text-sm text-gray-500">
                  {typeof book.author === "string"
                    ? book.author
                    : book.author.name || ""}
                </p>
              )}

              <dl className="mt-5 space-y-3 border-t border-gray-100 pt-4 text-sm">
                {book.status && (
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-gray-500">Status</dt>
                    <dd className="text-right font-medium text-gray-800">
                      {book.status}
                    </dd>
                  </div>
                )}

                {book.genre && (
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-gray-500">Genre</dt>
                    <dd className="text-right font-medium text-gray-800">
                      {book.genre}
                    </dd>
                  </div>
                )}

                {book.isbn && (
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-gray-500">ISBN</dt>
                    <dd className="break-all text-right font-medium text-gray-800">
                      {book.isbn}
                    </dd>
                  </div>
                )}
              </dl>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}