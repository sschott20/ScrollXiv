"use client";

import { useState, useEffect, useRef } from "react";

interface Tag {
  id: string;
  name: string;
  color: string | null;
}

interface TagInputProps {
  paperId: string;
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
}

const TAG_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#84cc16", // lime
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#d946ef", // fuchsia
  "#ec4899", // pink
];

export function TagInput({ paperId, selectedTags, onTagsChange }: TagInputProps) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTags();
  }, []);

  async function fetchTags() {
    try {
      const response = await fetch("/api/tags");
      if (response.ok) {
        const data = await response.json();
        setAllTags(data.tags);
      }
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    }
  }

  const filteredTags = allTags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
      !selectedTags.some((st) => st.id === tag.id)
  );

  async function createTag(name: string) {
    setIsCreating(true);
    try {
      const randomColor = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color: randomColor }),
      });

      if (response.ok) {
        const data = await response.json();
        const newTag = data.tag;
        setAllTags([...allTags, newTag]);
        await addTagToPaper(newTag);
      }
    } catch (error) {
      console.error("Failed to create tag:", error);
    } finally {
      setIsCreating(false);
    }
  }

  async function addTagToPaper(tag: Tag) {
    try {
      const response = await fetch(`/api/papers/${paperId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addTag", tagId: tag.id }),
      });

      if (response.ok) {
        onTagsChange([...selectedTags, tag]);
      }
    } catch (error) {
      console.error("Failed to add tag:", error);
    }
  }

  async function removeTagFromPaper(tag: Tag) {
    try {
      const response = await fetch(`/api/papers/${paperId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "removeTag", tagId: tag.id }),
      });

      if (response.ok) {
        onTagsChange(selectedTags.filter((t) => t.id !== tag.id));
      }
    } catch (error) {
      console.error("Failed to remove tag:", error);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
    setShowSuggestions(true);
  }

  function handleSelectTag(tag: Tag) {
    addTagToPaper(tag);
    setInputValue("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  }

  function handleCreateNew() {
    const trimmedValue = inputValue.trim();
    if (trimmedValue) {
      createTag(trimmedValue);
      setInputValue("");
      setShowSuggestions(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredTags.length > 0) {
        handleSelectTag(filteredTags[0]);
      } else if (inputValue.trim()) {
        handleCreateNew();
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setInputValue("");
    }
  }

  return (
    <div className="space-y-2">
      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: tag.color || "#6366f1" }}
            >
              {tag.name}
              <button
                onClick={() => removeTagFromPaper(tag)}
                className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Add tags..."
          disabled={isCreating}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        />

        {/* Suggestions dropdown */}
        {showSuggestions && (inputValue || filteredTags.length > 0) && (
          <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredTags.length > 0 ? (
              <>
                {filteredTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleSelectTag(tag)}
                    className="w-full px-3 py-2 text-left hover:bg-slate-700 transition-colors flex items-center gap-2"
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color || "#6366f1" }}
                    />
                    <span className="text-white">{tag.name}</span>
                  </button>
                ))}
                {inputValue.trim() && !allTags.some((t) => t.name.toLowerCase() === inputValue.trim().toLowerCase()) && (
                  <button
                    onClick={handleCreateNew}
                    className="w-full px-3 py-2 text-left hover:bg-slate-700 transition-colors text-indigo-400 border-t border-slate-700"
                    disabled={isCreating}
                  >
                    + Create &quot;{inputValue.trim()}&quot;
                  </button>
                )}
              </>
            ) : inputValue.trim() ? (
              <button
                onClick={handleCreateNew}
                className="w-full px-3 py-2 text-left hover:bg-slate-700 transition-colors text-indigo-400"
                disabled={isCreating}
              >
                + Create &quot;{inputValue.trim()}&quot;
              </button>
            ) : (
              <div className="px-3 py-2 text-slate-400 text-sm">No tags found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
