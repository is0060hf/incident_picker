// API関連のユーティリティ関数

export function buildQueryParams(params: Record<string, any>): URLSearchParams {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        searchParams.append(key, value.join(','));
      } else if (value instanceof Date) {
        searchParams.append(key, value.toISOString());
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  return searchParams;
}

export async function fetchWithErrorHandling(url: string, options?: RequestInit): Promise<Response> {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorMessage = `HTTP error! status: ${response.status}`;
    throw new Error(errorMessage);
  }
  
  return response;
}

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetchWithErrorHandling(url, options);
  return response.json();
}

export async function fetchBlob(url: string, options?: RequestInit): Promise<Blob> {
  const response = await fetchWithErrorHandling(url, options);
  return response.blob();
}
