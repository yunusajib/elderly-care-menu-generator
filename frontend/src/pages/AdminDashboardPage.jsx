import { useEffect, useState } from 'react';
import api from '../services/api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api.get('/admin/dashboard').then((res) => setStats(res.data));
  }, []);

  if (!stats) return <p className="p-6">Loading...</p>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Admin Analytics Dashboard</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Vendors" value={stats.vendors} />
        <StatCard label="Products" value={stats.products} />
        <StatCard label="Orders" value={stats.orders} />
        <StatCard label="Revenue" value={`₦${stats.revenue}`} />
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded shadow p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
