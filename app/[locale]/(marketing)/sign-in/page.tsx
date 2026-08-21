import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { SignInForm } from "@/components/auth/SignInForm";

export const dynamic = "force-dynamic";

interface SignInPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SignInPage({ params }: SignInPageProps) {
  const { locale } = await params;
  const h = await headers();
  const request = new Request("http://localhost", { headers: h });
  const session = await getServerSession(request);

  if (session) {
    redirect(`/${locale}/board`);
  }

  return <SignInForm locale={locale} />;
}
