import { useEffect, useState } from 'react';
import api from '../services/api';

export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [deliveryOption, setDeliveryOption] = useState('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  useEffect(() => {
    api.get('/cart').then((res) => setCart(res.data));
  }, []);

  const checkout = async () => {
    const { data } = await api.post('/orders/checkout', { deliveryOption, deliveryAddress });
    window.location.href = data.payment.authorization_url;
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">My Cart</h2>
      {cart?.items?.map((item) => (
        <div key={item.product._id} className="bg-white p-3 rounded mb-3 shadow flex justify-between">
          <p>{item.product.name} x {item.quantity}</p>
          <p>₦{item.product.price * item.quantity}</p>
        </div>
      ))}
      <div className="bg-white p-4 rounded shadow space-y-3">
        <select className="border p-2 rounded w-full" onChange={(e) => setDeliveryOption(e.target.value)}>
          <option value="pickup">Pickup from vendor shop (No fee)</option>
          <option value="home_delivery">Home delivery (Delivery fee applies)</option>
        </select>
        {deliveryOption === 'home_delivery' && <input className="border p-2 rounded w-full" placeholder="Delivery address" onChange={(e) => setDeliveryAddress(e.target.value)} />}
        <button onClick={checkout} className="w-full py-2 bg-emerald-600 text-white rounded">Pay with Paystack</button>
      </div>
    </div>
  );
}
