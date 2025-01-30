"use client";

import Image from "next/image";
import dynamic from "next/dynamic";

const HolterGraph = dynamic(() => import("./components/HolterGraph"), {
  ssr: false,
});

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center w-full">
        <div className="flex flex-col items-center gap-4">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js Logo"
            width={180}
            height={38}
            priority
          />
          <h1 className="text-xl font-semibold">Heart Rate Monitor</h1>
        </div>
        
        <div className="w-full max-w-4xl">
          <HolterGraph />
        </div>
      </main>
    </div>
  );
}