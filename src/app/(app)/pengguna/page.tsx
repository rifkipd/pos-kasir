"use client";
import { useEffect, useState } from "react";
import { Modal } from "@/app/components/ui/Modal";
import { Icon } from "@/app/components/ui/Icon";

type User = { id: number; username: string; role: string };

export default function PenggunaPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  async function load() {
    const res = await fetch("/api/users");
    if (res.ok) setUsers(await res.json());
  }
  useEffect(() => { load(); }, []);

  async function remove(u: User) {
    if (!confirm(`Hapus pengguna ${u.username}?`)) return;
    const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
    if (!res.ok) alert((await res.json().catch(() => ({}))).error ?? "Gagal menghapus");
    await load();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--ink)]">Pengguna</h1>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-container)]"
        >
          <Icon name="add" size={18} /> Tambah Pengguna
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)] elev-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] text-left">
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Username</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Peran</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-[var(--line)]">
                <td className="px-4 py-3 text-[var(--ink)]">{u.username}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-[var(--surface-container)] px-2.5 py-0.5 text-xs font-medium text-[var(--primary)]">
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setEditing(u)} aria-label="Edit" className="rounded-lg p-1.5 text-[var(--muted)] hover:text-[var(--primary)]">
                      <Icon name="edit" size={18} />
                    </button>
                    <button onClick={() => remove(u)} aria-label="Hapus" className="rounded-lg p-1.5 text-[var(--muted)] hover:text-[var(--error)]">
                      <Icon name="delete" size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={adding} title="Tambah Pengguna" onClose={() => setAdding(false)}>
        <UserForm submitLabel="Tambah" onDone={() => { setAdding(false); load(); }}
          onSubmit={(body) => fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })} />
      </Modal>
      <Modal open={editing !== null} title="Edit Pengguna" onClose={() => setEditing(null)}>
        {editing && (
          <UserForm submitLabel="Simpan" initial={editing} onDone={() => { setEditing(null); load(); }}
            onSubmit={(body) => fetch(`/api/users/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })} />
        )}
      </Modal>
    </div>
  );
}

function UserForm({
  onSubmit, onDone, initial, submitLabel,
}: {
  onSubmit: (body: { username: string; password?: string; role: string }) => Promise<Response>;
  onDone: () => void;
  initial?: User;
  submitLabel: string;
}) {
  const [username, setUsername] = useState(initial?.username ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(initial?.role ?? "kasir");
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const body: { username: string; password?: string; role: string } = { username, role };
    if (password) body.password = password;
    const res = await onSubmit(body);
    if (res.ok) onDone();
    else setErr((await res.json().catch(() => ({}))).error ?? "Gagal menyimpan");
  }

  const inputCls = "w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary)]";
  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} required className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-[var(--muted)]">
          Password {initial ? "(kosongkan jika tidak diubah)" : ""}
        </label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Peran</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>
          <option value="kasir">Kasir</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      {err && <p className="text-sm text-[var(--error)]">{err}</p>}
      <button className="w-full rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-container)]">
        {submitLabel}
      </button>
    </form>
  );
}
