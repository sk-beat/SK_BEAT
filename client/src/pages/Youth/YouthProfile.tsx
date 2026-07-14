import { User, Mail, Phone } from "lucide-react";
import { useAuth } from "../../auth/useAuth";

const YouthProfile = () => {
  const { logout } = useAuth();

  return (
    <main className="max-w-md mx-auto p-4 space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-bold mx-auto">
          M
        </div>

        <h1 className="mt-4 text-xl font-bold">Maria Santos</h1>
        <p className="text-sm text-slate-500">
          Registered Youth Member
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
        <div className="flex items-center gap-3">
          <User />
          <span>18 Years Old</span>
        </div>

        <div className="flex items-center gap-3">
          <Mail />
          <span>maria@email.com</span>
        </div>

        <div className="flex items-center gap-3">
          <Phone />
          <span>09123456789</span>
        </div>
      </div>

      <button className="w-full bg-red-500 text-white py-3 rounded-xl" onClick={logout}>
        Logout
      </button>
    </main>
  );
};

export default YouthProfile;