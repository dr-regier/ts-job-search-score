export function HeroSection() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 p-12 md:p-16 shadow-2xl bg-[length:200%_auto] animate-[gradient-x_3s_ease_infinite]">
      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center text-white">
        <div className="mb-6 text-7xl animate-bounce-slow">🚀</div>
        <h1 className="text-5xl font-bold mb-4 tracking-tight">
          Your Job Search Dashboard
        </h1>
        <p className="text-xl opacity-90 max-w-2xl mx-auto leading-relaxed">
          Track your saved jobs, analyze fit scores, and manage your
          applications all in one place
        </p>
      </div>
    </div>
  );
}
