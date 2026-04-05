export function VideoCardSkeleton() {
  return (
    <div className="glass-card overflow-hidden">
      <div className="aspect-video skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-4 skeleton rounded w-3/4" />
        <div className="h-3 skeleton rounded w-1/2" />
      </div>
    </div>
  );
}
