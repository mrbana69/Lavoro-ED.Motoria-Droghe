import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Deep Analysis - L'All-In Letale",
};

export default function AnalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-neutral-950 to-black text-white font-mono">
      {children}
    </div>
  );
}
