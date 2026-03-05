import { useEffect, useState } from 'react';
import api from '../services/api';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/products', { params: { search } }).then((res) => setProducts(res.data));
  }, [search]);

  const addToCart = async (productId) => {
    await api.post('/cart', { productId, quantity: 1 });
    alert('Added to cart');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold">Products</h2>
        <input className="border p-2 rounded" placeholder="Search" onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map((product) => (
          <div key={product._id} className="bg-white p-4 rounded shadow">
            <img src={product.images?.[0]} alt={product.name} className="h-44 w-full object-cover rounded mb-2" />
            <h3 className="font-semibold">{product.name}</h3>
            <p className="text-sm text-gray-600">{product.description}</p>
            <p className="font-bold mt-2">₦{product.price}</p>
            <button className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded" onClick={() => addToCart(product._id)}>Add to Cart</button>
          </div>
        ))}
      </div>
    </div>
  );
}
