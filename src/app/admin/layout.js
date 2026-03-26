import { Analytics } from "@vercel/analytics/next"

export const metadata = {
  title: 'Administrador - AROX',
  description: 'Gestão executiva e telemetria.',
  robots: 'noindex, nofollow'
};

export default function AdminLayout({ children }) {
  return (
    <div className="admin-root-container min-h-screen bg-[#09090b] text-white antialiased">
      {children}
      <Analytics />
    </div>
  );
}