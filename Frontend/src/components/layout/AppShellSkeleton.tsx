/**
 * Skeleton estructural del layout público.
 * Misma geometría que header + hero para minimizar CLS y
 * comunicar carga inmediata (también se replica en index.html).
 */
const AppShellSkeleton = () => {
  return (
    <div
      className="flex min-h-screen flex-col bg-background"
      role="status"
      aria-live="polite"
      aria-label="Cargando La Química Quirúrgica"
    >
      <div className="sticky top-0 z-50 w-full border-b border-border bg-background">
        <div className="container mx-auto flex items-center justify-between px-4 py-3 md:px-6">
          <div className="h-10 w-40 animate-pulse rounded-md bg-muted" />
          <div className="hidden h-11 max-w-lg flex-1 animate-pulse rounded-full bg-muted lg:block" />
          <div className="flex gap-2">
            <div className="h-11 w-11 animate-pulse rounded-lg bg-muted" />
            <div className="h-11 w-11 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
        <div className="border-t border-border">
          <div className="container mx-auto flex justify-center gap-3 py-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-9 w-24 animate-pulse rounded-full bg-muted"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="relative flex min-h-[600px] flex-1 items-center justify-center">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <div className="mx-auto h-12 max-w-xl animate-pulse rounded-lg bg-muted" />
            <div className="mx-auto h-12 max-w-lg animate-pulse rounded-lg bg-muted" />
            <div className="mx-auto h-5 max-w-xs animate-pulse rounded bg-muted" />
            <div className="mx-auto h-12 max-w-2xl animate-pulse rounded-full bg-muted" />
            <div className="flex justify-center gap-3 pt-2">
              <div className="h-12 w-44 animate-pulse rounded-2xl bg-muted" />
              <div className="h-12 w-36 animate-pulse rounded-2xl bg-muted" />
            </div>
          </div>
        </div>
      </div>
      <span className="sr-only">Cargando contenido…</span>
    </div>
  );
};

export default AppShellSkeleton;
