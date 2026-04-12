export async function storagePut(
  relKey: string,
  data: any,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  return { key: relKey, url: "" };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string; }> {
  return { key: relKey, url: "" };
}
