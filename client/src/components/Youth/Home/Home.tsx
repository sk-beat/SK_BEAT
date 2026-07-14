import HomeHeader from "./HomeHeader";
import HomeSections from "./HomeSections";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      <HomeHeader />
      <HomeSections />
    </div>
  );
}
