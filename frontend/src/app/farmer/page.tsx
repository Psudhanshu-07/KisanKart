"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FarmerRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/farmer/dashboard");
  }, [router]);

  return (
    <div className="p-12 text-center text-sm text-slate-500">
      Redirecting to Farmer / FPO Portal...
    </div>
  );
}
