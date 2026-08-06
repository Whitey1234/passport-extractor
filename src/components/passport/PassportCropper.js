"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const MIN_HEIGHT = 0.04;

export default function PassportCropper({ imageUrl, fileName, onConfirm, onCancel }) {
  const imageRef = useRef(null);
  const wrapperRef = useRef(null);
  const dragRef = useRef(null);

  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [crop, setCrop] = useState({ y: 0.8, height: 0.2 });
  const [isProcessing, setIsProcessing] = useState(false);

  const measure = useCallback(() => {
    const wrapper = wrapperRef.current;
    const image = imageRef.current;
    if (!wrapper || !image) return;

    const rect = wrapper.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setDisplaySize({ width: rect.width, height: rect.height });
      setNaturalSize({ width: image.naturalWidth, height: image.naturalHeight });
    }
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return undefined;

    const observer = new ResizeObserver(measure);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [measure]);

  const clampCrop = useCallback((y, height) => {
    const minHeight = Math.min(MIN_HEIGHT, 0.5);
    const maxTop = 1 - minHeight;
    const top = Math.min(Math.max(y, 0), maxTop);
    const h = Math.min(Math.max(height, minHeight), 1 - top);
    return { y: top, height: h };
  }, []);

  const startDrag = useCallback(
    (event, mode) => {
      event.preventDefault();
      dragRef.current = { mode, startY: event.clientY, startCrop: { ...crop } };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [crop]
  );

  const onPointerMove = useCallback(
    (event) => {
      const drag = dragRef.current;
      if (!drag || displaySize.height === 0) return;

      const delta = (event.clientY - drag.startY) / displaySize.height;
      const { y: startTop, height: startHeight } = drag.startCrop;

      if (drag.mode === "move") {
        setCrop(clampCrop(startTop + delta, startHeight));
      } else if (drag.mode === "top") {
        setCrop(clampCrop(startTop + delta, startHeight - delta));
      } else if (drag.mode === "bottom") {
        setCrop(clampCrop(startTop, startHeight + delta));
      }
    },
    [displaySize.height, clampCrop]
  );

  const stopDrag = useCallback((event) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const handleConfirm = useCallback(() => {
    const image = imageRef.current;
    const { width: naturalWidth, height: naturalHeight } = naturalSize;
    if (!image || naturalWidth === 0 || naturalHeight === 0 || isProcessing) return;

    const sourceWidth = naturalWidth;
    const sourceHeight = Math.max(1, Math.round(crop.height * naturalHeight));
    const sourceY = Math.round(crop.y * naturalHeight);

    const canvas = document.createElement("canvas");
    canvas.width = sourceWidth;
    canvas.height = sourceHeight;
    canvas.getContext("2d").drawImage(
      image,
      0,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      sourceWidth,
      sourceHeight
    );

    setIsProcessing(true);
    canvas.toBlob(
      (blob) => {
        setIsProcessing(false);
        if (blob) {
          onConfirm(blob);
        }
      },
      "image/jpeg",
      0.95
    );
  }, [naturalSize, crop, isProcessing, onConfirm]);

  const bandTop = crop.y * displaySize.height;
  const bandHeight = crop.height * displaySize.height;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select MRZ area</CardTitle>
        <CardDescription>
          Adjust the full-width band to cover the MRZ strip at the bottom of the passport. Drag the
          band to move it, or drag the top/bottom edges to resize. Only this area will be scanned.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center overflow-hidden rounded-md border bg-black">
          <div ref={wrapperRef} className="relative select-none self-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- need the raw element for canvas export */}
            <img
              ref={imageRef}
              src={imageUrl}
              alt={fileName || "Passport image"}
              onLoad={measure}
              className="block h-auto max-h-[70vh] w-auto max-w-full object-contain"
              draggable={false}
            />
            {displaySize.height > 0 && (
              <div className="absolute inset-0">
                <div
                  className="absolute inset-x-0 cursor-move"
                  style={{
                    top: bandTop,
                    height: bandHeight,
                    boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
                    touchAction: "none",
                  }}
                  onPointerDown={(event) => startDrag(event, "move")}
                  onPointerMove={onPointerMove}
                  onPointerUp={stopDrag}
                  onPointerCancel={stopDrag}
                >
                  <div
                    className="absolute inset-x-0 -top-3 flex h-6 cursor-ns-resize items-center justify-center"
                    style={{ touchAction: "none" }}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      startDrag(event, "top");
                    }}
                    onPointerMove={onPointerMove}
                    onPointerUp={stopDrag}
                    onPointerCancel={stopDrag}
                  >
                    <div className="h-1 w-12 rounded-full bg-white/90 shadow" />
                  </div>
                  <div
                    className="absolute inset-x-0 -bottom-3 flex h-6 cursor-ns-resize items-center justify-center"
                    style={{ touchAction: "none" }}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      startDrag(event, "bottom");
                    }}
                    onPointerMove={onPointerMove}
                    onPointerUp={stopDrag}
                    onPointerCancel={stopDrag}
                  >
                    <div className="h-1 w-12 rounded-full bg-white/90 shadow" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            className="flex-1"
            onClick={handleConfirm}
            disabled={isProcessing || displaySize.height === 0}
          >
            {isProcessing ? "Preparing..." : "Scan selected area"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}