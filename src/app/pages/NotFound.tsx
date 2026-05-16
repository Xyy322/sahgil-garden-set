// The NotFound page displays a 404 error for invalid routes.
// It affects the system by providing a user-friendly fallback for navigation errors and guiding users back to the home page.
// react-router-dom not in deps, using plain <a> link.

export function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#f9f7f4] px-4 text-center">
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 px-8 py-12 md:px-16 md:py-20 flex flex-col items-center max-w-lg w-full">
        <h1 className="text-7xl md:text-9xl font-bold text-stone-200 mb-2 md:mb-4">404</h1>
        <h2 className="text-2xl md:text-3xl font-bold text-stone-800 mb-4 md:mb-6">Page Not Found</h2>
        <p className="text-base md:text-lg text-stone-600 max-w-md mx-auto mb-8 md:mb-10">
          It looks like you've wandered off the garden path. The page you're looking for doesn't exist or has been moved.
        </p>
        <a
          href="/"
          className="px-6 md:px-8 py-3 md:py-4 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
}

