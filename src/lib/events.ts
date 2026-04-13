import { createClient } from '@supabase/supabase-js';

export interface SharedEvent {
  id: string;
  title: string;
  slug: string;
  status: string;
  content: string;
  date: string;
  end_date: string | null;
  start_time: string;
  end_time: string;
  recurring: string;
  venue: string;
  address: string;
  city: string;
  county: string;
  cost: string;
  phone: string;
  website: string;
  tags: string[];
  featured: boolean;
  image_url: string | null;
}

const COUNTY_LABELS: Record<string, { name: string; url: string }> = {
  'jackson-ms': { name: 'Jackson County', url: 'https://www.jacksoncountyms.com' },
  'harrison-ms': { name: 'Harrison County', url: 'https://www.harrisoncountyms.com' },
  'hancock-ms': { name: 'Hancock County', url: 'https://www.hancockcountyms.com' },
};

export function getCountyLabel(county: string): string {
  return COUNTY_LABELS[county]?.name || county;
}

export function getCountyUrl(county: string): string {
  return COUNTY_LABELS[county]?.url || '#';
}

/**
 * Fetch all approved upcoming events across all counties from the shared Supabase events table.
 * Returns an empty array if Supabase is unavailable (no local JSON fallback for the aggregator).
 */
export async function getAllEvents(): Promise<SharedEvent[]> {
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return [];
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('events')
      .select('id, title, slug, status, content, date, end_date, start_time, end_time, recurring, venue, address, city, county, cost, phone, website, tags, featured, image_url')
      .eq('status', 'approved')
      .gte('date', today)
      .order('featured', { ascending: false })
      .order('date', { ascending: true });

    if (error || !data) {
      return [];
    }

    return data as SharedEvent[];
  } catch {
    return [];
  }
}
