"use client";
// app/booking/confirmation/[id]/page.tsx
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useUIStore } from "@/lib/store";

export default function ConfirmationPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();
  const { language } = useUIStore();

  useEffect(() => {
    fetch(`/api/bookings/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setBooking(data);
        setLoading(false);
      });
  }, [id]);

  if (loading)
    return (
      <div style={{ padding: 50, textAlign: "center" }}>
        {t("common.loading")}
      </div>
    );
  if (!booking)
    return (
      <div style={{ padding: 50, textAlign: "center" }}>
        {t("common.error")}
      </div>
    );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        className="cp-card animate-fadeIn"
        style={{
          maxWidth: 500,
          width: "100%",
          padding: 40,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 24 }}>✅</div>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>
          {t("booking.bookingConfirmed")}
        </h1>
        <p style={{ color: "var(--muted)", marginBottom: 32 }}>
          {t("booking.confirmedMessage")}
        </p>

        <div
          style={{
            background: "var(--bg)",
            borderRadius: 16,
            padding: 24,
            textAlign: "left",
            marginBottom: 32,
            border: "1px dashed var(--border)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "var(--muted)",
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            {t("booking.bookingRef")}
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "var(--accent)",
              marginBottom: 20,
            }}
          >
            {booking.bookingRef}
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                }}
              >
                {t("movie.title")}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {booking.show.movie.title}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                }}
              >
                {t("ticket.dateTime")}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {new Date(booking.show.startTime).toLocaleString()}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                }}
              >
                Theater
              </div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {booking.show.screen.theater.name}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                }}
              >
                Seats
              </div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {booking.bookingSeats
                  .map((bs: any) => `${bs.seat.row}${bs.seat.number}`)
                  .join(", ")}
              </div>
            </div>
          </div>
          
          {/* Cancellation Protect Option */}
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                {t("booking.cancellationProtect")}
              </span>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>
                +₹{Math.round(booking.finalAmount * 0.1)}
              </span>
            </div>
            <p style={{ color: "var(--muted)", fontSize: 12, marginBottom: 16 }}>
              {t("booking.cancellationProtectDescription")}
            </p>
            <div className="cp-input" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                id="cancellationProtect"
                defaultChecked={false}
              />
              <label htmlFor="cancellationProtect" style={{ fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
                {t("booking.enableCancellationProtect")}
              </label>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/" className="btn btn-ghost btn-full">
            Back to Home
          </Link>
          <button
            onClick={() => window.print()}
            className="btn btn-primary btn-full"
          >
            Print Ticket
          </button>
        </div>
      </div>
    </div>
  );
}
