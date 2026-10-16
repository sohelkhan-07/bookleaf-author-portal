import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Ticket,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import Brand from "../components/Brand";
import { useAuth } from "../context/useAuth";

const navigation = [
  {
    to: "/admin/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    to: "/admin/tickets",
    label: "Ticket queue",
    icon: Ticket,
  },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#faf9f8] text-gray-900 md:flex">
      <aside className="flex w-full shrink-0 flex-col border-b border-gray-200 bg-white md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-5 py-5 md:px-6 md:py-7">
          <Brand />
          <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold tracking-wider text-rose-700 md:hidden">
            ADMIN
          </span>
        </div>

        <div className="hidden px-6 pb-3 md:block">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
            Workspace
          </p>
        </div>

        <nav
          className="flex gap-2 overflow-x-auto px-4 pb-4 md:flex-1 md:flex-col md:px-3 md:pb-6"
          aria-label="Admin navigation"
        >
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/admin/dashboard"}
              className={({ isActive }) =>
                [
                  "flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600",
                  isActive
                    ? "bg-rose-50 text-rose-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                ].join(" ")
              }
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-100 p-4 md:p-5">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-700"
              aria-hidden="true"
            >
              {user?.name?.trim()?.charAt(0)?.toUpperCase() || "A"}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">
                {user?.name || "Administrator"}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                <ShieldCheck size={13} aria-hidden="true" />
                Administrator
              </p>
            </div>

            <button
              type="button"
              onClick={logout}
              className="flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={17} aria-hidden="true" />
              <span className="hidden lg:inline">Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-[1440px] p-4 sm:p-6 lg:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}