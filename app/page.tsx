import SearchSection from "./_components/SearchSection";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-background font-sans">
      <main className="w-full max-w-2xl px-5 py-10 sm:py-16">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            <span className="text-primary">블루리본</span> 근처 맛집
          </h1>
          <p className="mt-2 text-base text-zinc-500">
            내 주변 블루리본 레스토랑을 찾아보세요
          </p>
        </div>

        <SearchSection />
      </main>
    </div>
  );
}
