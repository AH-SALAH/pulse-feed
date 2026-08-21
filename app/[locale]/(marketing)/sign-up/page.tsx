import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const dynamic = "force-dynamic";

interface SignUpPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SignUpPage({ params }: SignUpPageProps) {
  const { locale } = await params;
  const h = await headers();
  const request = new Request("http://localhost", { headers: h });
  const session = await getServerSession(request);

  if (session) {
    redirect(`/${locale}/board`);
  }

  return <SignUpForm locale={locale} />;
}
