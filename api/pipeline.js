const BASE_ID = 'app9EogsZVy729rVx';
const TABLE_ID = 'tblcW4oq4F2UQquV0';

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const pat = process.env.AIRTABLE_API_KEY;
  if (!pat) {
    return res.status(500).json({ error: 'AIRTABLE_API_KEY not configured in Vercel env vars' });
  }

  try {
    const records = [];
    let offset = null;

    do {
      let url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?sort[0][field]=Deadline&sort[0][direction]=asc`;
      if (offset) url += `&offset=${offset}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${pat}` }
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
