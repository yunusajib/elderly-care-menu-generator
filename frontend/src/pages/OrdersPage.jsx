import { useEffect, useState } from 'react';
import api from '../services/api';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get('/orders/my-orders').then((res) => setOrders(res.data));
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Order History</h2>
      {orders.map((order) => (
        <div key={order._id} className="bg-white p-4 mb-3 rounded shadow">
          <p className="font-semibold">Order #{order._id.slice(-8)}</p>
          <p>Status: {order.orderStatus}</p>
          <p>Payment: {order.paymentStatus}</p>
          <p>Total: ₦{order.totalPrice}</p>
        </div>
      ))}
    </div>
  );
}
