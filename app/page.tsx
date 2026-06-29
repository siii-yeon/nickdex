import PhotoUpload from "@/components/PhotoUpload";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 px-4 py-10 sm:px-6">
      <main className="w-full max-w-md">
        <div className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-xl shadow-violet-100/60 backdrop-blur-sm sm:p-8">
          <div className="mb-8 text-center">
            <span className="mb-3 inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold tracking-wide text-violet-600">
              AI 별명 생성기
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              별명도감
            </h1>
            <p className="mt-3 text-base leading-relaxed text-zinc-500 sm:text-lg">
              사진을 올리면 AI가 병맛 별명을 붙여줍니다.
            </p>
          </div>

          <PhotoUpload />
        </div>
      </main>
    </div>
  );
}
