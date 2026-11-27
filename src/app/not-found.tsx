import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-24 tablet:px-8">
      <h1 className="text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="mt-4">
        <Link href="/" className="underline underline-offset-4">
          전시 메인으로 돌아가기
        </Link>
      </p>
    </main>
  );
}
