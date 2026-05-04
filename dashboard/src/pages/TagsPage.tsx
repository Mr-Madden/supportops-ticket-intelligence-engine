import React, { useState, useEffect, useCallback } from "react";
import api from "../api/client";
import { Card, Spinner } from "../components/ui";
import type { Tag } from "../types";

export const TagsPage: React.FC = () => {
  const [tags, setTags]       = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTag, setNewTag]   = useState("");
  const [newCat, setNewCat]   = useState("");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setTags(await api.listTags(false)); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed to load tags"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!newTag.trim()) return;
    setSaving(true);
    try {
      const tag = await api.createTag({ tag_name: newTag.trim(), category: newCat || undefined });
      setTags((prev) => [tag, ...prev]);
      setNewTag(""); setNewCat("");
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to add tag"); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async (tagId: string) => {
    try {
      await api.deleteTag(tagId);
      setTags((prev) => prev.map((t) => t.id === tagId ? { ...t, active: false } : t));
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to deactivate tag"); }
  };

  const inputStyle: React.CSSProperties = {
    fontSize: 12, padding: "6px 10px", borderRadius: 6,
    border: "0.5px solid #E5E7EB", background: "#fff",
    color: "#374151", fontFamily: "DM Sans, sans-serif", outline: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 720 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "12px 16px", flex: 1 }}>
          <div style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>Active tags</div>
          <div style={{ fontSize: 24, fontWeight: 500, color: "#111827" }}>{tags.filter((t) => t.active).length}</div>
        </div>
        <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "12px 16px", flex: 1 }}>
          <div style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total tags</div>
          <div style={{ fontSize: 24, fontWeight: 500, color: "#111827" }}>{tags.length}</div>
        </div>
      </div>

      <Card title="Add tag to taxonomy">
        {error && <div style={{ fontSize: 12, color: "#D85A30", marginBottom: 10 }}>{error}</div>}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input style={{ ...inputStyle, flex: 1, minWidth: 140 }} placeholder="tag-name" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
          <select style={{ ...inputStyle, minWidth: 140 }} value={newCat} onChange={(e) => setNewCat(e.target.value)}>
            <option value="">No category</option>
            <option value="billing">Billing</option>
            <option value="technical">Technical</option>
            <option value="account">Account</option>
            <option value="feature_request">Feature request</option>
            <option value="general">General</option>
          </select>
          <button onClick={handleAdd} disabled={saving || !newTag.trim()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 6, border: "none", background: "#2A2E6E", color: "#fff", fontSize: 12, fontWeight: 500, cursor: saving || !newTag.trim() ? "not-allowed" : "pointer", opacity: saving || !newTag.trim() ? 0.6 : 1, fontFamily: "DM Sans, sans-serif" }}>
            {saving ? <Spinner size={12} /> : null}
            Add tag
          </button>
        </div>
      </Card>

      <Card title={`Tag taxonomy (${tags.length})`}>
        {loading ? <div style={{ display: "flex", justifyContent: "center", padding: 32 }}><Spinner /></div> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {["Tag", "Category", "Status", "Added", ""].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "0 10px 8px", fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9CA3AF", borderBottom: "0.5px solid #E5E7EB" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr key={tag.id}>
                  <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #F3F4F6" }}>
                    <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, background: "#E8EAF7", color: "#2A2E6E", padding: "1px 7px", borderRadius: 9999 }}>{tag.tag_name}</span>
                  </td>
                  <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #F3F4F6", color: "#6B7280", textTransform: "capitalize" }}>{tag.category ?? "—"}</td>
                  <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #F3F4F6" }}>
                    <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 9999, background: tag.active ? "#E1F5EE" : "#F3F4F6", color: tag.active ? "#085041" : "#9CA3AF", fontWeight: 500 }}>{tag.active ? "Active" : "Inactive"}</span>
                  </td>
                  <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #F3F4F6", color: "#9CA3AF", fontSize: 11 }}>{new Date(tag.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #F3F4F6" }}>
                    {tag.active && <button onClick={() => handleDeactivate(tag.id)} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, border: "0.5px solid #E5E7EB", background: "transparent", color: "#9CA3AF", cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>Deactivate</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};
