export function AdminSectionHeader({
  title,
  count,
}: {
  title: string;
  count?: number;
}) {
  return (
    <p className="font-semibold text-fg">
      {title}
      {typeof count === 'number' && <span className="ml-2 text-fg-3">({count})</span>}
    </p>
  );
}
