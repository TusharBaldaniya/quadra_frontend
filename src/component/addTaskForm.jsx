import React, { useState } from "react";

export default function AddTaskForm({ addTask }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Medium");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title) return;
    addTask(title, priority);
    setTitle("");
    setPriority("Medium");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 bg-white p-4 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center gap-3 sm:gap-4 transition-all duration-200"
    >
      {/* Task Input */}
      <input
        type="text"
        placeholder="Add a new task..."
        className="flex-1 p-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-300 outline-none transition-all duration-200 placeholder-gray-400"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* Priority Selector */}
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
        className="p-3 rounded-xl border-2 border-gray-200 bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-300 outline-none transition-all duration-200 text-gray-700"
      >
        <option>High</option>
        <option>Medium</option>
        <option>Low</option>
      </select>

      {/* Submit Button */}
      <button
        type="submit"
        className="bg-blue-500 text-white px-5 py-3 rounded-2xl font-semibold shadow-lg hover:bg-blue-600 active:scale-95 transition-transform duration-150 flex items-center gap-2"
      >
        <span className="text-lg">➕</span> Add
      </button>
    </form>
  );
}
