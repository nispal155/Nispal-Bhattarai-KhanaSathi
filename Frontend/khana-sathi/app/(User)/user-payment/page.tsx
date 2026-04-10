import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import PaymentPageContent from "./PaymentContent";

function PaymentFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-red-500" />
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<PaymentFallback />}>
      <PaymentPageContent />
    </Suspense>
  );
}
