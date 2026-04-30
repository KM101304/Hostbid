import { Card } from "@/components/ui/card";

export function PageLoading() {
  return (
    <main className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-8 lg:grid-cols-2 lg:px-8 lg:py-10">
      {[0, 1].map((item) => (
        <Card key={item} as="section" className="space-y-5 p-6 sm:p-8">
          <div className="h-6 w-32 animate-pulse rounded-full bg-slate-200" />
          <div className="h-10 w-3/4 animate-pulse rounded-xl bg-slate-200" />
          <div className="space-y-3">
            <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        </Card>
      ))}
    </main>
  );
}
