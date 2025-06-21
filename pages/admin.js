// pages/admin.js
import { useEffect, useState } from "react";
import styles from "../components/Admin.module.css";

export default function AdminDashboard() {
  const [knowledge, setKnowledge] = useState([]);
  const [newEntry, setNewEntry] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/knowledge")
      .then((res) => res.json())
      .then((data) => setKnowledge(data))
      .catch((err) => console.error("Chyba nahrání znalostí:", err));
  }, []);

  async function addEntry() {
    if (!newEntry.trim()) return;
    setLoading(true);
    const res = await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entry: newEntry }),
    });
    const updated = await res.json();
    setKnowledge(updated);
    setNewEntry("");
    setLoading(false);
  }

  async function deleteEntry(index) {
    setLoading(true);
    const res = await fetch("/api/knowledge", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index }),
    });
    const updated = await res.json();
    setKnowledge(updated);
    setLoading(false);
  }

  return (
    <div className={styles.adminContainer}>
      <h1>Admin Dashboard - Znalosti</h1>
      <div className={styles.formGroup}>
        <textarea
          rows={4}
          placeholder="Nový záznam znalosti..."
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
        />
        <button onClick={addEntry} disabled={loading}>
          {loading ? "Ukládám..." : "Přidat znalost"}
        </button>
      </div>
      <ul className={styles.knowledgeList}>
        {knowledge.map((entry, idx) => (
          <li key={idx}>
            <span>{entry}</span>
            <button onClick={() => deleteEntry(idx)} disabled={loading}>
              Smazat
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
