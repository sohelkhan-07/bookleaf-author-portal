import { LoaderCircle } from "lucide-react";

export default function LoadingState({ message = "Loading..." }) {
  return (
    <div
      className="flex min-h-40 flex-col items-center justify-center gap-3 text-sm text-gray-500"
      role="status"
      aria-live="polite"
    >
      <LoaderCircle
        className="animate-spin text-rose-600"
        size={22}
        aria-hidden="true"
      />
      <span>{message}</span>
    </div>
  );
}