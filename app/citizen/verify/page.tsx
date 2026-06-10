import { CitizenVerifyWorkspace } from "@/components/citizen-verify-workspace";
import { getCurrentCitizen } from "@/lib/auth";
import { listCitizenVerificationQueue } from "@/lib/data-store";

export default async function CitizenVerifyPage() {
  const citizen = await getCurrentCitizen();
  const initialReports = citizen ? await listCitizenVerificationQueue(citizen.id, { limit: 6 }) : [];

  return (
    <CitizenVerifyWorkspace
      initialReports={initialReports}
      citizenName={citizen?.fullName ?? "Гражданин"}
      isDemoCitizen={Boolean(citizen?.isDemo)}
    />
  );
}
