import { useEffect, useRef } from "react";
import { usePayOS } from "@payos/payos-checkout";

export function usePayOSEmbeddedCheckout({
  checkoutUrl,
  elementId,
  onSuccess,
  onCancel,
  returnUrl = `${window.location.origin}/payment/result`,
}) {
  const { open } = usePayOS({
    RETURN_URL: returnUrl,
    ELEMENT_ID: elementId,
    CHECKOUT_URL: checkoutUrl,
    embedded: true,
    onSuccess,
    onCancel,
  });

  const openedCheckoutUrl = useRef("");
  useEffect(() => {
    if (!checkoutUrl || openedCheckoutUrl.current === checkoutUrl) return;
    openedCheckoutUrl.current = checkoutUrl;
    open();
  }, [checkoutUrl, open]);
}
