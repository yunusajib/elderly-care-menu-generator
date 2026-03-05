import { useEffect, useState } from 'react';
import api from '../services/api';

export default function VendorDashboardPage() {
  const [data, setData] = useState({ products: [], revenue: 0 });

  useEffect(() => {
    api.get('/vendor/dashboard').then((res) => setData(res.data));
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Vendor Dashboard</h2>
      <p className="mb-4 font-semibold">Revenue Summary: ₦{data.revenue}</p>
      <div className="grid md:grid-cols-3 gap-4">
        {data.products.map((p) => (
          <div key={p._id} className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold">{p.name}</h3>
            <p>Stock: {p.stockQuantity}</p>
            <p>Price: ₦{p.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
