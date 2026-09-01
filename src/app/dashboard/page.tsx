'use client';

import { useEffect, useState } from 'react';

const STATUS_ORDER = ['Not Started', 'In Progress', 'Waiting'];
const COL_CLASS = {
  'Not Started': 'col-notstarted',
  'In Progress': 'col-inprogress',
  'Waiting': 'col-waiting',
  'Overdue': 'col-overdue'
};
const COL_LABEL = {
  'Not Started': 'Not Started',
  'In Progress': 'In Progress',
  'Waiting': 'Waiting',
  'Overdue': 'Overdue'
};

function priorityClass(p) {
  if (p === 'High') return 'priority-high';
  if (p === 'Medium') return 'priority-medium';
  if (p === 'Low') return 'priority-low';
  return '';
}

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function Card({ r, todayStr }) {
  const f = r.fields;
  const isOverdue = f.Deadline && f.Deadline < todayStr && f.Status !== 'Completed';
  const dl = fmtDate(f.Deadline);
  const pic = f['Person In Charge'] || '—';
  const pri = f.Priority || '';
  const title = f['Action Item'] || '(No title)';

  return (
    <div className="card">
      <div className="card-title">{title}</div>
      <div className="card-meta">
        <div className="card-pic">{pic}</div>
        <div className="card-right">
          {isOverdue && <span className="overdue-badge">{dl} ⚠</span>}
          {pri && <span className={`priority-badge ${priorityClass(pri)}`}>{pri}</span>}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/pipeline')
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setRecords(d.records || []);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontFamily: 'Hanken Grotesk, sans-serif' }}>
        Loading pipeline data...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', fontFamily: 'Hanken Grotesk, sans-serif' }}>
        Failed to load: {error}
      </div>
    );
  }

  const overdueCount = records.filter(r => {
    const dl = r.fields.Deadline;
    return dl && dl < todayStr && r.fields.Status !== 'Completed';
  }).length;

  const activeCount = records.filter(r => r.fields.Status === 'In Progress').length;
  const waitingCount = records.filter(r => r.fields.Status === 'Waiting').length;
  const upcomingCount = records.filter(r => {
    const dl = r.fields.Deadline;
    return (!dl || dl >= todayStr) && r.fields.Status !== 'Completed' && r.fields.Status !== 'In Progress' && r.fields.Status !== 'Waiting';
  }).length;

  const total = records.filter(r => r.fields.Status !== 'Completed').length;
  const completed = records.filter(r => r.fields.Status === 'Completed').length;
  const pct = total + completed > 0 ? Math.round((completed / (total + completed)) * 100) : 0;

  // Group by category
  const categories = {};
  records.forEach(r => {
    const cat = r.fields.Category || 'Uncategorized';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(r);
  });

  const sortedCats = Object.keys(categories).sort((a, b) => {
    const aHasOverdue = categories[a].some(r =>
      r.fields.Deadline && r.fields.Deadline < todayStr && r.fields.Status !== 'Completed'
    );
    const bHasOverdue = categories[b].some(r =>
      r.fields.Deadline && r.fields.Deadline < todayStr && r.fields.Status !== 'Completed'
    );
    if (aHasOverdue && !bHasOverdue) return -1;
    if (!aHasOverdue && bHasOverdue) return 1;
    return a.localeCompare(b);
  });

  return (
    <div style={{ background: '#000', color: '#fff', fontFamily: 'Hanken Grotesk, sans-serif', minHeight: '100vh' }}>
      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 60px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.3px' }}>
          SoonYik<span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}> SSC</span>
        </div>
        <ul style={{ display: 'flex', gap: '36px', listStyle: 'none' }}>
          <li><a href="index.html" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Home</a></li>
          <li><a href="dashboard.html" style={{ color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Action Pipeline</a></li>
        </ul>
      </nav>

      {/* HEADER */}
      <div style={{ padding: '120px 60px 40px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '12px' }}>CEO Command Center</div>
        <h1 style={{ fontSize: '48px', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1, marginBottom: '16px' }}>Action Pipeline</h1>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)' }}>What needs to move. Grouped by category, tracked by status.</p>

        <div style={{ display: 'flex', gap: '48px', marginTop: '32px' }}>
          {[
            { label: 'Overdue', num: overdueCount, color: '#ef4444' },
            { label: 'Active', num: activeCount, color: '#3b82f6' },
            { label: 'Waiting', num: waitingCount, color: '#f59e0b' },
            { label: 'Upcoming', num: upcomingCount, color: '#22c55e' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-1px', lineHeight: 1, color: s.color }}>{s.num}</div>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div style={{ margin: '30px 60px', padding: '20px 24px', background: '#121212', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>Overall Progress</div>
        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '100px', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: '100px', background: '#22c55e', width: `${pct}%`, transition: 'width 0.6s ease' }} />
        </div>
        <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px' }}>{pct}%</div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>complete</div>
      </div>

      {/* CATEGORY SECTIONS */}
      <div style={{ padding: '0 60px 80px' }}>
        {sortedCats.map(cat => {
          const items = categories[cat];
          const overdue = items.filter(r =>
            r.fields.Deadline && r.fields.Deadline < todayStr && r.fields.Status !== 'Completed'
          );
          const normal = items.filter(r =>
            !r.fields.Deadline || r.fields.Deadline >= todayStr || r.fields.Status === 'Completed'
          );
          const catActiveCount = items.filter(r => r.fields.Status !== 'Completed').length;
          if (catActiveCount === 0) return null;

          const cols = [
            { key: 'Overdue', items: overdue },
            { key: 'Not Started', items: normal.filter(r => r.fields.Status === 'Not Started') },
            { key: 'In Progress', items: normal.filter(r => r.fields.Status === 'In Progress') },
            { key: 'Waiting', items: normal.filter(r => r.fields.Status === 'Waiting') }
          ];

          return (
            <div key={cat} style={{ marginBottom: '60px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>{cat}</div>
                <div style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '100px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>{catActiveCount} active</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {cols.map(col => {
                  const cls = COL_CLASS[col.key];
                  const label = COL_LABEL[col.key];
                  const count = col.items.length;
                  const colColors = {
                    'col-notstarted': { label: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
                    'col-inprogress': { label: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
                    'col-waiting': { label: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
                    'col-overdue': { label: '#ef4444', bg: 'rgba(239,68,68,0.15)' }
                  };
                  const c = colColors[cls] || { label: '#fff', bg: 'rgba(255,255,255,0.08)' };

                  return (
                    <div key={col.key} className={cls} style={{ background: '#121212', borderRadius: '16px', padding: '16px', minHeight: '120px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: c.label }}>{label}</div>
                        {count > 0 && <div style={{ fontSize: '11px', fontWeight: 600, padding: '2px 7px', borderRadius: '100px', background: c.bg, color: c.label }}>{count}</div>}
                      </div>

                      {count === 0 ? (
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.15)', fontStyle: 'italic', padding: '8px 0' }}>—</div>
                      ) : (
                        col.items.map(r => <Card key={r.id} r={r} todayStr={todayStr} />)
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER */}
      <div style={{ padding: '20px 60px', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: '11px', color: 'rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'space-between' }}>
        <span>CEO Command Center · Airtable</span>
        <span>Updated {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .card { background: #1c1c1c; border-radius: 10px; padding: 12px; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.04); transition: border-color 0.2s; }
        .card:hover { border-color: rgba(255,255,255,0.1); }
        .card-title { font-size: 13px; font-weight: 600; line-height: 1.3; margin-bottom: 8px; color: rgba(255,255,255,0.85); }
        .card-meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .card-pic { font-size: 11px; color: rgba(255,255,255,0.35); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .card-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .priority-badge { font-size: 10px; font-weight: 700; letter-spacing: 0.5px; padding: 2px 7px; border-radius: 100px; }
        .priority-high { background: rgba(239,68,68,0.2); color: #f87171; }
        .priority-medium { background: rgba(245,158,11,0.2); color: #fbbf24; }
        .priority-low { background: rgba(59,130,246,0.2); color: #60a5fa; }
        .overdue-badge { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 100px; background: rgba(239,68,68,0.2); color: #f87171; }
      `}</style>
    </div>
  );
}
