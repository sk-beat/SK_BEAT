export async function getSupabaseFunctionErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (error && typeof error === "object" && "context" in error) {
    const response = (error as { context?: unknown }).context;

    if (response instanceof Response) {
      try {
        const body = await response.clone().json();

        if (
          body &&
          typeof body === "object" &&
          "error" in body &&
          typeof body.error === "string"
        ) {
          return body.error;
        }

        if (
          body &&
          typeof body === "object" &&
          "message" in body &&
          typeof body.message === "string"
        ) {
          return body.message;
        }
      } catch {
        try {
          const text = await response.clone().text();

          if (text.trim()) {
            return text;
          }
        } catch {
          // Fall through to the generic fallback.
        }
      }
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
