"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";

export default function FPORedirectPage() {
  const router = useRouter();
  const { setRole } = useApp();

  useEffect(() => {
    setRole("fpo");
    router.replace("/farmer/dashboard");
  }, [router, setRole]);

  return (
    <div className="p-12 text-center text-sm text-slate-500">
      Switching to FPO Hub Mode on Farmer / FPO Portal...
    </div>
  );
}
