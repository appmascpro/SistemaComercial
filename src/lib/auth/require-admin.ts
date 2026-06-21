import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import type { UserProfile } from "@/types/auth";

export async function requireAdminProfile(): Promise<UserProfile> {
  const profile = await requireProfile();

  if (profile.role !== "admin") {
    redirect("/");
  }

  return profile;
}
