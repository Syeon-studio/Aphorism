import { COPYRIGHT_HOLDER } from "@/lib/exhibition";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-current/10 px-4 py-8 text-xs leading-relaxed opacity-70 tablet:px-8">
      <p>© 2026 {COPYRIGHT_HOLDER}. All rights reserved.</p>
      <p>
        작품 이미지의 저작권은 각 작가에게, 작품 사진의 저작권은 각 촬영자에게
        있습니다. 사전 허락 없이 복제·배포하거나 AI 학습에 이용할 수 없습니다.
      </p>
    </footer>
  );
}
