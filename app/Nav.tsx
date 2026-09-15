"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Clips",           href: "/" },
  { label: "★ Archive",       href: "/mega-highlights-archive" },
  { label: "Team Generator",  href: "/team-generator" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="bg-[#111] border-b border-[#222] px-4 md:px-8 pt-4 md:pt-6 pb-0">
      <div className="flex items-center gap-3 mb-3 md:mb-4">
        <Image src="/favcon.jpeg" alt="Logo" width={36} height={36} className="rounded-full" />
        <span className="text-white text-lg md:text-xl font-bold font-mono">Court 4</span>
      </div>
      <nav className="flex gap-1 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-3 md:px-4 py-2 text-sm font-mono rounded-t-lg border-t border-x transition-colors whitespace-nowrap ${
                active
                  ? "bg-[#0d3f3e] border-[#1bb1ac40] text-[#1bb1ac]"
                  : "border-transparent text-[#666] hover:text-[#aaa]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
