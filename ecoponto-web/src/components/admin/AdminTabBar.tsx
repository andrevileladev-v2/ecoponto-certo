export type AdminTabItem<T extends string = string> = {
  id: T;
  label: string;
  count?: number;
};

export function AdminTabBar<T extends string>({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: ReadonlyArray<AdminTabItem<T>>;
  activeTab: T;
  onChange: (tab: T) => void;
}) {
  return (
    <div className="flex gap-1 mt-4">
      {tabs.map(({ id, label, count }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors ${
            activeTab === id
              ? 'bg-bg text-fg'
              : 'text-white/40 hover:text-white/75'
          }`}
        >
          <span>{label}</span>
          {typeof count === 'number' && (
            <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-white/90">
              {count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
