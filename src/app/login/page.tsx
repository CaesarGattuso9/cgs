import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getAdminSession } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <LoginForm />
    </main>
  );
}
