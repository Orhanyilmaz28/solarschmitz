/** Sanfter Seitenübergang bei jedem Routenwechsel. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="motion-safe:animate-page-in">{children}</div>;
}
