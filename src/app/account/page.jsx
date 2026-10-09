import { Suspense } from "react";
// import AccountContent from "./AccountContent";
import AccountContent from "@/component/AccountContent";

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FFF3E8]">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#F4A261] border-t-transparent" />

            <p className="mt-4 text-sm font-semibold text-[#2A211C]">
              Loading your Every Step account...
            </p>
          </div>
        </div>
      }
    >
      <AccountContent />
    </Suspense>
  );
}