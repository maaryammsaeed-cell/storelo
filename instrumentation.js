// Server start hote hi ek background sweeper chalao.
// Isse expired reservations bina kisi request ke khud release ho jati hain.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (globalThis.__storeloReserveSweeper) return;

  const { releaseExpiredReservations } = await import("@/lib/reserve");

  globalThis.__storeloReserveSweeper = setInterval(() => {
    releaseExpiredReservations().catch((error) => {
      console.error("Reservation sweep failed:", error);
    });
  }, 5000);
}
