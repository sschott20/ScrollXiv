"use client";

import { useState, useEffect } from "react";
import { downloadFile, getExportFilename } from "@/lib/export";

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

type Tab = "export" | "import";
type ExportFormat = "json" | "csv" | "bibtex" | "markdown";
type ImportType = "arxiv" | "bibtex" | "json";

interface Collection {
  id: string;
  name: string;
  paperCount?: number;
}

interface Tag {
  id: string;
  name: string;
  usageCount?: number;
}

export function ExportImportModal({ isOpen, onClose, onImportComplete }: ExportImportModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("export");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("json");
  const [importType, setImportType] = useState<ImportType>("arxiv");
  const [importData, setImportData] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [saveToLibrary, setSaveToLibrary] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchCollections();
      fetchTags();
    }
  }, [isOpen]);

  async function fetchCollections() {
    try {
      const response = await fetch("/api/collections");
      if (response.ok) {
        const data = await response.json();
        setCollections(data.collections);
      }
    } catch (error) {
      console.error("Failed to fetch collections:", error);
    }
  }

  async function fetchTags() {
    try {
      const response = await fetch("/api/tags");
      if (response.ok) {
        const data = await response.json();
        setTags(data.tags);
      }
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    }
  }

  async function handleExport() {
    setIsLoading(true);
    setMessage(null);

    try {
      const params = new URLSearchParams({ format: exportFormat });
      if (selectedCollection) params.append("collection", selectedCollection);
      if (selectedTag) params.append("tag", selectedTag);

      const response = await fetch(`/api/export?${params}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Export failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = getExportFilename(exportFormat);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage({ type: "success", text: "Papers exported successfully!" });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Export failed",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleImport() {
    if (!importData.trim()) {
      setMessage({ type: "error", text: "Please provide data to import" });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: importType,
          data: importData.trim(),
          saveToLibrary,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Import failed");
      }

      const result = await response.json();
      setMessage({
        type: "success",
        text: `Successfully imported ${result.count} paper${result.count === 1 ? "" : "s"}!`,
      });
      setImportData("");

      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Import failed",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportData(content);
    };
    reader.readAsText(file);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <div className="h-full overflow-y-auto">
        <div className="min-h-full bg-slate-900 text-white">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-700">
            <div className="max-w-3xl mx-auto p-4">
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={onClose}
                  className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <h1 className="text-xl font-bold">Export & Import</h1>
              </div>

              {/* Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("export")}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === "export"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Export
                </button>
                <button
                  onClick={() => setActiveTab("import")}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === "import"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Import
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-3xl mx-auto p-4 space-y-6">
            {activeTab === "export" ? (
              <>
                {/* Format selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Export Format
                  </label>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="json">JSON (Full backup with all data)</option>
                    <option value="csv">CSV (Metadata only)</option>
                    <option value="bibtex">BibTeX (Citations)</option>
                    <option value="markdown">Markdown (Reading list)</option>
                  </select>
                </div>

                {/* Collection filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Filter by Collection (Optional)
                  </label>
                  <select
                    value={selectedCollection}
                    onChange={(e) => setSelectedCollection(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All collections</option>
                    {collections.map((collection) => (
                      <option key={collection.id} value={collection.id}>
                        {collection.name} ({collection.paperCount || 0})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tag filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Filter by Tag (Optional)
                  </label>
                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All tags</option>
                    {tags.map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name} ({tag.usageCount || 0})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Export button */}
                <button
                  onClick={handleExport}
                  disabled={isLoading}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Download Export
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                {/* Import type selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Import Type
                  </label>
                  <select
                    value={importType}
                    onChange={(e) => setImportType(e.target.value as ImportType)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="arxiv">arXiv IDs</option>
                    <option value="bibtex">BibTeX</option>
                    <option value="json">JSON Backup</option>
                  </select>
                </div>

                {/* Description */}
                <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-300">
                  {importType === "arxiv" && (
                    <p>
                      Enter arXiv IDs (one per line or comma-separated). Also supports URLs like
                      https://arxiv.org/abs/2301.12345
                    </p>
                  )}
                  {importType === "bibtex" && (
                    <p>
                      Paste BibTeX entries. arXiv IDs will be extracted and papers will be fetched from arXiv.
                    </p>
                  )}
                  {importType === "json" && (
                    <p>
                      Upload or paste a JSON export file from ScrollXiv to restore your papers with all metadata.
                    </p>
                  )}
                </div>

                {/* File upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Upload File (Optional)
                  </label>
                  <input
                    type="file"
                    accept={importType === "json" ? ".json" : ".bib,.txt"}
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-700 file:text-white file:cursor-pointer hover:file:bg-slate-600"
                  />
                </div>

                {/* Text input */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Or Paste Data
                  </label>
                  <textarea
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    placeholder={
                      importType === "arxiv"
                        ? "2301.12345\n2302.67890\nhttps://arxiv.org/abs/2303.11111"
                        : importType === "bibtex"
                        ? "@article{...}"
                        : '{"metadata": {...}, "papers": [...]}'
                    }
                    rows={10}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>

                {/* Save to library option */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="saveToLibrary"
                    checked={saveToLibrary}
                    onChange={(e) => setSaveToLibrary(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="saveToLibrary" className="text-sm text-slate-300 cursor-pointer">
                    Automatically save imported papers to library
                  </label>
                </div>

                {/* Import button */}
                <button
                  onClick={handleImport}
                  disabled={isLoading || !importData.trim()}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                      Import Papers
                    </>
                  )}
                </button>
              </>
            )}

            {/* Message */}
            {message && (
              <div
                className={`p-4 rounded-lg ${
                  message.type === "success"
                    ? "bg-green-900/50 border border-green-700 text-green-200"
                    : "bg-red-900/50 border border-red-700 text-red-200"
                }`}
              >
                {message.text}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
