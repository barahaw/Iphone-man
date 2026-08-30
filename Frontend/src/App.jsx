import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import StoreLayout from './shared/layouts/StoreLayout';
import AdminLayout from './shared/layouts/AdminLayout';
import { ToastContainer } from './shared/components/Toast';
import { Loader2 } from 'lucide-react';
import { useUiStore } from './shared/stores/useUiStore';

import { HomePage } from './features/home/components/HomePage';
import { PLP } from './features/products/components/PLP';
import { PDP } from './features/products/components/PDP';
import { WishlistPage } from './features/wishlist/components/WishlistPage';
import { AboutPage } from './features/info/components/AboutPage';
import { ContactPage } from './features/info/components/ContactPage';

const CheckoutWizard = lazy(() =>
  import('./features/checkout/components/CheckoutWizard').then((m) => ({ default: m.CheckoutWizard }))
);
const ComparePage = lazy(() =>
  import('./features/products/components/ComparePage').then((m) => ({ default: m.ComparePage }))
);
const AdminLogin = lazy(() =>
  import('./features/admin/components/AdminLogin').then((m) => ({ default: m.AdminLogin }))
);
const AdminDashboard = lazy(() =>
  import('./features/admin/components/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const AddProduct = lazy(() =>
  import('./features/admin/components/AddProduct').then((m) => ({ default: m.default }))
);
const AdminSettings = lazy(() =>
  import('./features/admin/components/AdminSettings').then((m) => ({ default: m.default }))
);

function PageFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center" aria-busy="true">
      <Loader2 className="w-7 h-7 text-text-brand animate-spin" />
    </div>
  );
}

export default function App() {
  const { locale, dir, theme } = useUiStore();

  useEffect(() => {
    document.documentElement.setAttribute('lang', locale);
    document.documentElement.setAttribute('dir', dir);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [locale, dir, theme]);

  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Customer Storefront Routes */}
          <Route element={<StoreLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<PLP />} />
            <Route path="/product/:slug" element={<PDP />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/checkout" element={<CheckoutWizard />} />
          </Route>

          {/* Staff Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/add" element={<AddProduct />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </Suspense>
      <ToastContainer />
    </BrowserRouter>
  );
}