// Checkout ka apna layout — landing page jaisa cream strip, koi navbar nahi.
export default function CheckoutLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#fdfcf9]">
      {/* Upar wali patti — landing page ke hero cream color (#f7f2ea) se match */}
      <div className="border-b border-[#e6dfd2] bg-[#f7f2ea]">
        <p className="mx-auto max-w-6xl px-5 py-2.5 text-center text-[10px] uppercase tracking-[0.22em] text-[#3c3e2d] sm:px-8 sm:text-[11px]">
          Free shipping on all orders · Cash on delivery available
        </p>
      </div>

      <main className="flex-1">{children}</main>
    </div>
  );
}
