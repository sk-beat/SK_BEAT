import { useEffect } from "react";

export const appTitle = "SK Beat";

export function formatDocumentTitle(title: string) {
  return `${title} | ${appTitle}`;
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = formatDocumentTitle(title);
  }, [title]);
}
