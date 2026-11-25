import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Person } from '@/types/family';

const dataFilePath = path.join(process.cwd(), 'data', 'family.json');

function getMembers(): Person[] {
  try {
    if (!fs.existsSync(dataFilePath)) {
      return [];
    }
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading family data:', err);
    return [];
  }
}

function saveMembers(members: Person[]) {
  const dir = path.dirname(dataFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(dataFilePath, JSON.stringify(members, null, 2), 'utf8');
}

export async function GET() {
  const members = getMembers();
  return NextResponse.json({ success: true, data: members });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const members = getMembers();

    const newMember: Person = {
      id: Date.now().toString(),
      fullName: body.fullName || 'Tanpa Nama',
      callName: body.callName || '',
      gender: body.gender || 'male',
      birthYear: Number(body.birthYear) || new Date().getFullYear(),
      deathYear: body.deathYear ? Number(body.deathYear) : null,
      photo: body.photo || `https://api.dicebear.com/7.x/bottts/svg?seed=${Date.now()}`,
      occupation: body.occupation || '',
      address: body.address || 'Desa Lungkap',
      bio: body.bio || '',
      phone: body.phone || '',
      generation: Number(body.generation) || 3,
      parents: Array.isArray(body.parents) ? body.parents : [],
      spouseId: body.spouseId || null,
      children: Array.isArray(body.children) ? body.children : [],
    };

    // Update parent's children array
    if (newMember.parents && newMember.parents.length > 0) {
      newMember.parents.forEach((parentId: string) => {
        const parent = members.find((m) => m.id === parentId);
        if (parent && !parent.children.includes(newMember.id)) {
          parent.children.push(newMember.id);
        }
      });
    }

    // Update spouse's spouseId
    if (newMember.spouseId) {
      const spouse = members.find((m) => m.id === newMember.spouseId);
      if (spouse) {
        spouse.spouseId = newMember.id;
      }
    }

    members.push(newMember);
    saveMembers(members);

    return NextResponse.json({ success: true, data: newMember });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
    }

    let members = getMembers();
    const index = members.findIndex((m) => m.id === body.id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
    }

    members[index] = {
      ...members[index],
      ...body,
      birthYear: Number(body.birthYear),
      deathYear: body.deathYear ? Number(body.deathYear) : null,
      generation: Number(body.generation),
    };

    saveMembers(members);
    return NextResponse.json({ success: true, data: members[index] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    let members = getMembers();
    members = members.filter((m) => m.id !== id);

    // Remove from parents/children/spouse
    members.forEach((m) => {
      m.children = m.children.filter((cid) => cid !== id);
      m.parents = m.parents.filter((pid) => pid !== id);
      if (m.spouseId === id) m.spouseId = null;
    });

    saveMembers(members);
    return NextResponse.json({ success: true, message: 'Member deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
