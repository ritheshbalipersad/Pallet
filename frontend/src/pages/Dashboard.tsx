import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-lg font-semibold text-slate-100">Quick actions</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          to="/scan"
          className="flex flex-col items-center justify-center rounded-xl border border-slate-600 bg-slate-800 p-6 text-primary-400 transition hover:border-primary-500 hover:bg-slate-700"
        >
          <span className="text-3xl">📷</span>
          <span className="mt-2 font-medium">Scan barcode</span>
          <span className="text-sm text-slate-400">Lookup or add pallet</span>
        </Link>
        <Link
          to="/add-pallet"
          className="flex flex-col items-center justify-center rounded-xl border border-slate-600 bg-slate-800 p-6 text-slate-300 transition hover:border-slate-500 hover:bg-slate-700"
        >
          <span className="text-3xl">➕</span>
          <span className="mt-2 font-medium">Add pallet</span>
          <span className="text-sm text-slate-400">Create new pallet</span>
        </Link>
        <Link
          to="/move-out"
          className="flex flex-col items-center justify-center rounded-xl border border-slate-600 bg-slate-800 p-6 text-slate-300 transition hover:border-slate-500 hover:bg-slate-700"
        >
          <span className="text-3xl">📤</span>
          <span className="mt-2 font-medium">Move out</span>
          <span className="text-sm text-slate-400">Start movement</span>
        </Link>
        <Link
          to="/confirm-in"
          className="flex flex-col items-center justify-center rounded-xl border border-slate-600 bg-slate-800 p-6 text-slate-300 transition hover:border-slate-500 hover:bg-slate-700"
        >
          <span className="text-3xl">📥</span>
          <span className="mt-2 font-medium">Confirm in</span>
          <span className="text-sm text-slate-400">Complete movement</span>
        </Link>
      </div>
      <div className="rounded-xl border border-slate-600 bg-slate-800 p-4">
        <h3 className="font-medium text-slate-200">Reports</h3>
        <p className="mt-1 text-sm text-slate-400">View area summary, movement history, lost/damaged list, and export CSV.</p>
        <Link to="/reports" className="mt-3 inline-block text-sm text-primary-400 hover:underline">
          Open reports →
        </Link>
      </div>
    </div>
  );
}
