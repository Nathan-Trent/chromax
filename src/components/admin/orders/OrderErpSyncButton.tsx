"use client";

import { Button } from "@/components/ui/Button";
import { useState } from "react";

export function OrderErpSyncButton({
  orderId,
  reference,
}: {
  orderId: string;
  reference: string;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      loading={busy}
      disabled={busy}
      onClick={() => {
        setBusy(true);
        void fetch("/api/admin/erp-sync/manual", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "order", recordId: orderId, reference }),
        }).finally(() => setBusy(false));
      }}
    >
      Sync to ERP now
    </Button>
  );
}
