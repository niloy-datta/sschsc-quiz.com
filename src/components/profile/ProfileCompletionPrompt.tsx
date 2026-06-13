import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  PROFILE_INCOMPLETE_HINT,
  PROFILE_INCOMPLETE_SAVE_MSG,
} from "@/lib/profile-utils";

export function ProfileCompletionPrompt({
  variant = "save",
  className = "",
}: {
  variant?: "save" | "hint";
  className?: string;
}) {
  const message =
    variant === "hint" ? PROFILE_INCOMPLETE_HINT : PROFILE_INCOMPLETE_SAVE_MSG;

  return (
    <div
      className={`rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100 ${className}`}
    >
      <p className="mb-3">{message}</p>
      <Link href="/profile">
        <Button size="sm" className="min-h-[44px]">প্রোফাইল সম্পূর্ণ করুন</Button>
      </Link>
    </div>
  );
}
