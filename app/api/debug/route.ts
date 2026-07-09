import { NextResponse } from 'next/server';
import { listServices, searchAvailability, listTeamMembers } from '@/app/actions';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const action = url.searchParams.get('action');

        if (action === 'team') { const team = await listTeamMembers(); return NextResponse.json({ team }); }

        if (action === 'services') {
            const team = await listTeamMembers();
            const harry = team.find((t: any) => t.name.toLowerCase().includes('harry')) || team[0];
            const services = await listServices(harry.id);
            return NextResponse.json({ services });
        }

        if (action === 'availability') {
            const sid = url.searchParams.get('sid');
            const tid = url.searchParams.get('tid');
            const startAt = new Date().toISOString();
            const endAt = new Date(Date.now() + 86400000).toISOString();
            
            if (sid && tid) {
                const avail = await searchAvailability(startAt, endAt, sid.split(','), tid);
                return NextResponse.json({ avail });
            }
            return NextResponse.json({ error: 'Missing sid or tid' });
        }

        return NextResponse.json({ error: 'Invalid action' });
    } catch (e: any) {
        return NextResponse.json({ error: e.message, stack: e.stack, errors: e.errors });
    }
}