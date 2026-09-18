"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/dashboard");
  }, [router]);

  return (
    <div className="p-12 text-center text-sm text-slate-500">
      Redirecting to Admin Operations Dashboard...
    </div>
  );
}
