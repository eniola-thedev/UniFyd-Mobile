import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/** Returns a signed URL for a private-bucket path. Path format: "<bucket>/<key>" */
export function useSignedUrl(path: string | null | undefined, expiresIn = 3600) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!path) {
      setUrl(null);
      return;
    }
    const [bucket, ...rest] = path.split("/");
    const key = rest.join("/");
    if (!bucket || !key) {
      setUrl(null);
      return;
    }
    let alive = true;
    supabase.storage
      .from(bucket)
      .createSignedUrl(key, expiresIn)
      .then(({ data }) => {
        if (alive) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      alive = false;
    };
  }, [path, expiresIn]);

  return url;
}

export async function getSignedUrls(paths: string[], expiresIn = 3600) {
  const grouped = new Map<string, string[]>();
  const order: string[] = [];
  for (const p of paths) {
    order.push(p);
    const [bucket, ...rest] = p.split("/");
    if (!bucket) continue;
    const key = rest.join("/");
    if (!grouped.has(bucket)) grouped.set(bucket, []);
    grouped.get(bucket)!.push(key);
  }
  const map = new Map<string, string>();
  for (const [bucket, keys] of grouped) {
    const { data } = await supabase.storage.from(bucket).createSignedUrls(keys, expiresIn);
    data?.forEach((d) => {
      if (d.path && d.signedUrl) map.set(`${bucket}/${d.path}`, d.signedUrl);
    });
  }
  return order.map((p) => map.get(p) ?? null);
}
