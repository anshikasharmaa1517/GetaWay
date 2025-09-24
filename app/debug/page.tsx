/**
 * Debug page to check environment variables
 * Remove this file after deployment is working
 */

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Environment Debug</h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-lg mb-3">
              Environment Variables Status
            </h2>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>NEXT_PUBLIC_SUPABASE_URL:</span>
                <span
                  className={
                    process.env.NEXT_PUBLIC_SUPABASE_URL
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {process.env.NEXT_PUBLIC_SUPABASE_URL
                    ? "✅ Set"
                    : "❌ Missing"}
                </span>
              </div>

              <div className="flex justify-between">
                <span>NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
                <span
                  className={
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                    ? "✅ Set"
                    : "❌ Missing"}
                </span>
              </div>

              <div className="flex justify-between">
                <span>NODE_ENV:</span>
                <span className="text-blue-600">{process.env.NODE_ENV}</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Supabase URL Check</h3>
            <p className="text-sm text-gray-600 break-all">
              {process.env.NEXT_PUBLIC_SUPABASE_URL || "Not set"}
            </p>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Instructions</h3>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>
                Go to Vercel Dashboard → Your Project → Settings → Environment
                Variables
              </li>
              <li>
                Add NEXT_PUBLIC_SUPABASE_URL with your Supabase project URL
              </li>
              <li>
                Add NEXT_PUBLIC_SUPABASE_ANON_KEY with your Supabase anon key
              </li>
              <li>Add SUPABASE_SERVICE_ROLE_KEY with your service role key</li>
              <li>Redeploy your application</li>
            </ol>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Important:</strong> Delete this debug page after fixing
              the environment variables for security.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
