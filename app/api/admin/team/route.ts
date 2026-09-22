import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import TeamMemberModel from "@/models/TeamMember";
import { validateTeamMember } from "@/lib/utils/team-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({
        success: true,
        data: [],
        source: "no-connection",
      });
    }

    const members = await TeamMemberModel.find().sort({ order: 1, createdAt: 1 });
    return NextResponse.json({
      success: true,
      data: members,
      source: "database",
    });
  } catch (error) {
    console.error("[ADMIN GET TEAM ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch team members." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected." },
        { status: 503 }
      );
    }

    if (!body.name || !body.role || !body.category) {
      return NextResponse.json(
        { success: false, error: "Name, position/role, and team type are required." },
        { status: 400 }
      );
    }

    const validationError = validateTeamMember(body);
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 }
      );
    }

    const member = await TeamMemberModel.create({
      ...body,
      linkedinUrl: body.linkedinUrl?.trim() || undefined,
      email: body.email?.trim() || undefined,
      order: Number(body.order) || 0,
    });

    return NextResponse.json({ success: true, data: member });
  } catch (error) {
    console.error("[ADMIN CREATE TEAM ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create team member." },
      { status: 500 }
    );
  }
}
