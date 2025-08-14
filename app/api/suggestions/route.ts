import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");
  const viewerId = searchParams.get("viewerId");
    const client = await clientPromise;
    const db = client.db("cafeteria");
    const col = db.collection("suggestions");
    const q: any = {};
    if (category) q.category = category;
    if (status) q.status = status;
    if (priority) q.priority = priority;
    if (search) {
      q.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }
    const docs = await col.find(q).sort({ submittedAt: -1 }).toArray();
    const mapped = docs.map((d: any) => ({
      ...d,
      userHasVoted: viewerId ? (d.voterIds || []).includes(viewerId) : false,
      isRead: d.isRead || false,
      readAt: d.readAt || null,
    }));
    return NextResponse.json({ suggestions: mapped });
  } catch (e) {
    console.error("GET /api/suggestions", e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, category, priority, submittedByUserId, submittedByName, tags = [] } = body;
    if (!title || !description) {
      return NextResponse.json({ error: "Başlık ve açıklama zorunlu" }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db("cafeteria");
    const col = db.collection("suggestions");
    const doc = {
      title,
      description,
      category: category || "other",
      priority: priority || "medium",
      status: "pending",
      submittedByUserId: submittedByUserId || null,
      submittedByName: submittedByName || "Anonim",
      submittedAt: new Date(),
      assignedTo: null,
      response: null,
      respondedAt: null,
      respondedBy: null,
      votesCount: 0,
      voterIds: [],
      tags,
    };
    const result = await col.insertOne(doc);
    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (e) {
    console.error("POST /api/suggestions", e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
