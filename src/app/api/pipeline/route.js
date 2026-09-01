import { NextResponse } from 'next/server';

const AIRTABLE_PAT = process.env.AIRTABLE_API_KEY;
const BASE_ID = 'app9EogsZVy729rVx';
const TABLE_ID = 'tblcW4oq4F2UQquV0';

async function fetchAll(url, accumulated = []) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${AIRTABLE_PAT}` }
  });
  const data = await res.json();
  accumulated.push(...(data.records || []));
  if (data.offset) {
    return fetchAll(`${url}&offset=${data.offset}`, accumulated);
  }
  return accumulated;
}

export async function GET() {
  if (!AIRTABLE_PAT) {
    return NextResponse.json({ error: 'AIRTABLE_API_KEY not configured' }, { status: 500 });
  }

  try {
    const records = await fetchAll(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?maxRecords=100`,
      []
    );
    return NextResponse.json({ records });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
