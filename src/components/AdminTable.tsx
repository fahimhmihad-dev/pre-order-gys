import { useState, type ReactNode } from "react";
import { Eye, Pencil, Trash2, Save } from "lucide-react";
import { S } from "@/lib/strings.bn";
import { cn } from "@/lib/utils";
import { Btn, Confirm, Empty, Skeleton } from "@/components/brutal";

export type Col<T> = { key: string; label: string; render: (r: T) => ReactNode };

export function AdminTable<T>({
  cols,
  rows,
  getId,
  tint,
  loading,
  selectable,
  selected,
  setSelected,
  onView,
  onEdit,
  onDelete,
  onSave,
  extra,
}: {
  cols: Col<T>[];
  rows: T[];
  getId: (r: T) => string;
  tint?: ((r: T) => string | undefined) | undefined;
  loading?: boolean | undefined;
  selectable?: boolean | undefined;
  selected?: Set<string> | undefined;
  setSelected?: ((s: Set<string>) => void) | undefined;
  onView?: ((r: T) => void) | undefined;
  onEdit?: ((r: T) => void) | undefined;
  onDelete?: ((r: T) => unknown) | undefined;
  onSave?: ((r: T) => void) | undefined;
  extra?: ((r: T) => ReactNode) | undefined;
}) {
  const [active, setActive] = useState<string | null>(null);
  const [del, setDel] = useState<T | null>(null);
  const hasActions = onView || onEdit || onDelete || onSave || extra;

  if (loading) return <Skeleton className="h-48" />;
  if (!rows.length) return <Empty>{S.common.empty}</Empty>;

  const allSel = selectable && selected && rows.every((r) => selected.has(getId(r)));
  const toggle = (id: string) => {
    if (!selected || !setSelected) return;
    const n = new Set(selected);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    setSelected(n);
  };

  return (
    <>
      <div className="w-full overflow-x-auto border-[3px] border-ink bg-card">
        <table className="admin-table">
          <thead>
            <tr>
              {selectable && (
                <th className="w-8">
                  <input
                    type="checkbox"
                    aria-label={S.common.all}
                    checked={!!allSel}
                    onChange={() => setSelected?.(allSel ? new Set() : new Set(rows.map(getId)))}
                  />
                </th>
              )}
              {cols.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
              {hasActions && <th className="no-print">{S.admin.orders.actions}</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const id = getId(r);
              return (
                <tr
                  key={id}
                  onClick={() => setActive(id)}
                  onDoubleClick={() => onEdit?.(r)}
                  className={cn("cursor-pointer", tint?.(r), active === id && "outline-[3px] -outline-offset-[3px] outline-info outline")}
                >
                  {selectable && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selected?.has(id) ?? false} onChange={() => toggle(id)} aria-label={id} />
                    </td>
                  )}
                  {cols.map((c) => (
                    <td key={c.key}>{c.render(r)}</td>
                  ))}
                  {hasActions && (
                    <td className="no-print" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        {extra?.(r)}
                        {onView && (
                          <Btn size="icon" variant="outline" onClick={() => onView(r)} aria-label={S.common.view} title={S.common.view}>
                            <Eye />
                          </Btn>
                        )}
                        {onEdit && (
                          <Btn size="icon" variant="primary" onClick={() => onEdit(r)} aria-label={S.common.edit} title={S.common.edit}>
                            <Pencil />
                          </Btn>
                        )}
                        {onSave && (
                          <Btn size="icon" variant="green" onClick={() => onSave(r)} aria-label={S.common.save} title={S.common.save}>
                            <Save />
                          </Btn>
                        )}
                        {onDelete && (
                          <Btn size="icon" variant="red" onClick={() => setDel(r)} aria-label={S.common.delete} title={S.common.delete}>
                            <Trash2 />
                          </Btn>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Confirm open={!!del} onOpenChange={(o) => !o && setDel(null)} onConfirm={() => del && onDelete?.(del)} />
    </>
  );
}

export function PageHead({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h1 className="text-2xl sm:text-3xl">{title}</h1>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
