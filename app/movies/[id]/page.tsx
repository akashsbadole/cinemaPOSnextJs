"use client";
// app/movies/[id]/page.tsx
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useUIStore } from "@/lib/store";

export default function MovieDetailsPage() {
  const { id } = useParams();
  const [movie, setMovie] = useState<any>(null);
  const [shows, setShows] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { t } = useI18n();
  const { language, setLanguage } = useUIStore();

  useEffect(() => {
    Promise.all([
      fetch(`/api/movies/${id}`).then((r) => r.json()),
      fetch(`/api/shows?movieId=${id}`).then((r) => r.json()),
    ]).then(([movieData, showsData]) => {
      setMovie(movieData.movie);
      setShows(showsData);
      setReviews(movieData.movie?.movieReviews || []);
      setLoading(false);
    });
  }, [id]);

  if (loading)
    return (
      <div style={{ padding: 50, textAlign: "center" }}>
        {t("common.loading")}
      </div>
    );
  if (!movie)
    return (
      <div style={{ padding: 50, textAlign: "center" }}>
        {t("common.error")}
      </div>
    );

  async function handleSubmitReview() {
    if (!reviewData.rating) {
      alert(t("movie.ratingRequired"));
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/movies/${id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewData),
      });
      const data = await res.json();

      if (res.ok) {
        setReviews([data.review, ...reviews]);
        setShowReviewForm(false);
        setReviewData({ rating: 5, comment: '' });
        alert(t("movie.reviewSubmitted"));
      } else {
        alert(data.error || t("movie.reviewError"));
      }
    } catch (err) {
      alert(t("movie.reviewError"));
    } finally {
      setSubmittingReview(false);
    }
  }

  return (
    <>
      {/* Back Link */}
      <div style={{ padding: "20px 5%" }}>
        <Link
          href="/movies"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 18,
            fontWeight: 700,
            color: "var(--accent)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          ← Back to Movies
        </Link>
      </div>
      <div style={{ height: 400, position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `url(${movie.posterUrl}) center/cover no-repeat`,
            filter: "blur(40px) brightness(0.3)",
            transform: "scale(1.1)",
          }}
        />
        <div
          style={{
            position: "relative",
            height: "100%",
            display: "flex",
            alignItems: "flex-end",
            padding: "0 5% 40px",
            gap: 40,
          }}
        >
          <div
            style={{
              width: 200,
              aspectRatio: "2/3",
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              background: "var(--surface)",
              flexShrink: 0,
            }}
          >
            <img
              src={movie.posterUrl}
              alt={movie.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <div style={{ paddingBottom: 10 }}>
            <h1 style={{ fontSize: 40, fontWeight: 900, marginBottom: 12 }}>
              {movie.title}
            </h1>
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <span
                style={{
                  background: "var(--accent)",
                  color: "#000",
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {movie.rating}
              </span>
              <span style={{ color: "var(--muted)", fontSize: 14 }}>
                {movie.duration} min • {movie.format} • {movie.language}
              </span>
            </div>
            <p
              style={{
                maxWidth: 700,
                color: "rgba(255,255,255,0.8)",
                fontSize: 15,
                lineHeight: 1.6,
              }}
            >
              {movie.description}
            </p>
          </div>
        </div>
      </div>

      {/* Trailer Section */}
      {movie?.trailerUrl && (
        <div style={{ padding: "40px 5%", background: "var(--surface)" }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24, textAlign: "center" }}>
            {t("movie.trailer")}
          </h2>
          <div style={{ maxWidth: 800, margin: "0 auto", borderRadius: 12, overflow: "hidden" }}>
            <iframe
              width="100%"
              height="450"
              src={movie.trailerUrl.replace('watch?v=', 'embed/')}
              title={`${movie.title} Trailer`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ display: "block" }}
            />
          </div>
        </div>
      )}

      <div
        style={{
          padding: "60px 5%",
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          gap: 60,
        }}
      >
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 32 }}>
                {t("booking.selectShow")}
              </h2>

              {!Array.isArray(shows) || shows.length === 0 ? (
                <div
                  style={{
                    padding: 40,
                    background: "var(--surface)",
                    borderRadius: 12,
                    textAlign: "center",
                    color: "var(--muted)",
                  }}
                >
                  {t("common.noData")}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                  {/* Group by theater/screen in real app, here simple list */}
                  {shows.map((show: any) => (
                    <div
                      key={show.id}
                      className="cp-card"
                      style={{
                        padding: 24,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div
                          style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}
                        >
                          {show.screen.theater.name}
                        </div>
                        <div style={{ color: "var(--muted)", fontSize: 13 }}>
                          {show.screen.name} •{" "}
                          {new Date(show.startTime).toLocaleDateString(undefined, {
                            weekday: "long",
                            day: "numeric",
                            month: "short",
                          })}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 12 }}>
                        <button
                          className="btn btn-primary"
                          onClick={() => router.push(`/booking/${show.id}`)}
                        >
                          {new Date(show.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              {movie.trailerUrl && (
                <div
                  className="cp-card"
                  style={{ padding: 24, marginBottom: 24 }}
                >
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
                    Trailer
                  </h3>
                  <div
                    style={{
                      position: "relative",
                      paddingBottom: "56.25%",
                      height: 0,
                      borderRadius: 8,
                      overflow: "hidden",
                    }}
                  >
                    <iframe
                      src={movie.trailerUrl.replace("watch?v=", "embed/")}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        border: "none",
                      }}
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              <div
                className="cp-card"
                style={{ padding: 24, position: "sticky", top: 100 }}
              >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              Movie Info
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  Genre
                </div>
                <div style={{ fontSize: 14 }}>{movie.genre}</div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  Release Date
                </div>
                <div style={{ fontSize: 14 }}>
                  {new Date(movie.releaseDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div style={{ padding: "60px 5%", background: "var(--bg)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>
            {t("movie.reviews")} {reviews.length > 0 && `(${reviews.length})`}
          </h2>
          <button
            className="btn btn-primary"
            onClick={() => setShowReviewForm(!showReviewForm)}
          >
            {showReviewForm ? t("common.cancel") : t("movie.writeReview")}
          </button>
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <div className="cp-card" style={{ padding: 24, marginBottom: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              {t("movie.writeReview")}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
                  {t("movie.rating")}
                </label>
                <div style={{ display: "flex", gap: 4 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewData({ ...reviewData, rating: star })}
                      style={{
                        fontSize: 24,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: star <= reviewData.rating ? "#E8A020" : "var(--muted)",
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
                  {t("movie.comment")} ({t("common.optional")})
                </label>
                <textarea
                  className="cp-input"
                  rows={4}
                  placeholder={t("movie.commentPlaceholder")}
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  className="btn btn-primary"
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                >
                  {submittingReview ? t("common.submitting") : t("movie.submitReview")}
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => setShowReviewForm(false)}
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div
            style={{
              padding: 40,
              background: "var(--surface)",
              borderRadius: 12,
              textAlign: "center",
              color: "var(--muted)",
            }}
          >
            {t("movie.noReviews")}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {reviews.map((review: any) => (
              <div
                key={review.id}
                className="cp-card"
                style={{ padding: 24 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontWeight: 600 }}>{review.customer?.name || 'Anonymous'}</span>
                  <span style={{ color: "#E8A020", fontSize: 16 }}>
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </span>
                </div>
                {review.comment && (
                  <p style={{ color: "var(--muted)", lineHeight: 1.5 }}>{review.comment}</p>
                )}
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}