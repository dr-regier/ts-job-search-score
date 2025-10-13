import { ProfileForm } from "@/components/profile/ProfileForm";
import { Header } from "@/components/layout/Header";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex-1">
        <div className="max-w-3xl mx-auto p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Profile Setup</h2>
            <p className="text-muted-foreground">
              Create or update your professional profile to help the AI agent
              find and score jobs that match your preferences.
            </p>
          </div>

          <ProfileForm />
        </div>
      </div>
    </div>
  );
}
