import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { parseUserFromHeaders } from "@/lib/auth-headers";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
  const ctx = parseUserFromHeaders(req.headers);
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId gerekli" }, { status: 400 });
  if (ctx.role && ctx.role !== 'member') {
      // İsterseniz admin/mutfak oy kullanmasın
      return NextResponse.json({ error: 'Bu işlem yalnızca üyeler için' }, { status: 403 });
    }
    const { id } = params;
    const client = await clientPromise;
    const db = client.db("cafeteria");
    const col = db.collection("suggestions");
    const suggestion = await col.findOne({ _id: new ObjectId(id) });
    if (!suggestion) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
    const hasVoted = suggestion.voterIds?.includes(userId);
    if (hasVoted) {
      // İkinci kez oy kullanmaya çalışırsa değişiklik yapma
      return NextResponse.json({ success: true, already: true });
    }
    await col.updateOne(
      { _id: new ObjectId(id) },
      { $addToSet: { voterIds: userId }, $inc: { votesCount: 1 } }
    );
    return NextResponse.json({ success: true, already: false });
  } catch (e) {
    console.error("POST /api/suggestions/:id/vote", e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
