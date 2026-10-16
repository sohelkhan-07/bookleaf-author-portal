import { BookOpen, ShieldCheck, Sparkles } from "lucide-react";
import Brand from "./Brand";

export default function AuthLayout({ children, audience = "author" }) {
  const isAdmin = audience === "admin";

  return (
    <main className="min-h-screen bg-white text-gray-900 lg:grid lg:grid-cols-2">
     
      <section className="relative flex min-h-[340px] flex-col justify-between overflow-hidden bg-white px-6 py-8 sm:px-10 sm:py-10 lg:min-h-screen lg:px-14 lg:py-12 xl:px-20">
        <header>
          <Brand />
        </header>

        <div className="mx-auto w-full max-w-xl py-10 lg:py-16">
          <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold tracking-[0.16em] text-rose-700">
            {isAdmin ? "OPERATIONS PORTAL" : "AUTHOR PORTAL"}
          </span>

          <h1 className="mt-6 max-w-lg text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl xl:text-5xl">
            {isAdmin
              ? "Every query deserves a thoughtful response."
              : "Your publishing journey, all in one place."}
          </h1>

          <p className="mt-5 max-w-lg text-base leading-7 text-gray-600 sm:text-lg">
            {isAdmin
              ? "Manage support requests, review AI-assisted drafts, and help authors move forward."
              : "Keep track of your books, raise support requests, and follow every update."}
          </p>

          <div className="mt-9 space-y-5">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
                {isAdmin ? (
                  <ShieldCheck size={21} aria-hidden="true" />
                ) : (
                  <BookOpen size={21} aria-hidden="true" />
                )}
              </span>

              <div className="pt-0.5">
                <h2 className="font-semibold text-gray-900">
                  {isAdmin ? "Secure operations" : "Your books, organized"}
                </h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  {isAdmin
                    ? "Access controlled by your admin account"
                    : "Access your own publishing records"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
                <Sparkles size={21} aria-hidden="true" />
              </span>

              <div className="pt-0.5">
                <h2 className="font-semibold text-gray-900">
                  {isAdmin
                    ? "AI-assisted support"
                    : "Support that keeps you informed"}
                </h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  {isAdmin
                    ? "Generate drafts for review before sending"
                    : "Follow your requests and responses"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <footer className="border-t border-gray-200 pt-5 text-xs text-gray-500">
          BookLeaf Publishing · Author Support Portal
        </footer>
      </section>

   
      <section className="flex min-w-0 items-center justify-center bg-[#FCECEF] px-5 py-10 sm:px-8 sm:py-14 lg:min-h-screen lg:px-10 lg:py-12 xl:px-16">
        <div className="w-full max-w-md rounded-2xl border border-rose-100/80 bg-white p-6 shadow-[0_12px_40px_rgba(95,36,52,0.07)] sm:p-8">
          {children}
        </div>
      </section>
    </main>
  );
}