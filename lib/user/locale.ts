import { prisma } from "@/lib/prisma";
import { isLocale, type Locale } from "@/lib/i18n/settings";

export async function updateUserLocale(userId: string, locale: string): Promise<Locale> {
  if (!isLocale(locale)) {
    throw new Error("INVALID_LOCALE");
  }
  await prisma.user.update({
    where: { id: userId },
    data: { locale },
  });
  return locale;
}