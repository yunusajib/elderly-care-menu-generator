import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'customer', shopName: '', shopAddress: '' });
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (form.role !== 'vendor') {
      delete payload.shopName;
      delete payload.shopAddress;
    }
    const { data } = await api.post('/auth/register', payload);
    login(data);
    navigate('/');
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white mt-10 rounded shadow">
      <h2 className="text-2xl font-semibold mb-4">Create Account</h2>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full border p-2 rounded" placeholder="Full name" onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <input className="w-full border p-2 rounded" placeholder="Email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input type="password" className="w-full border p-2 rounded" placeholder="Password" onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <select className="w-full border p-2 rounded" onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="customer">Customer</option>
          <option value="vendor">Vendor</option>
        </select>
        {form.role === 'vendor' && (
          <>
            <input className="w-full border p-2 rounded" placeholder="Shop name" onChange={(e) => setForm({ ...form, shopName: e.target.value })} />
            <input className="w-full border p-2 rounded" placeholder="Shop address" onChange={(e) => setForm({ ...form, shopAddress: e.target.value })} />
          </>
        )}
        <button className="w-full py-2 bg-indigo-600 text-white rounded">Register</button>
      </form>
    </div>
  );
}
