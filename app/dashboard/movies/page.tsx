"use client";
// app/dashboard/movies/page.tsx
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useI18n } from "@/lib/i18n";
import { useUIStore } from "@/lib/store";

interface Movie {
  id: string;
  title: string;
  duration: number;
  genre: string;
  language: string;
  format: string;
  rating: string;
  active: boolean;
  releaseDate: string;
  description: string;
  trailerUrl: string;
  posterUrl: string;
}

const EMPTY: Partial<Movie> = {
  title: "",
  duration: 120,
  genre: "",
  language: "Hindi",
  format: "2D",
  rating: "UA",
  description: "",
  trailerUrl: "",
  posterUrl: "",
};

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<Partial<Movie>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const { t } = useI18n();
  const { language, setLanguage } = useUIStore();

  const load = () => {
    setLoading(true);
    fetch(`/api/movies${search ? `?search=${encodeURIComponent(search)}` : ""}`)
      .then((r) => r.json())
      .then((d) => {
        setMovies(d.movies || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, [search]);

  const openAdd = () => {
    setForm(EMPTY);
    setError("");
    setModal("add");
  };
  const openEdit = (m: Movie) => {
    setForm({
      ...m,
      releaseDate: m.releaseDate ? m.releaseDate.slice(0, 10) : "",
    });
    setError("");
    setModal("edit");
  };

  const save = async () => {
    if (!form.title?.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError("");
    const method = modal === "edit" ? "PUT" : "POST";
    const url = modal === "edit" ? `/api/movies/${form.id}` : "/api/movies";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setModal(null);
    showToast(modal === "edit" ? "Movie updated" : "Movie added");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Deactivate this movie?")) return;
    await fetch(`/api/movies/${id}`, { method: "DELETE" });
    showToast("Movie deactivated");
    load();
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const formatMap: Record<string, string> = {
    "2D": "var(--blue)",
    "3D": "var(--green)",
    IMAX: "var(--accent)",
    "4DX": "var(--purple)",
  };

  return (
    <div
      className="animate-fadeIn"
      style={{ display: "flex", flexDirection: "column", gap: 20 }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            Movies
          </div>
          <div style={{ color: "var(--muted)", marginTop: 2 }}>
            Manage your movie catalog
          </div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          + Add Movie
        </button>
      </div>

      {/* Search */}
      <div className="cp-card" style={{ padding: 16 }}>
        <input
          className="cp-input"
          placeholder="🔍  Search movies by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 360 }}
        />
      </div>

      {/* Table */}
      <div className="cp-card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div
            style={{ display: "flex", justifyContent: "center", padding: 60 }}
          >
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="cp-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Duration</th>
                  <th className="hide-mobile">Genre</th>
                  <th className="hide-mobile">Language</th>
                  <th>Format</th>
                  <th className="hide-mobile">Rating</th>
                  <th className="hide-mobile">Release</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {movies.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      style={{
                        textAlign: "center",
                        padding: 40,
                        color: "var(--muted)",
                      }}
                    >
                      No movies found
                    </td>
                  </tr>
                ) : (
                  movies.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{m.title}</div>
                        {m.description && (
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--muted)",
                              maxWidth: 200,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {m.description}
                          </div>
                        )}
                      </td>
                      <td
                        style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
                      >
                        {m.duration}m
                      </td>
                      <td
                        className="hide-mobile"
                        style={{ color: "var(--muted)", fontSize: 12 }}
                      >
                        {m.genre || "—"}
                      </td>
                      <td className="hide-mobile" style={{ fontSize: 12 }}>
                        {m.language}
                      </td>
                      <td>
                        <span
                          style={{
                            background: `${formatMap[m.format] || "var(--muted)"}20`,
                            color: formatMap[m.format] || "var(--muted)",
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontSize: 11,
                            fontFamily: "var(--font-mono)",
                            fontWeight: 700,
                          }}
                        >
                          {m.format}
                        </span>
                      </td>
                      <td className="hide-mobile">
                        <span
                          style={{
                            background: "var(--subtle)",
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontSize: 11,
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {m.rating}
                        </span>
                      </td>
                      <td
                        className="hide-mobile"
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          color: "var(--muted)",
                        }}
                      >
                        {m.releaseDate
                          ? format(new Date(m.releaseDate), "dd MMM yyyy")
                          : "—"}
                      </td>
                      <td>
                        <span
                          className={`badge ${m.active ? "badge-confirmed" : "badge-cancelled"}`}
                        >
                          {m.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => openEdit(m)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => remove(m.id)}
                          >
                            ×
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                fontWeight: 700,
                marginBottom: 20,
              }}
            >
              {modal === "add" ? "Add New Movie" : "Edit Movie"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    fontFamily: "var(--font-mono)",
                    marginBottom: 6,
                  }}
                >
                  Title *
                </label>
                <input
                  className="cp-input"
                  value={form.title || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="Movie title"
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    fontFamily: "var(--font-mono)",
                    marginBottom: 6,
                  }}
                >
                  Description
                </label>
                <textarea
                  className="cp-input"
                  rows={2}
                  value={form.description || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Short synopsis"
                  style={{ resize: "vertical" }}
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      fontFamily: "var(--font-mono)",
                      marginBottom: 6,
                    }}
                  >
                    Duration (mins) *
                  </label>
                  <input
                    className="cp-input"
                    type="number"
                    min={1}
                    value={form.duration || ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        duration: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      fontFamily: "var(--font-mono)",
                      marginBottom: 6,
                    }}
                  >
                    Genre
                  </label>
                  <input
                    className="cp-input"
                    value={form.genre || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, genre: e.target.value }))
                    }
                    placeholder="Action, Drama..."
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      fontFamily: "var(--font-mono)",
                      marginBottom: 6,
                    }}
                  >
                    Language
                  </label>
                  <select
                    className="cp-input"
                    value={form.language}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, language: e.target.value }))
                    }
                  >
                    {[
                      "Hindi",
                      "English",
                      "Tamil",
                      "Telugu",
                      "Kannada",
                      "Malayalam",
                      "Marathi",
                      "Bengali",
                    ].map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      fontFamily: "var(--font-mono)",
                      marginBottom: 6,
                    }}
                  >
                    Format
                  </label>
                  <select
                    className="cp-input"
                    value={form.format}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, format: e.target.value }))
                    }
                  >
                    {["2D", "3D", "IMAX", "4DX", "IMAX 3D"].map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      fontFamily: "var(--font-mono)",
                      marginBottom: 6,
                    }}
                  >
                    Rating
                  </label>
                  <select
                    className="cp-input"
                    value={form.rating}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, rating: e.target.value }))
                    }
                  >
                    {["U", "UA", "A", "S"].map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      fontFamily: "var(--font-mono)",
                      marginBottom: 6,
                    }}
                  >
                    Release Date
                  </label>
                  <input
                    className="cp-input"
                    type="date"
                    value={(form.releaseDate || "").toString().slice(0, 10)}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, releaseDate: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      fontFamily: "var(--font-mono)",
                      marginBottom: 6,
                    }}
                  >
                    Trailer URL (YouTube)
                  </label>
                  <input
                    className="cp-input"
                    value={form.trailerUrl || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, trailerUrl: e.target.value }))
                    }
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      fontFamily: "var(--font-mono)",
                      marginBottom: 6,
                    }}
                  >
                    Poster Image URL
                  </label>
                  <input
                    className="cp-input"
                    value={form.posterUrl || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, posterUrl: e.target.value }))
                    }
                    placeholder="https://example.com/poster.jpg"
                  />
                </div>
              </div>
              {error && (
                <div
                  style={{
                    background: "rgba(232,64,64,0.1)",
                    border: "1px solid rgba(232,64,64,0.3)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    color: "var(--red)",
                    fontSize: 13,
                  }}
                >
                  {error}
                </div>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={save}
                  disabled={saving}
                >
                  {saving ? (
                    <span className="spinner" />
                  ) : modal === "add" ? (
                    "Add Movie"
                  ) : (
                    "Save Changes"
                  )}
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className="animate-slideIn"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: "var(--card)",
            border: "1px solid var(--green)",
            borderRadius: 10,
            padding: "12px 18px",
            fontSize: 13,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 8,
            zIndex: 200,
          }}
        >
          ✅ {toast}
        </div>
      )}
    </div>
  );
}
