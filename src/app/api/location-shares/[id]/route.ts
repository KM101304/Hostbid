import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getLocationShare, saveLocationShare } from "@/lib/location-shares";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const share = await getLocationShare(id);

    if (!share || share.userId !== user.id) {
      throw new Error("Location share not found.");
    }

    await saveLocationShare({ ...share, isActive: false });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to stop location sharing." },
      { status: 400 },
    );
  }
}
