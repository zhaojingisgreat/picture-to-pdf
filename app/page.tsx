"use client";

import { useState, useCallback, useRef } from "react";
import { jsPDF } from "jspdf";

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  width: number;
  height: number;
}

export default function Home() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [converting, setConverting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const processFiles = useCallback((files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((f) =>
      f.type.startsWith("image/")
    );

    Promise.all(
      validFiles.map(
        (file) =>
          new Promise<ImageFile>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const img = new Image();
              img.onload = () => {
                resolve({
                  id: crypto.randomUUID(),
                  file,
                  preview: e.target!.result as string,
                  width: img.width,
                  height: img.height,
                });
              };
              img.src = e.target!.result as string;
            };
            reader.readAsDataURL(file);
          })
      )
    ).then((newImages) => {
      setImages((prev) => [...prev, ...newImages]);
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const removeImage = (id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter((i) => i.id !== id);
    });
  };

  const clearAll = () => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
  };

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const updated = [...images];
    const [dragged] = updated.splice(dragItem.current, 1);
    updated.splice(dragOverItem.current, 0, dragged);
    setImages(updated);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const convertToPDF = async () => {
    if (images.length === 0) return;
    setConverting(true);

    try {
      // Load all images first
      const loadedImages = await Promise.all(
        images.map(
          (img) =>
            new Promise<{ data: string; w: number; h: number }>((resolve) => {
              const image = new Image();
              image.onload = () => {
                resolve({
                  data: img.preview,
                  w: image.width,
                  h: image.height,
                });
              };
              image.src = img.preview;
            })
        )
      );

      const pdf = new jsPDF({
        orientation:
          loadedImages[0].w > loadedImages[0].h ? "landscape" : "portrait",
        unit: "px",
        format: [loadedImages[0].w, loadedImages[0].h],
      });

      loadedImages.forEach((img, i) => {
        if (i > 0) {
          pdf.addPage(
            [img.w, img.h],
            img.w > img.h ? "landscape" : "portrait"
          );
        }
        pdf.addImage(img.data, "JPEG", 0, 0, img.w, img.h, undefined, "FAST");
      });

      pdf.save("pictures.pdf");
    } catch {
      alert("Conversion failed. Please try again.");
    } finally {
      setConverting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--card)",
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                width="32"
                height="32"
                rx="8"
                fill="var(--primary)"
              />
              <path
                d="M8 22L13 15L17 20L20 17L24 22H8Z"
                fill="white"
                opacity="0.9"
              />
              <circle cx="20" cy="12" r="3" fill="white" opacity="0.9" />
              <rect
                x="6"
                y="6"
                width="20"
                height="20"
                rx="2"
                stroke="white"
                strokeWidth="1.5"
                fill="none"
                opacity="0.5"
              />
            </svg>
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              Picture to PDF
            </span>
          </div>
          <span
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
            }}
          >
            Free &middot; No signup &middot; Private
          </span>
        </div>
      </header>

      {/* Main */}
      <main
        style={{
          flex: 1,
          maxWidth: 960,
          margin: "0 auto",
          padding: "40px 24px",
          width: "100%",
        }}
      >
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              margin: "0 0 12px",
              lineHeight: 1.2,
            }}
          >
            Convert Images to PDF
          </h1>
          <p
            style={{
              fontSize: 16,
              color: "var(--text-secondary)",
              margin: 0,
              maxWidth: 480,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Drop your images, arrange the order, and download a PDF. Everything
            happens in your browser — your files never leave your device.
          </p>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? "var(--primary)" : "var(--drop-border)"}`,
            borderRadius: 16,
            padding: "48px 24px",
            textAlign: "center",
            cursor: "pointer",
            background: dragOver ? "var(--drop-bg)" : "transparent",
            transition: "all 0.2s",
            marginBottom: images.length > 0 ? 32 : 0,
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files) processFiles(e.target.files);
              e.target.value = "";
            }}
            style={{ display: "none" }}
          />
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            style={{ margin: "0 auto 16px", display: "block", opacity: 0.5 }}
          >
            <path
              d="M24 32V16M24 16L18 22M24 16L30 22"
              stroke="var(--text-secondary)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M40 30V36C40 38.2091 38.2091 40 36 40H12C9.79086 40 8 38.2091 8 36V30"
              stroke="var(--text-secondary)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          <p
            style={{
              fontSize: 16,
              fontWeight: 600,
              margin: "0 0 4px",
            }}
          >
            Click to upload or drag & drop
          </p>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              margin: 0,
            }}
          >
            JPG, PNG, WebP, GIF, BMP, TIFF
          </p>
        </div>

        {/* Image Preview Grid */}
        {images.length > 0 && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  color: "var(--text-secondary)",
                }}
              >
                {images.length} image{images.length > 1 ? "s" : ""} — drag to
                reorder
              </span>
              <button
                onClick={clearAll}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--danger)",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                  padding: "4px 8px",
                }}
              >
                Clear all
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: 12,
                marginBottom: 32,
              }}
            >
              {images.map((img, index) => (
                <div
                  key={img.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  style={{
                    position: "relative",
                    borderRadius: 12,
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    cursor: "grab",
                    aspectRatio: "1",
                  }}
                >
                  <img
                    src={img.preview}
                    alt={img.file.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  {/* Index badge */}
                  <span
                    style={{
                      position: "absolute",
                      top: 6,
                      left: 6,
                      background: "rgba(0,0,0,0.6)",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 600,
                      borderRadius: 6,
                      padding: "2px 7px",
                    }}
                  >
                    {index + 1}
                  </span>
                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(img.id);
                    }}
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      border: "none",
                      background: "rgba(0,0,0,0.6)",
                      color: "#fff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      lineHeight: 1,
                    }}
                  >
                    &times;
                  </button>
                  {/* Filename */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: "16px 8px 6px",
                      background:
                        "linear-gradient(transparent, rgba(0,0,0,0.5))",
                      color: "#fff",
                      fontSize: 11,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {img.file.name}
                  </div>
                </div>
              ))}
            </div>

            {/* Convert Button */}
            <div style={{ textAlign: "center" }}>
              <button
                onClick={convertToPDF}
                disabled={converting}
                style={{
                  background: converting
                    ? "var(--text-secondary)"
                    : "var(--primary)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "14px 48px",
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: converting ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                  letterSpacing: "-0.01em",
                }}
                onMouseEnter={(e) => {
                  if (!converting)
                    (e.target as HTMLButtonElement).style.background =
                      "var(--primary-hover)";
                }}
                onMouseLeave={(e) => {
                  if (!converting)
                    (e.target as HTMLButtonElement).style.background =
                      "var(--primary)";
                }}
              >
                {converting ? "Converting..." : "Convert & Download PDF"}
              </button>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "20px 24px",
          textAlign: "center",
          fontSize: 13,
          color: "var(--text-secondary)",
        }}
      >
        100% free &middot; No data collected &middot; All processing happens in
        your browser
      </footer>
    </div>
  );
}
