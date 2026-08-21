import Image from "next/image";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`inline-flex items-center ${className}`}>
      <Image
        src="/logo-dark.png"
        alt=""
        width={812}
        height={261}
        loading={'eager'}
        className="theme-logo-dark h-10 w-auto rounded-xl"
      />
      <Image
        src="/logo-light.png"
        alt=""
        width={801}
        height={272}
        loading={'eager'}
        className="theme-logo-light h-10 w-auto rounded-xl"
      />
    </span>
  );
}