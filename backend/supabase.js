import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function getFormations() {
  const { data, error } = await supabase
    .from('formations')
    .select('*')
    .order('id', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getFormation(id) {
  const { data, error } = await supabase
    .from('formations')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function createFormation({ titre, contenu, image }) {
  const { data, error } = await supabase
    .from('formations')
    .insert({ titre, contenu, image })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateFormation(id, { titre, contenu, image }) {
  const updates = { titre, contenu, updatedAt: new Date().toISOString() };
  if (image !== undefined) updates.image = image;

  const { data, error } = await supabase
    .from('formations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteFormation(id) {
  const { data, error } = await supabase
    .from('formations')
    .delete()
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function migrateFromJson() {
  const { count, error: countError } = await supabase
    .from('formations')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.warn('Could not check formations count:', countError.message);
    return;
  }

  if (count > 0) return;

  try {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const { dirname } = await import('path');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const jsonPath = path.join(__dirname, 'data', 'formations.json');

    if (!fs.existsSync(jsonPath)) return;

    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    if (!jsonData.formations || jsonData.formations.length === 0) return;

    const rows = jsonData.formations.map(f => ({
      id: f.id,
      titre: f.titre,
      contenu: f.contenu,
      image: f.image || null,
      vues: f.vues || 0,
      likes: f.likes || 0,
      commentaires: f.commentaires || 0,
      createdAt: f.createdAt || new Date().toISOString(),
      updatedAt: f.updatedAt || null
    }));

    const { error: insertError } = await supabase.from('formations').insert(rows);
    if (insertError) {
      console.warn('Migration from JSON failed:', insertError.message);
    } else {
      console.log(`Migrated ${rows.length} formations from JSON to Supabase`);
    }
  } catch (e) {
    console.warn('Could not migrate JSON data:', e.message);
  }
}
