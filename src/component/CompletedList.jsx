import React from "react";

export default function CompletedList({ tasksByQuadrant }) {
  const items = Object.entries(tasksByQuadrant).flatMap(([q, arr]) =>
    (arr || [])
      .filter((t) => t.status === 'completed')
      .map((t) => ({ ...t, quadrant: q }))
  );

  if (items.length === 0) {
    return (
      <div className="text-center text-slate-500 py-16">
        <p>No completed tasks yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((t) => (
        <div key={t.id} className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-slate-800">{t.title}</h3>
              {t.description ? (
                <p className="text-sm text-slate-500 line-clamp-2">{t.description}</p>
              ) : null}
            </div>
            <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">Completed</span>
          </div>
        </div>
      ))}
    </div>
  );
}
