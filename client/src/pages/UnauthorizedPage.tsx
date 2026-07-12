export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-900">
      <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold">Unauthorized</h1>
        <p className="mt-3 text-slate-600">
          Your account does not have access to this page.
        </p>
      </div>
    </main>
  );
}
