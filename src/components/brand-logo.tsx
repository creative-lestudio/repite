import { cn } from "@/lib/utils";

/** Logotipo del local; si aún no lo ha subido, su inicial sobre el color de marca. */
export function BrandLogo({ url, name, className }: { url: string | null; name: string; className?: string }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" className={cn("size-10 shrink-0 rounded-lg object-contain", className)} />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "bg-brand text-on-brand font-display flex size-10 shrink-0 items-center justify-center rounded-full text-lg font-extrabold",
        className,
      )}
    >
      {name.charAt(0)}
    </span>
  );
}
