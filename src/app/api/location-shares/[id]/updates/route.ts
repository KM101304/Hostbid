import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getLocationShare, isLocationShareVisible, saveLocationShare } from "@/lib/location-shares";
import { locationUpdateSchema } from "@/lib/validators";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const parsed = locationUpdateSchema.parse(await request.json());
    const share = await getLocationShare(id);

    if (!share || share.userId !== user.id || !isLocationShareVisible(share)) {
      throw new Error("Location share is not active.");
    }

    await saveLocationShare({
      ...share,
      lastLatitude: parsed.latitude,
      lastLongitude: parsed.longitude,
      lastAccuracyMeters: parsed.accuracyMeters ?? null,
      lastSeenAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update location." },
      { status: 400 },
    );
  }
}
