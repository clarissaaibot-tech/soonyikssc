const BASE_ID = 'app9EogsZVy729rVx';
const TABLE_ID = 'tblcW4oq4F2UQquV0';

const CATEGORIES = [
  '[ + − × ÷ ] Business Venture',
  '[ + − × ÷ ]',
  '[ + - x / ] Business Venture',
  '[ + - x / ]'
];

function authHeader(pat) {
  return { Authorization: `Bearer ${pat}` };
}

module.exports = async (req, res) => {
  const pat = process.env.AIRTABLE_API_KEY;
  if (!pat) {
    return res.status(500).json({ error: 'AIRTABLE_API_KEY not configured in Vercel env vars' });
  }

  // ── Create a record ──
  // POST /api/pipeline  { fields: { "Action Item": "...", ... } }
  // The PAT never leaves the server; the browser cannot reach Airtable directly.
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
    }
    const fields = body && body.fields ? body.fields : body;
    if (!fields || !fields['Action Item']) {
      return res.status(400).json({ error: 'Action Item is required' });
    }
    // Single-select choices cannot be created through the API, so keep the
    // category to a value that already exists in the base.
    if (fields.Category && !CATEGORIES.includes(fields.Category)) {
      return res.status(400).json({
        error: 'Category must be one of the existing choices',
        allowed: CATEGORIES
      });
    }
    try {
      const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`, {
        method: 'POST',
        headers: { ...authHeader(pat), 'Content-Type': 'application/json' },
        body: JSON.stringify({ typecast: true, records: [{ fields }] })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return res.status(response.status).json({
          error: (data.error && data.error.message) || 'Airtable error'
        });
      }
      return res.status(201).json({ record: data.records && data.records[0] });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── Update a record ──
  // PATCH /api/pipeline { id: "rec...", fields: { ... } }
  // Airtable's PATCH merges, so fields not supplied are left alone.
  if (req.method === 'PATCH') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
    }
    const { id, fields } = body || {};
    if (!id || !fields || !Object.keys(fields).length) {
      return res.status(400).json({ error: 'id and fields are required' });
    }
    if (fields.Category && !CATEGORIES.includes(fields.Category)) {
      return res.status(400).json({
        error: 'Category must be one of the existing choices',
        allowed: CATEGORIES
      });
    }
    try {
      const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}/${id}`, {
        method: 'PATCH',
        headers: { ...authHeader(pat), 'Content-Type': 'application/json' },
        body: JSON.stringify({ typecast: true, fields })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return res.status(response.status).json({
          error: (data.error && data.error.message) || 'Airtable error'
        });
      }
      return res.status(200).json({ record: data });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const records = [];
    let offset = null;

    do {
      let url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?sort[0][field]=Deadline&sort[0][direction]=asc`;
      if (offset) url += `&offset=${offset}`;

      const response = await fetch(url, {
        headers: authHeader(pat)
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return res.status(response.status).json({ error: err.error?.message || 'Airtable error' });
      }

      const data = await response.json();
      records.push(...(data.records || []));
      offset = data.offset;
    } while (offset);

    res.status(200).json({ records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
