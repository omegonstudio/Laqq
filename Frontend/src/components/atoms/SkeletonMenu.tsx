import { Skeleton } from "../ui/skeleton";

export function SkeletonMenu() {
  return (
    <>
      <div className="hidden md:flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-full" />
        ))}
      </div>

      <div className="flex md:hidden flex-col gap-2 w-full">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-xl" />
        ))}
      </div>
    </>
  );
}
