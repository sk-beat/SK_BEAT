import { useEffect, useState } from "react";
import { useAuth } from "../../../auth/useAuth";
import HomeSections from "./HomeSections";
import { getYouthHomeData, type YouthHomeData } from "./YouthHomeService";

export default function Home() {
  const { user } = useAuth();
  const [homeData, setHomeData] = useState<YouthHomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadHome() {
      if (!user?.id) return;
      setIsLoading(true);
      setErrorMessage(null);
      const { data, error } = await getYouthHomeData();
      if (!isMounted) return;
      if (error) setErrorMessage(error.message);
      setHomeData(data);
      setIsLoading(false);
    }

    loadHome();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      <HomeSections
        data={homeData}
        errorMessage={errorMessage}
        fullname={user?.fullname ?? "Kabataan"}
        isLoading={isLoading}
      />
    </div>
  );
}
