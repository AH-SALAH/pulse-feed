"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LuMail, LuLock, LuLoaderCircle, LuGithub, LuChrome } from "react-icons/lu";
import { authClient } from "@/lib/auth/client";
import { signInSchema, type SignInValues } from "@/lib/forms/schemas";

interface SignInFormProps {
  locale: string;
}

export function SignInForm({ locale }: SignInFormProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: SignInValues) {
    const { error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
      callbackURL: `/${locale}/board`,
    });

    if (error) {
      setError("root.serverError", {
        message: error.message ?? t("auth.invalidCredentials"),
      });
      return;
    }
    router.push(`/${locale}/board`);
    router.refresh();
  }

  async function handleSocialSignIn(provider: "github" | "google") {
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: `/${locale}/board`,
    });
    if (error) {
      setError("root.serverError", {
        message: error.message ?? t("auth.invalidCredentials"),
      });
    }
  }

  const inputClass =
    "w-full rounded-2xl border border-outline-variant bg-surface-container px-4 py-2.5 ps-10 font-body text-body-md text-on-surface placeholder-on-surface-variant outline-none transition-colors focus:border-primary focus:ring-0 focus:bg-surface-container-high";

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-gutter py-16">        <div className="w-full max-w-[28rem]">
        <div className="mb-8 text-center">
          {/* <h1 className="font-heading text-display-lg font-semibold tracking-tight text-on-surface">
            {t("auth.signInTo")}
          </h1> */}
          <LuLock
            aria-hidden="true"
            className="pointer-events-none mx-auto size-8 text-on-surface-variant"
          />
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-[1fr_1fr] gap-3">
            <button
              type="button"
              onClick={() => handleSocialSignIn("github")}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-outline-variant bg-surface-container px-4 py-2.5 font-body text-body-md font-medium text-on-surface transition hover:bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed h-[48px]"
            >
              <LuGithub aria-hidden="true" className="size-5" />
              {t("auth.continueWith", { provider: "GitHub" })}
            </button>
            <button
              type="button"
              onClick={() => handleSocialSignIn("google")}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-outline-variant bg-surface-container px-4 py-2.5 font-body text-body-md font-medium text-on-surface transition hover:bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed h-[48px]"
            >
              <LuChrome aria-hidden="true" className="size-5" />
              {t("auth.continueWith", { provider: "Google" })}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-on-surface-variant font-label text-label-caps">
                {t("auth.or")}
              </span>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-5 rounded-2xl border border-outline-variant bg-surface-container p-6"
          >
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="font-label text-label-caps text-on-surface-variant"
              >
                {t("auth.email")}
              </label>
              <div className="relative">
                <LuMail
                  aria-hidden="true"
                  className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-on-surface-variant"
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={inputClass}
                  {...register("email")}
                />
              </div>
              {errors.email ? (
                <p
                  id="email-error"
                  role="alert"
                  className="font-body text-body-md text-error"
                >
                  {t(errors.email.message as string)}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="font-label text-label-caps text-on-surface-variant"
              >
                {t("auth.password")}
              </label>
              <div className="relative">
                <LuLock
                  aria-hidden="true"
                  className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-on-surface-variant"
                />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={errors.password ? true : undefined}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  className={inputClass}
                  {...register("password")}
                />
              </div>
              {errors.password ? (
                <p
                  id="password-error"
                  role="alert"
                  className="font-body text-body-md text-error"
                >
                  {t(errors.password.message as string)}
                </p>
              ) : null}
            </div>

            {errors.root?.serverError ? (
              <p
                role="alert"
                className="rounded-2xl border border-error-container/30 bg-error-container/20 px-3 py-2 font-body text-body-md text-error"
              >
                {errors.root.serverError.message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 font-body text-body-md font-medium text-on-primary transition hover:bg-primary-container/80 disabled:cursor-not-allowed disabled:opacity-50 h-[48px]"
            >
              {isSubmitting ? (
                <>
                  <LuLoaderCircle aria-hidden="true" className="size-5 animate-spin" />
                  {t("auth.signingIn")}
                </>
              ) : (
                t("auth.signInWithEmail")
              )}
            </button>
          </form>

          <p className="text-center font-body text-body-md text-on-surface-variant">
            {t("auth.noAccount")}{" "}
            <Link
              href={`/${locale}/sign-up`}
              className="font-medium text-primary hover:underline"
            >
              {t("auth.createOne")}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}