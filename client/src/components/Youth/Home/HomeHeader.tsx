import YouthHeader from "../shared/YouthHeader";

export default function HomeHeader({ fullname }: { fullname: string }) {
  return (
    <YouthHeader
      subtitle={`Welcome back, ${fullname}. Here are your latest youth programs.`}
      title="SK Beat"
    />
  );
}
