import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb/client";
import RegistrationModel from "@/models/Registration";
import EventModel from "@/models/Event";
import { ReceiptViewer } from "@/components/receipt/ReceiptViewer";
import { AlertCircle, Search, ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Official Event Registration Receipt | IEDC TKIET",
  description: "Download or print official registration receipt for IEDC TKIET events.",
  robots: {
    index: false,
    follow: false,
  },
};

interface ReceiptPageProps {
  params: {
    receiptToken: string;
  };
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { receiptToken } = params;

  if (!receiptToken || receiptToken.length < 16) {
    notFound();
  }

  await connectToDatabase();

  const registration = await RegistrationModel.findOne({ receiptToken }).lean();

  if (!registration) {
    return (
      <div className="flex flex-col flex-1 w-full bg-foundation-darkest min-h-[70vh] justify-center items-center">
        <Section spacing="lg">
          <Container size="md">
            <div className="p-8 rounded-2xl bg-foundation-dark border border-brand-blue/30 text-center space-y-6 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h1 className="font-display text-2xl font-bold text-typo-white">
                  Receipt Not Found
                </h1>
                <p className="text-sm font-sans text-typo-gray max-w-md mx-auto">
                  The requested receipt token does not exist or has expired. If you registered
                  for an event, you can look up your receipt using your registered email and phone number.
                </p>
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/receipt/find"
                  className="px-5 py-2.5 rounded-xl bg-brand-blue text-typo-white font-medium text-xs hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Find My Receipt</span>
                </Link>
                <Link
                  href="/events"
                  className="px-5 py-2.5 rounded-xl bg-foundation-slate/60 text-typo-white font-medium text-xs hover:bg-foundation-slate transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Browse All Events</span>
                </Link>
              </div>
            </div>
          </Container>
        </Section>
      </div>
    );
  }

  // Fetch Event Details
  const event = await EventModel.findById(registration.eventId).lean();

  const eventData = {
    id: event ? (event as any)._id?.toString() : registration.eventId.toString(),
    slug: event ? event.slug : "event",
    title: event ? event.title : "IEDC TKIET Scheduled Event",
    startDate: event ? event.startDate || (event as any).date || "" : "",
    venue: event ? event.venue : "TKIET Campus, Warananagar",
    fee: event ? event.fee : 0,
  };

  const regData = {
    id: (registration as any)._id?.toString(),
    receiptToken: registration.receiptToken,
    receiptNumber: registration.receiptNumber,
    status: registration.status,
    name: registration.name,
    email: registration.email,
    phone: registration.phone,
    college: registration.college,
    year: registration.year,
    amount: registration.amount,
    paymentMethod: registration.paymentMethod,
    razorpayPaymentId: registration.razorpayPaymentId,
    razorpayOrderId: registration.razorpayOrderId,
    paidAt: registration.paidAt ? new Date(registration.paidAt).toISOString() : undefined,
    refundId: registration.refundId,
    refundedAt: registration.refundedAt ? new Date(registration.refundedAt).toISOString() : undefined,
    createdAt: registration.createdAt ? new Date(registration.createdAt).toISOString() : new Date().toISOString(),
  };

  return (
    <div className="flex flex-col flex-1 w-full bg-foundation-darkest min-h-screen">
      <Section spacing="md">
        <Container size="lg">
          <ReceiptViewer registration={regData} event={eventData} />
        </Container>
      </Section>
    </div>
  );
}
