import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { isAuthConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  if (!isAuthConfigured()) redirect("/");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">Vibeslide</h1>
      <SignIn fallbackRedirectUrl="/" />
    </main>
  );
}
