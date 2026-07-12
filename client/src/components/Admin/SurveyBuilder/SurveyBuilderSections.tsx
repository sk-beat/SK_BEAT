import { surveyCategories, surveyList } from "./surveyBuilderData";

export default function SurveyBuilderSections() {
  return (
    <div className="flex-1 p-8">
      <div className="flex flex-col gap-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800">
            Create Survey
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            This will be the active survey shown on the Kabataan survey page
          </p>

          <form className="mt-5 flex flex-col gap-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-800">
                Survey title
              </span>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1e3a5f]"
                placeholder="e.g. Youth Activity Preferences - Q2 2026"
                type="text"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-800">
                Checkbox question
              </span>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1e3a5f]"
                placeholder="e.g. What type of SK activities are you most interested in joining?"
                type="text"
              />
            </label>

            <div>
              <span className="mb-1.5 block text-sm font-medium text-slate-800">
                Categories and activities
              </span>
              <p className="mb-3 text-sm text-slate-500">
                Each category has default activities. You can add more
                activities before posting the survey.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {surveyCategories.map((category) => (
                  <article
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    key={category.label}
                  >
                    <h3 className="text-sm font-semibold text-slate-800">
                      {category.label}
                    </h3>
                    <div className="mt-3 flex flex-col gap-2">
                      {category.activities.map((activity) => (
                        <input
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
                          defaultValue={activity}
                          key={activity}
                          type="text"
                        />
                      ))}
                    </div>
                    <button
                      className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                      type="button"
                    >
                      Add activity
                    </button>
                  </article>
                ))}
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <button
                className="rounded-lg bg-[#1e3a5f] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#2a4a6f]"
                type="button"
              >
                Save as Active Survey
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800">
            Survey List
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            All created surveys and status
          </p>
          <div className="mt-4 overflow-hidden overflow-x-auto rounded-[14px] border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr>
                  {["#", "Title", "Question", "Status", "Date", "Action"].map(
                    (heading) => (
                      <th
                        className="bg-slate-50 px-5 py-4 text-center text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-slate-400"
                        key={heading}
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {surveyList.map((survey) => (
                  <tr className="hover:bg-slate-50" key={survey.id}>
                    <td className="border-t border-slate-200 px-5 py-4">
                      {survey.id}
                    </td>
                    <td className="border-t border-slate-200 px-5 py-4">
                      {survey.title}
                    </td>
                    <td className="border-t border-slate-200 px-5 py-4">
                      {survey.question}
                    </td>
                    <td className="border-t border-slate-200 px-5 py-4">
                      <span className="rounded-md bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700">
                        {survey.status}
                      </span>
                    </td>
                    <td className="border-t border-slate-200 px-5 py-4">
                      {survey.date}
                    </td>
                    <td className="border-t border-slate-200 px-5 py-4">
                      <button className="text-sm font-medium text-[#1e3a5f] hover:underline" type="button">
                        Set active
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
