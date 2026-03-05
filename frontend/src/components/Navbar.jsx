import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-indigo-600">ShopHub</Link>
        <div className="flex items-center gap-4">
          <Link to="/products">Products</Link>
          {user?.role === 'customer' && <Link to="/cart">Cart</Link>}
          {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
          {user?.role === 'vendor' && <Link to="/vendor">Vendor</Link>}
          {user ? (
            <button onClick={logout} className="px-4 py-2 bg-gray-900 text-white rounded">Logout</button>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register" className="px-4 py-2 bg-indigo-600 text-white rounded">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
