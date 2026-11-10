"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { trpc } from "@/lib/trpc-client";
import { authClient } from "@/lib/auth-client";
import { statuses, type Book, type BookInput } from "@/lib/books";
const labels = {
  "to-read": "Want to read",
  reading: "Reading",
  finished: "Finished",
};
const blank: BookInput = { title: "", author: "", status: "to-read" };
export default function Bookshelf() {
  const {
    data: session,
    isPending,
    error: sessionError,
  } = authClient.useSession();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [books, setBooks] = useState<Book[]>([]);
  const [draft, setDraft] = useState<BookInput>(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const userId = session?.user.id;
  const loadBooks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await trpc.books.list.query();
      setBooks(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load books.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    setBooks([]);
    setError("");
    setNotice("");
    setDraft(blank);
    setEditing(null);
    if (userId) void loadBooks();
  }, [userId, loadBooks]);
  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const credentials = {
      email: String(form.get("email")),
      password: String(form.get("password")),
    };
    try {
      const result =
        mode === "sign-up"
          ? await authClient.signUp.email({
              ...credentials,
              name: String(form.get("name")).trim(),
            })
          : await authClient.signIn.email(credentials);
      if (result.error)
        throw new Error(result.error.message || "Authentication failed.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to connect.");
    } finally {
      setBusy(false);
    }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const saved = editing
        ? await trpc.books.update.mutate({ ...draft, id: editing })
        : await trpc.books.create.mutate(draft);
      setBooks((current) =>
        editing
          ? current.map((b) => (b.id === editing ? saved : b))
          : [saved, ...current],
      );
      setNotice(editing ? "Book updated." : "Book added to your shelf.");
      setDraft(blank);
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  }
  async function remove(book: Book) {
    if (!window.confirm(`Delete “${book.title}” from your shelf?`)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await trpc.books.delete.mutate({ id: book.id });
      setBooks((current) => current.filter((b) => b.id !== book.id));
      if (editing === book.id) {
        setEditing(null);
        setDraft(blank);
      }
      setNotice("Book deleted.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to delete.");
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    setBusy(true);
    setError("");
    try {
      const result = await authClient.signOut();
      if (result.error)
        throw new Error(result.error.message || "Sign-out failed.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign out.");
    } finally {
      setBusy(false);
    }
  }
  const filtered = books.filter(
    (b) =>
      (filter === "all" || b.status === filter) &&
      `${b.title} ${b.author}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="shell">
      <header>
        <a className="brand" href="/" aria-label="Bookshelf home">
          <span className="brand-icon">B</span>bookshelf
          <span className="brand-dot">.</span>
        </a>
        <span className="header-note">
          A little space for your next chapter
        </span>
        {session && (
          <button className="quiet" disabled={busy} onClick={signOut}>
            Sign out
          </button>
        )}
      </header>
      {isPending ? (
        <main>
          <p role="status">Opening your reading space…</p>
        </main>
      ) : sessionError ? (
        <main>
          <p role="alert">
            Unable to check your session. Make sure the database and app are
            running.
          </p>
          <button onClick={() => window.location.reload()}>Try again</button>
        </main>
      ) : !session ? (
        <main className="welcome">
          <section className="intro">
            <p className="eyebrow">YOUR PERSONAL READING SPACE</p>
            <h1>
              Good books.
              <br />
              All in one place.
            </h1>
            <p className="lead">
              Keep the books you love, the ones you’re reading, and the stories
              waiting for you.
            </p>
            <div className="book-art" aria-hidden="true">
              <div className="spine first">ONE MORE CHAPTER</div>
              <div className="spine second">STORIES TO KEEP</div>
              <div className="spine third">THE NEXT ADVENTURE</div>
            </div>
            <p className="small">Your shelf is private. Make it your own.</p>
          </section>
          <section className="auth-card">
            <p className="eyebrow">MAKE ROOM FOR A GOOD BOOK</p>
            <h2>
              {mode === "sign-in" ? "Welcome back." : "Start your shelf."}
            </h2>
            <p>
              {mode === "sign-in"
                ? "Sign in to pick up where you left off."
                : "A name, an email, and your next chapter."}
            </p>
            <form onSubmit={authenticate}>
              {mode === "sign-up" && (
                <label>
                  Your name
                  <input
                    name="name"
                    autoComplete="name"
                    required
                    maxLength={80}
                    placeholder="Alex Morgan"
                  />
                </label>
              )}
              <label>
                Email address
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  autoComplete={
                    mode === "sign-in" ? "current-password" : "new-password"
                  }
                  required
                  minLength={8}
                  maxLength={128}
                  placeholder="At least 8 characters"
                />
              </label>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <button className="primary" disabled={busy}>
                {busy
                  ? "Please wait…"
                  : mode === "sign-in"
                    ? "Sign in →"
                    : "Create account →"}
              </button>
            </form>
            <p className="switch">
              {mode === "sign-in" ? "New here?" : "Already have an account?"}{" "}
              <button
                disabled={busy}
                className="text-button"
                onClick={() => {
                  setMode(mode === "sign-in" ? "sign-up" : "sign-in");
                  setError("");
                }}
              >
                {mode === "sign-in" ? "Create an account" : "Sign in"}
              </button>
            </p>
          </section>
        </main>
      ) : (
        <main>
          <div className="page-heading">
            <div>
              <p className="eyebrow">A CHAPTER AT A TIME</p>
              <h1>Your bookshelf.</h1>
              <p>Welcome, {session.user.name}. What will you read next?</p>
            </div>
            <div className="stats">
              <strong>{books.length}</strong>
              <span>books on your shelf</span>
            </div>
          </div>
          <div className="dashboard">
            <aside className="editor">
              <h2>{editing ? "Edit your book" : "Add a book"}</h2>
              <p>Give your next read a home.</p>
              <form onSubmit={save}>
                <label>
                  Book title
                  <input
                    id="book-title"
                    value={draft.title}
                    onChange={(e) =>
                      setDraft({ ...draft, title: e.target.value })
                    }
                    required
                    maxLength={160}
                    placeholder="e.g. Things Fall Apart"
                  />
                </label>
                <label>
                  Author
                  <input
                    value={draft.author}
                    onChange={(e) =>
                      setDraft({ ...draft, author: e.target.value })
                    }
                    required
                    maxLength={100}
                    placeholder="e.g. Chinua Achebe"
                  />
                </label>
                <label>
                  Reading status
                  <select
                    value={draft.status}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        status: e.target.value as BookInput["status"],
                      })
                    }
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {labels[s]}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="primary" disabled={busy}>
                  {busy
                    ? "Saving…"
                    : editing
                      ? "Save changes"
                      : "+ Add to shelf"}
                </button>
                {editing && (
                  <button
                    type="button"
                    className="quiet"
                    disabled={busy}
                    onClick={() => {
                      setEditing(null);
                      setDraft(blank);
                    }}
                  >
                    Cancel editing
                  </button>
                )}
              </form>
            </aside>
            <section className="collection" aria-label="Your books">
              <div className="collection-tools">
                <h2>
                  The collection <span>{books.length}</span>
                </h2>
                <input
                  aria-label="Search books"
                  placeholder="Search title or author…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="filters">
                {["all", ...statuses].map((s) => (
                  <button
                    key={s}
                    aria-pressed={filter === s}
                    className={filter === s ? "active" : ""}
                    onClick={() => setFilter(s)}
                  >
                    {s === "all"
                      ? "All books"
                      : labels[s as BookInput["status"]]}
                  </button>
                ))}
              </div>
              {error && (
                <div className="error" role="alert">
                  {error}{" "}
                  <button
                    className="text-button"
                    disabled={loading}
                    onClick={() => {
                      setError("");
                      void loadBooks();
                    }}
                  >
                    Reload books
                  </button>
                </div>
              )}
              {notice && (
                <p className="notice" role="status">
                  {notice}
                </p>
              )}
              {loading ? (
                <p role="status">Loading your books…</p>
              ) : filtered.length === 0 ? (
                <div className="empty">
                  <span aria-hidden="true">＋</span>
                  <h3>
                    {books.length
                      ? "No matching books"
                      : "Your next chapter starts here"}
                  </h3>
                  <p>
                    {books.length
                      ? "Try another search or reading status."
                      : "Add your first book using the form. Your shelf will grow with you."}
                  </p>
                </div>
              ) : (
                <div className="book-grid">
                  {filtered.map((book, i) => (
                    <article className="book-card" key={book.id}>
                      <div className={`cover tone-${i % 4}`}>
                        <span className="cover-label">ON YOUR SHELF</span>
                        <h3>{book.title}</h3>
                        <span className="cover-author">{book.author}</span>
                        <span className="cover-mark" aria-hidden="true">
                          b.
                        </span>
                      </div>
                      <div className="book-meta">
                        <span className={`badge ${book.status}`}>
                          {labels[book.status]}
                        </span>
                        <div>
                          <button
                            disabled={busy}
                            className="text-button"
                            onClick={() => {
                              setEditing(book.id);
                              setDraft({
                                title: book.title,
                                author: book.author,
                                status: book.status,
                              });
                              document.getElementById("book-title")?.focus();
                            }}
                          >
                            Edit<span className="sr-only"> {book.title}</span>
                          </button>
                          <button
                            disabled={busy}
                            className="text-button delete"
                            onClick={() => remove(book)}
                          >
                            Delete<span className="sr-only"> {book.title}</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      )}
      <footer>Bookshelf · A place for every chapter.</footer>
    </div>
  );
}
