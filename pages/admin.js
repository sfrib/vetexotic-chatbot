import React, { useState } from "react";
import styles from "../components/Admin.module.css";

export default function Admin() {
  const [input, setInput] = useState("");
  const [entries, setEntries] = useState([]);

  const handleAdd = () => {
    if (input.trim() === "") return;
    setEntries([...entries, input.trim()]);
    setInput("");
    // TODO: přidej uložení do databáze zde
  };

  const handleDelete = (index) => {
    const updated = [...entries];
    updated.splice(index, 1);
    setEntries(updated);
    // TODO: přidej mazání z databáze zde
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>VetExotic Admin Panel</h1>
      <textarea
        className={styles.textarea}
        placeholder="Zadej novou znalost nebo instrukci..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button className={styles.addButton} onClick={handleAdd}>
        Přidat
      </button>

      <ul className={styles.entryList}>
        {entries.map((entry, index) => (
          <li key={index} className={styles.entryItem}>
            {entry}
            <button
              className={styles.deleteButton}
              onClick={() => handleDelete(index)}
            >
              Smazat
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
