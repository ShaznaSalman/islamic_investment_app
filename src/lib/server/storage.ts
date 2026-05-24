import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const BUCKETS = {
  documents: 'investment-documents',
  avatars: 'avatars',
  receipts: 'receipts',
} as const;

export type StorageBucket = keyof typeof BUCKETS;

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function bucketName(bucket: StorageBucket) {
  return process.env[`SUPABASE_BUCKET_${bucket.toUpperCase()}`] || BUCKETS[bucket];
}

export async function uploadFile(
  bucket: StorageBucket,
  storagePath: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const supabase = supabaseAdmin();
  const name = bucketName(bucket);

  if (supabase) {
    const { error } = await supabase.storage.from(name).upload(storagePath, buffer, {
      contentType,
      upsert: true,
    });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from(name).getPublicUrl(storagePath);
    return data.publicUrl;
  }

  const dir = path.join(process.cwd(), 'public', 'uploads', name);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filename = path.basename(storagePath);
  fs.writeFileSync(path.join(dir, filename), buffer);
  return `/uploads/${name}/${filename}`;
}

export async function deleteStoredFile(bucket: StorageBucket, fileUrl: string) {
  if (fileUrl.startsWith('/uploads/')) {
    const filePath = path.join(process.cwd(), 'public', fileUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return;
  }

  const supabase = supabaseAdmin();
  if (!supabase) return;

  const name = bucketName(bucket);
  const base = supabase.storage.from(name).getPublicUrl('').data.publicUrl;
  if (!fileUrl.startsWith(base)) return;
  const storagePath = fileUrl.slice(base.length);
  await supabase.storage.from(name).remove([storagePath]);
}

export function storagePathFor(prefix: string, ext: string) {
  return `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
}
