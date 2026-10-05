"use client";
import { useSearchParams } from "next/navigation";
export function useMobileDetail(parameter: string) {
  const params = useSearchParams();
  const selected = params.get(parameter);
  function open(id: string) {
    const url = new URL(window.location.href);
    if (url.searchParams.get(parameter) === id) return;
    url.searchParams.set(parameter, id);
    // Next.js copies its internal markers itself. Passing __NA bypasses its router update.
    window.history.pushState({ mobileDetail: parameter }, "", url);
  }
  function close() {
    if (window.history.state?.mobileDetail === parameter) window.history.back();
    else {
      const url = new URL(window.location.href);
      url.searchParams.delete(parameter);
      window.history.replaceState({}, "", url);
    }
  }
  return { selected, open, close };
}
