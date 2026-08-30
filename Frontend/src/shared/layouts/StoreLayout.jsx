import { Outlet } from 'react-router-dom';
import { StoreHeader } from '../components/StoreHeader';
import { Footer } from '../components/Footer';
import { FloatingChat } from '../components/FloatingChat';
import { CartDrawer } from '../../features/cart/components/CartDrawer';
import { CompareTray } from '../components/ui/CompareTray';

export default function StoreLayout() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-background-primary">
      <StoreHeader />
      <main className="mx-auto w-full max-w-[1380px] flex-1 px-4 pt-[88px] sm:px-6 lg:px-10 lg:pt-[96px]">
        <Outlet />
      </main>
      <Footer />
      <FloatingChat />
      <CartDrawer />
      <CompareTray />
    </div>
  );
}
