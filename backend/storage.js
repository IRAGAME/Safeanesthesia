import { supabase } from './supabase.js';

const BUCKET_NAME = 'formations';

export const imageStorage = {
  async upload(file) {
    const ext = file.originalname.split('.').pop();
    const fileName = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });
    if (error) throw new Error(`Upload failed: ${error.message}`);

    const { data: publicUrl } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    return publicUrl.publicUrl;
  },

  async delete(imageUrl) {
    if (!imageUrl) return;
    const fileName = imageUrl.split('/').pop();
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileName]);
    if (error) console.warn('Failed to delete image:', error.message);
  }
};
