export default function Loading() {
  return (
    <div className="animate-pulse motion-reduce:animate-none" aria-busy="true" aria-label="Chargement">
      <div className="mb-2 h-4 w-24 rounded bg-bg-alt" />
      <div className="mb-8 h-8 w-64 rounded bg-bg-alt" />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-28 rounded-xl border border-rule bg-surface" />
        ))}
      </div>
      <div className="rounded-xl border border-rule bg-surface">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex gap-4 border-b border-rule px-4 py-4 last:border-b-0">
            <div className="h-4 w-1/6 rounded bg-bg-alt" />
            <div className="h-4 w-2/6 rounded bg-bg-alt" />
            <div className="h-4 w-1/6 rounded bg-bg-alt" />
          </div>
        ))}
      </div>
    </div>
  );
}
