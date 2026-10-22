"use client";

import { useTranslations } from "next-intl";
import { MATRIX, PLAN_ORDER, type Cell } from "@/config/plan";
import { cn } from "@/lib/utils";
import { CellValue } from "./cell";

/** Comparativa completa de funciones por plan. */
export function PlanTable({ highlight }: { highlight?: string }) {
  const t = useTranslations("plans");
  return (
    <div className="ring-cream-200 overflow-x-auto rounded-xl ring-1">
      <table className="bg-surface w-full min-w-[34rem] border-collapse text-left text-sm">
        <caption className="sr-only">{t("whyTitle")}</caption>
        <thead>
          <tr className="border-cream-200 border-b">
            <th scope="col" className="w-2/5 p-3" />
            {PLAN_ORDER.map((p) => (
              <th
                key={p}
                scope="col"
                className={cn(
                  "font-display p-3 text-center text-base font-extrabold",
                  highlight === p && "bg-primary-soft",
                )}
              >
                {t(`names.${p}`)}
              </th>
            ))}
          </tr>
        </thead>
        {MATRIX.map((g) => (
          <tbody key={g.key}>
            <tr>
              <th
                colSpan={4}
                scope="colgroup"
                className="bg-cream-50 text-muted p-3 text-xs font-bold tracking-wide uppercase"
              >
                {t(`groups.${g.key}` as never)}
              </th>
            </tr>
            {g.rows.map((r) => (
              <tr key={r.key} className="border-cream-100 border-t">
                <th scope="row" className="p-3 font-medium">
                  {t(`features.${r.key}` as never)}
                  {r.soon && (
                    <span className="bg-cream-100 text-wine-800 ml-2 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap">
                      {t("soon")}
                    </span>
                  )}
                </th>
                {PLAN_ORDER.map((p) => (
                  <td key={p} className={cn("p-3 text-center font-semibold", highlight === p && "bg-primary-soft/60")}>
                    <CellValue value={r[p] as Cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
