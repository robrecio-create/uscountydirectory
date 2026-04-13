import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const COUNTY_MAP: Record<string, string> = {
  'jackson-county-ms': 'jackson-ms',
  'harrison-county-ms': 'harrison-ms',
  'hancock-county-ms': 'hancock-ms',
};

export const POST: APIRoute = async ({ request }) => {
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Events system is not configured yet. Please try again later.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();

    const countySlug = body.county || '';
    const county = COUNTY_MAP[countySlug];
    if (!county) {
      return new Response(JSON.stringify({ error: 'Please select a valid county.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const title = (body.title || '').trim();
    if (!title) {
      return new Response(JSON.stringify({ error: 'Event name is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const date = body.date || '';
    if (!date) {
      return new Response(JSON.stringify({ error: 'Event date is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const slug = slugify(title) + '-' + date.replace(/-/g, '');

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase.from('events').insert({
      title,
      slug,
      status: 'pending',
      source: 'submission',
      content: body.description || '',
      date,
      end_date: body.end_date || null,
      start_time: body.start_time || '',
      end_time: body.end_time || '',
      recurring: body.recurring || '',
      venue: body.venue || '',
      address: body.address || '',
      city: body.city || '',
      county,
      cost: body.cost || '',
      website: body.website || '',
      submitter_name: body.contact_name || '',
      submitter_email: body.contact_email || '',
      submitter_phone: body.contact_phone || '',
    });

    if (error) {
      console.error('Supabase insert error:', error);
      return new Response(JSON.stringify({ error: 'Failed to submit event. Please try again.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Submit event error:', err);
    return new Response(JSON.stringify({ error: 'Invalid request.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
