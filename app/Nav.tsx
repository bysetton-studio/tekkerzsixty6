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
    <header className="bg-[#111] border-b border-[#222] px-8 pt-6 pb-0">
      <div className="flex items-center gap-4 mb-4">
        <Image src="/favcon.jpeg" alt="Logo" width={40} height={40} className="rounded-full" />
        <span className="text-white text-xl font-bold font-mono">Court 4</span>
      </div>
      <nav className="flex gap-1">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-2 text-sm font-mono rounded-t-lg border-t border-x transition-colors ${
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
