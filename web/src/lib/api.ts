export class ApiError extends Error {
  // The parsed error response body, when there was one — most callers only
  // need `message`, but a few (e.g. bulk import) need extra fields like
  // per-row errors that don't fit a single string.
  data?: unknown;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: "include",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let data: unknown;
    try {
      data = await res.json();
      if ((data as { error?: string })?.error) message = (data as { error: string }).error;
    } catch {
      // response had no JSON body
    }
    const err = new ApiError(message);
    err.data = data;
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body ?? {}),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body ?? {}),
  delete: <T>(path: string, body?: unknown) => request<T>("DELETE", path, body),
};

// Downloads a PDF via a real navigation-triggered fetch so the session cookie
// is sent, then hands the browser a Blob URL to save — fetch responses can't
// be handed to <a download> directly. `path` is the full /api-relative path,
// e.g. "/profiles/:id/pdf" or "/job-descriptions/:id/pdf".
export async function downloadPdf(path: string, suggestedName: string) {
  const res = await fetch(`/api${path}`, { credentials: "include" });
  if (!res.ok) throw new ApiError(`Could not generate the PDF (${res.status}).`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = suggestedName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
