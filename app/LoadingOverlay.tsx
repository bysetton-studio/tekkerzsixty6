"use client";

interface Props {
  message: string;
  onCancel: () => void;
}

export default function LoadingOverlay({ message, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 p-8 rounded-2xl bg-[#1a1a1a] border border-[#333] max-w-sm w-full mx-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#1bb1ac40] border-t-[#1bb1ac] animate-spin" />
        <p className="text-white text-sm text-center">{message}</p>
        <button
          onClick={onCancel}
          className="px-6 py-2 rounded-lg bg-[#2a2a2a] text-[#aaa] hover:bg-[#333] hover:text-white transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
