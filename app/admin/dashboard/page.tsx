import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { logout } from "@/app/auth/actions";

export default async function AdminDashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Role check
    if (user.user_metadata?.role !== 'admin') {
         redirect('/dashboard');
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-8">
            <header className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
                <h1 className="text-3xl font-bold text-[--gold]">Admin Dashboard</h1>
                <form action={logout}>
                    <button className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded transition-colors">
                        Logout
                    </button>
                </form>
            </header>

            <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
                <h2 className="text-xl font-semibold mb-4">Admin Panel</h2>
                <p className="text-zinc-400">Welcome to the administration area.</p>
                <div className="mt-4 p-4 bg-zinc-950 rounded border border-zinc-800 font-mono text-sm">
                    <p>Admin ID: {user.id}</p>
                </div>
            </div>
        </div>
    );
}
