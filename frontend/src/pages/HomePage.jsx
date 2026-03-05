import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-4">ShopHub Marketplace</h1>
      <p className="text-lg text-gray-700 mb-6">Multi-vendor e-commerce built for Gombe State, Nigeria.</p>
      <Link to="/products" className="px-6 py-3 bg-indigo-600 text-white rounded-lg">Browse Products</Link>
    </div>
  );
}
