import { getServerSession } from "@/lib/auth/session";
import { updateUserLocale } from "@/lib/user/locale";

export async function PATCH(request: Request): Promise<Response> {
  const session = await getServerSession(request);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 422 });
  }
  const locale = (body as { locale?: unknown } | null)?.locale;
  if (typeof locale !== "string" || locale.trim() === "") {
    return Response.json({ error: "locale is required" }, { status: 422 });
  }

  try {
    const updated = await updateUserLocale(session.user.id, locale.trim());
    return Response.json({ locale: updated });
  } catch (e) {
    if (e instanceof Error && e.message === "INVALID_LOCALE") {
      return Response.json({ error: "Unsupported locale" }, { status: 422 });
    }
    throw e;
  }
}