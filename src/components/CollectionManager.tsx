"use client";

import { useState, useEffect } from "react";

interface Collection {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  paperCount?: number;
}

interface CollectionManagerProps {
  paperId: string;
  paperCollections: Array<{ id: string; name: string; color: string | null; icon: string | null }>;
  onClose: () => void;
  onCollectionsChange: (collections: Array<{ id: string; name: string; color: string | null; icon: string | null }>) => void;
}

const DEFAULT_ICONS = ["📚", "📖", "📝", "🔖", "⭐", "💡", "🎯", "🔬", "🧪", "🎓", "💻", "🚀", "🌟", "📊", "🎨"];

const DEFAULT_COLORS = [
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

export function CollectionManager({
  paperId,
  paperCollections,
  onClose,
  onCollectionsChange,
}: CollectionManagerProps) {
  const [allCollections, setAllCollections] = useState<Collection[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#8b5cf6",
    icon: "📚",
  });

  useEffect(() => {
    fetchCollections();
  }, []);

  async function fetchCollections() {
    try {
      const response = await fetch("/api/collections");
      if (response.ok) {
        const data = await response.json();
        setAllCollections(data.collections);
      }
    } catch (error) {
      console.error("Failed to fetch collections:", error);
    }
  }

  async function createCollection() {
    if (!formData.name.trim()) return;

    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        await fetchCollections();
        setFormData({ name: "", description: "", color: "#8b5cf6", icon: "📚" });
        setIsCreating(false);
      }
    } catch (error) {
      console.error("Failed to create collection:", error);
    }
  }

  async function updateCollection() {
    if (!editingCollection || !formData.name.trim()) return;

    try {
      const response = await fetch(`/api/collections/${editingCollection.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchCollections();
        setEditingCollection(null);
        setFormData({ name: "", description: "", color: "#8b5cf6", icon: "📚" });
      }
    } catch (error) {
      console.error("Failed to update collection:", error);
    }
  }

  async function deleteCollection(collectionId: string) {
    try {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchCollections();
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error("Failed to delete collection:", error);
    }
  }

  async function toggleCollectionForPaper(collection: Collection) {
    const isInCollection = paperCollections.some((c) => c.id === collection.id);
    const action = isInCollection ? "removeFromCollection" : "addToCollection";

    try {
      const response = await fetch(`/api/papers/${paperId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, collectionId: collection.id }),
      });

      if (response.ok) {
        if (isInCollection) {
          onCollectionsChange(paperCollections.filter((c) => c.id !== collection.id));
        } else {
          onCollectionsChange([...paperCollections, collection]);
        }
      }
    } catch (error) {
      console.error("Failed to toggle collection:", error);
    }
  }

  function startEdit(collection: Collection) {
    setEditingCollection(collection);
    setFormData({
      name: collection.name,
      description: collection.description || "",
      color: collection.color || "#8b5cf6",
      icon: collection.icon || "📚",
    });
  }

  function cancelEdit() {
    setEditingCollection(null);
    setFormData({ name: "", description: "", color: "#8b5cf6", icon: "📚" });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Manage Collections</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Create/Edit Form */}
          {(isCreating || editingCollection) && (
            <div className="bg-slate-800 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-white">
                {editingCollection ? "Edit Collection" : "New Collection"}
              </h3>

              <input
                type="text"
                placeholder="Collection name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <textarea
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />

              {/* Icon picker */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-colors ${
                        formData.icon === icon
                          ? "bg-indigo-600"
                          : "bg-slate-700 hover:bg-slate-600"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-lg transition-transform ${
                        formData.color === color ? "scale-110 ring-2 ring-white" : ""
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={editingCollection ? updateCollection : createCollection}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                >
                  {editingCollection ? "Update" : "Create"}
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    cancelEdit();
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Create button */}
          {!isCreating && !editingCollection && (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium"
            >
              + New Collection
            </button>
          )}

          {/* Collections list */}
          <div className="space-y-2">
            {allCollections.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                No collections yet. Create one to organize your papers!
              </div>
            ) : (
              allCollections.map((collection) => {
                const isInCollection = paperCollections.some((c) => c.id === collection.id);
                const isDeleting = deleteConfirm === collection.id;

                return (
                  <div
                    key={collection.id}
                    className="bg-slate-800 rounded-lg p-3 flex items-center gap-3"
                  >
                    <input
                      type="checkbox"
                      checked={isInCollection}
                      onChange={() => toggleCollectionForPaper(collection)}
                      className="w-5 h-5 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-800"
                    />

                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                      style={{ backgroundColor: collection.color || "#8b5cf6" }}
                    >
                      {collection.icon || "📚"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">{collection.name}</div>
                      {collection.description && (
                        <div className="text-sm text-slate-400 truncate">{collection.description}</div>
                      )}
                      <div className="text-xs text-slate-500">{collection.paperCount || 0} papers</div>
                    </div>

                    <div className="flex gap-1">
                      {isDeleting ? (
                        <>
                          <button
                            onClick={() => deleteCollection(collection.id)}
                            className="p-2 text-red-400 hover:text-red-300 transition-colors"
                            title="Confirm delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="p-2 text-slate-400 hover:text-white transition-colors"
                            title="Cancel"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(collection)}
                            className="p-2 text-slate-400 hover:text-white transition-colors"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(collection.id)}
                            className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
