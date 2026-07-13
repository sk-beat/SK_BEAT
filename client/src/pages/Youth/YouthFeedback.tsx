import { MessageSquare } from "lucide-react";

const YouthFeedback = () => {
  return (
    <main className="max-w-md mx-auto p-4 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Feedback</h1>
        <p className="text-sm text-slate-500">
          Share your ideas with the SK Council.
        </p>
      </div>

      <div className="bg-white border rounded-xl p-4">
        <label className="text-sm font-medium">
          Your Suggestion
        </label>

        <textarea
          rows={6}
          placeholder="Type your feedback..."
          className="mt-2 w-full rounded-lg border p-3 resize-none outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg flex justify-center items-center gap-2">
          <MessageSquare size={18} />
          Submit Feedback
        </button>
      </div>
    </main>
  );
};

export default YouthFeedback;