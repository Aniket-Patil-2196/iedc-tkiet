import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import AboutContentModel from "@/models/AboutContent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_ABOUT = {
  whoWeAre:
    "The Innovation and Entrepreneurship Development Cell (IEDC) at Tatyasaheb Kore Institute of Engineering and Technology (TKIET), Warananagar, is an institutional catalyst dedicated to nurturing student innovators, engineering thinkers, and venture creators. We provide an ecosystem bridging academic engineering theory with real-world entrepreneurial execution.",
  vision:
    "To be a premier hub of student innovation and technological entrepreneurship in Maharashtra, producing visionary engineering founders who build sustainable, socially transformative enterprises.",
  mission:
    "To cultivate an entrepreneurial mindset across all engineering disciplines through experiential bootcamps, structured mentorship, laboratory prototyping resources, patent guidance, and pre-incubation grants.",
};

export async function GET() {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({
        success: true,
        data: DEFAULT_ABOUT,
        source: "default",
      });
    }

    let aboutDoc = await AboutContentModel.findOne();
    if (!aboutDoc) {
      aboutDoc = await AboutContentModel.create(DEFAULT_ABOUT);
    }

    return NextResponse.json({ success: true, data: aboutDoc });
  } catch (error) {
    console.error("[ADMIN GET ABOUT ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch about content." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: "Database not connected." },
        { status: 503 }
      );
    }

    if (!body.whoWeAre || !body.vision || !body.mission) {
      return NextResponse.json(
        { success: false, error: "Who We Are, Vision, and Mission are required." },
        { status: 400 }
      );
    }

    let aboutDoc = await AboutContentModel.findOne();
    if (aboutDoc) {
      aboutDoc.whoWeAre = body.whoWeAre;
      aboutDoc.vision = body.vision;
      aboutDoc.mission = body.mission;
      await aboutDoc.save();
    } else {
      aboutDoc = await AboutContentModel.create({
        whoWeAre: body.whoWeAre,
        vision: body.vision,
        mission: body.mission,
      });
    }

    return NextResponse.json({ success: true, data: aboutDoc });
  } catch (error) {
    console.error("[ADMIN UPDATE ABOUT ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update about content." },
      { status: 500 }
    );
  }
}
