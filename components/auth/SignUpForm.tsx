"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import {
  LuUser,
  LuMail,
  LuLock,
  LuLoaderCircle,
  LuGithub,
  LuChrome,
  LuShieldCheck,
} from "react-icons/lu";
import { authClient } from "@/lib/auth/client";
import { signUpSchema, type SignUpValues } from "@/lib/forms/schemas";
import { Logo } from "@/components/brand/Logo";

interface SignUpFormProps {
  locale: string;
}

function signUpErrorMessage(t: (key: string) => string, code?: string) {
  switch (code) {
    case "USER_ALREADY_EXISTS":
    case "EMAIL_IS_ALREADY_USED":
      return t("auth.errors.emailTaken");
    case "PASSWORD_TOO_SHORT":
      return t("auth.errors.passwordMin");
    default:
      return t("auth.errors.signUpFailed");
  }
}

export function SignUpForm({ locale }: SignUpFormProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: SignUpValues) {
    const { error } = await authClient.signUp.email({
      email: values.email,
      password: values.password,
      name: values.name,
      callbackURL: `/${locale}/board`,
    });

    if (error) {
      setError("root.serverError", {
        message: signUpErrorMessage(t, error.code),
      });
      return;
    }
    router.push(`/${locale}/board`);
    router.refresh();
  }

  const [socialLoading, setSocialLoading] = useState<"github" | "google" | null>(null);

  async function handleSocialSignIn(provider: "github" | "google") {
    setSocialLoading(provider);
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: `/${locale}/board`,
    });
    if (error) {
      setSocialLoading(null);
      setError("root.serverError", {
        message: signUpErrorMessage(t, error.code),
      });
    }
  }

  const inputClass =
    "w-full rounded-2xl border border-outline-variant/60 bg-surface-container px-4 py-2.5 ps-10 font-body text-body-md text-on-surface placeholder-on-surface-variant/50 outline-none transition-all focus:border-primary/60 focus:ring-0 focus:bg-surface-container-high focus:shadow-[0_0_0_1px_var(--color-primary)]/10";

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-gutter py-16">
      <div className="w-full max-w-[28rem]">
        <div className="animate-card-in mb-8 flex flex-col items-center gap-4 text-center">
          <Logo className="h-10" />
          <div>
            <h1 className="font-heading text-headline-lg-mobile font-semibold tracking-tight text-on-surface lg:text-headline-lg">
              {t("auth.signUpTo")}
            </h1>
            <p className="mt-2 font-body text-body-md text-on-surface-variant">
              {t("auth.subtitle")}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="animate-card-in-delay-1 grid grid-cols-[1fr_1fr] gap-3">
            <button
              type="button"
              onClick={() => handleSocialSignIn("github")}
              disabled={isSubmitting || socialLoading !== null}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl border border-outline-variant/60 bg-surface-container px-4 py-2.5 font-body text-body-md font-medium text-on-surface transition-all hover:border-outline-variant hover:bg-surface-container-high hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 h-[48px]${socialLoading === "github" ? " btn-shimmer" : ""}`}
            >
              {socialLoading === "github" ? (
                <>
                  <LuLoaderCircle aria-hidden="true" className="size-5 animate-spin" />
                  {t("auth.redirecting")}
                </>
              ) : (
                <>
                  <LuGithub aria-hidden="true" className="size-5" />
                  {t("auth.continueWith", { provider: "GitHub" })}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleSocialSignIn("google")}
              disabled={isSubmitting || socialLoading !== null}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl border border-outline-variant/60 bg-surface-container px-4 py-2.5 font-body text-body-md font-medium text-on-surface transition-all hover:border-outline-variant hover:bg-surface-container-high hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 h-[48px]${socialLoading === "google" ? " btn-shimmer" : ""}`}
            >
              {socialLoading === "google" ? (
                <>
                  <LuLoaderCircle aria-hidden="true" className="size-5 animate-spin" />
                  {t("auth.redirecting")}
                </>
              ) : (
                <>
                  <LuChrome aria-hidden="true" className="size-5" />
                  {t("auth.continueWith", { provider: "Google" })}
                </>
              )}
            </button>
          </div>

          <div className="animate-card-in-delay-2 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant/40" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface px-3 text-on-surface-variant/60 font-label text-label-caps">
                {t("auth.or")}
              </span>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="animate-card-in-delay-2 space-y-5 rounded-2xl border border-outline-variant/40 bg-surface-container/80 p-6 shadow-sm"
          >
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="font-label text-label-caps text-on-surface-variant"
              >
                {t("auth.name")}
              </label>
              <div className="relative">
                <LuUser
                  aria-hidden="true"
                  className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-on-surface-variant"
                />
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder={t("auth.name")}
                  aria-invalid={errors.name ? true : undefined}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  className={inputClass}
                  {...register("name")}
                />
              </div>
              {errors.name ? (
                <p
                  id="name-error"
                  role="alert"
                  className="font-body text-body-md text-error"
                >
                  {t(errors.name.message as string)}
                </p>
              ) : null}
            </div>

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
                  placeholder={t("auth.email")}
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
                  autoComplete="new-password"
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
              disabled={isSubmitting || socialLoading !== null}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 font-body text-body-md font-medium text-on-primary shadow-sm shadow-primary/20 transition-all hover:bg-primary-container/80 hover:shadow-md hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-50 h-[48px]"
            >
              {isSubmitting ? (
                <>
                  <LuLoaderCircle aria-hidden="true" className="size-5 animate-spin" />
                  {t("auth.signingUp")}
                </>
              ) : (
                t("auth.signUpWithEmail")
              )}
            </button>
          </form>

          <p className="animate-card-in-delay-3 text-center font-body text-body-md text-on-surface-variant">
            {t("auth.haveAccount")}{" "}
            <Link
              href={`/${locale}/sign-in`}
              className="font-medium text-primary transition-colors hover:text-primary-container"
            >
              {t("auth.signIn")}
            </Link>
          </p>

          <div className="animate-card-in-delay-3 flex flex-col items-center gap-2 pt-4">
            <div className="flex items-center gap-1.5 text-on-surface-variant/40">
              <LuShieldCheck aria-hidden="true" className="size-3.5" />
              <span className="font-body text-body-sm">{t("auth.socialProof")}</span>
            </div>
            <span className="font-telemetry text-telemetry-sm text-on-surface-variant/30">{t("auth.socialProofCount")}</span>
          </div>
        </div>
      </div>
    </main>
  );
}
