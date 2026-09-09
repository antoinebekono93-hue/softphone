/** Execute only an explicit server route. An internal failure never retries PSTN. */
export async function dispatchCallRoute(
  route: unknown,
  handlers: {
    app: (destination: string) => Promise<unknown>;
    pstn: (destination: string) => Promise<unknown>;
  }
): Promise<void> {
  if (!route || typeof route !== "object") throw new Error("INVALID_CALL_ROUTE");
  const { type, destination } = route as { type?: unknown; destination?: unknown };
  if (typeof destination !== "string" || !destination.trim()) throw new Error("INVALID_CALL_ROUTE");
  if (type === "APP_TO_APP") {
    await handlers.app(destination);
  } else if (type === "APP_TO_PSTN") {
    await handlers.pstn(destination);
  } else {
    throw new Error("INVALID_CALL_ROUTE");
  }
}
