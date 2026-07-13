import { ClipboardList, Clock } from "lucide-react";

const YouthSurveys = () => {
  return (
    <main className="max-w-md mx-auto p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Surveys</h1>
        <p className="text-sm text-slate-500">
          Participate in surveys from the SK Council.
        </p>
      </div>

      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <ClipboardList className="text-blue-600" />
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              Open
            </span>
          </div>

          <h2 className="mt-3 font-semibold">
            Youth Community Development Survey
          </h2>

          <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
            <Clock size={14} />
            Ends July 30, 2026
          </div>

          <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
            Answer Survey
          </button>
        </div>
      ))}
    </main>
  );
};

export default YouthSurveys;