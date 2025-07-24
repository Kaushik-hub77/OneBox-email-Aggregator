import React, { useEffect, useState } from 'react';

interface Email {
  id: string;
  subject: string;
  from: string;
  to: string[];
  date: string;
  bodyText: string;
  accountId: string;
  category: string;
}

interface EmailSearchResult {
  emails: Email[];
  total: number;
}

const API_URL = 'http://localhost:3001/emails'; // Adjust if backend runs elsewhere

const categories = [
  'Interested',
  'Meeting Booked',
  'Not Interested',
  'Spam',
  'Out of Office',
  'Uncategorized',
];

const App: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [accountId, setAccountId] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [accounts, setAccounts] = useState<string[]>([]);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    fetchEmails();
    // eslint-disable-next-line
  }, [query, accountId, category, page]);

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API_URL}?size=100`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const emails = Array.isArray(data.emails) ? data.emails : [];
      const uniqueAccounts = Array.from(new Set(emails.map(e => e.accountId)));
      setAccounts(uniqueAccounts);
    } catch (err) {
      setAccounts([]);
    }
  };

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (accountId) params.append('accountId', accountId);
      if (category) params.append('category', category);
      params.append('page', page.toString());
      params.append('size', size.toString());
      const res = await fetch(`${API_URL}?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setEmails(Array.isArray(data.emails) ? data.emails : []);
      setTotal(data.total || 0);
    } catch (err) {
      setEmails([]);
      setTotal(0);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h1>Email Dashboard</h1>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search emails..."
          value={query}
          onChange={e => { setQuery(e.target.value); setPage(1); }}
          style={{ flex: 2 }}
        />
        <select value={accountId} onChange={e => { setAccountId(e.target.value); setPage(1); }}>
          <option value="">All Accounts</option>
          {accounts.map(acc => (
            <option key={acc} value={acc}>{acc}</option>
          ))}
        </select>
        <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      <div>
        {loading ? <p>Loading...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Subject</th>
                <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>From</th>
                <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>To</th>
                <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Date</th>
                <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Account</th>
                <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Category</th>
              </tr>
            </thead>
            <tbody>
              {emails.map(email => (
                <tr key={email.id}>
                  <td>{email.subject}</td>
                  <td>{email.from}</td>
                  <td>{email.to.join(', ')}</td>
                  <td>{new Date(email.date).toLocaleString()}</td>
                  <td>{email.accountId}</td>
                  <td>{email.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
          <span>Page {page} / {Math.ceil(total / size) || 1}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page * size >= total}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default App;
