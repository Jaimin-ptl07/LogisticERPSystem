export default function ProtectedLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center space-y-6">
        {/* Animated logistics loader */}
        <div className="relative w-40 h-40">
          {/* Outer rotating ring */}
          <div className="absolute inset-0">
            <svg className="w-full h-full animate-spin" style={{ animationDuration: '3s' }} viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="4"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#2563eb"
                strokeWidth="4"
                strokeDasharray="70 200"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Inner rotating ring */}
          <div className="absolute inset-4">
            <svg className="w-full h-full animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#93c5fd"
                strokeWidth="3"
                strokeDasharray="50 150"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Center truck icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-blue-600 animate-pulse"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M18 18.5a1.5 1.5 0 0 1-1 1.415V21a1 1 0 1 1-2 0v-1.085a1.5 1.5 0 0 1 0-2.83V16a1 1 0 1 1 2 0v1.085A1.5 1.5 0 0 1 18 18.5zM8 18.5a1.5 1.5 0 0 1-1 1.415V21a1 1 0 1 1-2 0v-1.085a1.5 1.5 0 0 1 0-2.83V16a1 1 0 0 1 2 0v1.085A1.5 1.5 0 0 1 8 18.5zM19 7h-2V6a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v10h2.535a3.5 3.5 0 0 1 6.93 0h3.07a3.5 3.5 0 0 1 6.93 0H23v-5a4 4 0 0 0-4-4zm-2 2h2a2 2 0 0 1 2 2v2h-4V9z" />
            </svg>
          </div>
        </div>

        {/* Loading text with animation */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">
            Loading Dashboard
          </h2>
          <div className="flex items-center justify-center space-x-1">
            <span className="text-sm text-gray-500">Preparing your workspace</span>
            <span className="flex space-x-1">
              <span className="animate-pulse" style={{ animationDelay: '0ms' }}>.</span>
              <span className="animate-pulse" style={{ animationDelay: '200ms' }}>.</span>
              <span className="animate-pulse" style={{ animationDelay: '400ms' }}>.</span>
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-64 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400 animate-progress"></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-progress {
          animation: progress 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

