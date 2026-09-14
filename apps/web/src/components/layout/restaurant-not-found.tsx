import React from 'react';
import Link from 'next/link';

interface RestaurantNotFoundProps {
  slug?: string | null;
  message?: string;
}

export function RestaurantNotFound({ slug, message }: RestaurantNotFoundProps) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Restaurant Not Available
        </h2>
        <p className="text-gray-600 text-sm mb-6">
          {message ||
            (slug
              ? `We couldn't find an active restaurant at "${slug}". It might be temporarily closed or not accepting orders.`
              : 'The requested restaurant storefront could not be resolved.')}
        </p>
        <div className="space-y-3">
          <Link
            href="/"
            className="inline-block w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl transition text-sm text-center"
          >
            Browse All Restaurants
          </Link>
        </div>
      </div>
    </div>
  );
}
