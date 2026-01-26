import { useEffect, useRef, useState } from "react";

export default function EditorCanvas({ activeTool, pages, activePageId, detections, onAddDetection, onDeleteDetection, onUpload, isProcessing, isUploading, isInitialLoading }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [currentBox, setCurrentBox] = useState(null);

  const activePage = pages.find(p => p.page_id === activePageId);
  const pageDetections = detections.filter(d => d.page_id === activePageId);

  // 1. Handle Zoom/Pan
  const handleWheel = (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const s = Math.exp(-e.deltaY * 0.001);
      setScale(prev => Math.min(Math.max(0.1, prev * s), 5));
    } else {
      setPosition(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  // 2. Coordinate Conversion (Screen <-> Image)
  const getMouseCoords = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    // Calculate position relative to the container center/offset
    // This is a simplified version; in production, use a Matrix transformation library
    return {
      x: (e.clientX - rect.left - position.x) / scale,
      y: (e.clientY - rect.top - position.y) / scale
    };
  };

  // 3. Mouse Interactions
  const handleMouseDown = (e) => {
    if (!activePage) return;

    if (activeTool === "pan") {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    } else if (activeTool === "draw_box") {
      setIsDrawing(true);
      const coords = getMouseCoords(e);
      setDrawStart(coords);
      setCurrentBox({ x: coords.x, y: coords.y, w: 0, h: 0 });
    }
  };

  const handleMouseMove = (e) => {
    if (activeTool === "pan" && isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else if (activeTool === "draw_box" && isDrawing) {
      const coords = getMouseCoords(e);
      setCurrentBox({
        x: Math.min(drawStart.x, coords.x),
        y: Math.min(drawStart.y, coords.y),
        w: Math.abs(coords.x - drawStart.x),
        h: Math.abs(coords.y - drawStart.y)
      });
    }
  };

  const handleMouseUp = () => {
    if (activeTool === "pan") {
      setIsDragging(false);
    } else if (activeTool === "draw_box" && isDrawing) {
      setIsDrawing(false);
      if (currentBox && currentBox.w > 5 && currentBox.h > 5) {
        // Save to Backend
        onAddDetection({
            bbox_x1: currentBox.x,
            bbox_y1: currentBox.y,
            bbox_x2: currentBox.x + currentBox.w,
            bbox_y2: currentBox.y + currentBox.h,
            class_name: "Manual_Item", // Default class
            confidence: 1.0,
            is_manual: true
        });
      }
      setCurrentBox(null);
    }
  };

  // 4. Loading State
  if (isProcessing || isUploading || isInitialLoading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-zinc-950">
        <div className="text-center text-zinc-400 p-4">
          <div className="mb-6">
            <div className="animate-spin h-16 w-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
          <p className="mb-2 text-lg font-medium text-white">
            Loading Canvas...
          </p>
          <p className="text-sm text-zinc-500">
            Processing the Document
          </p>
        </div>
      </div>
    );
  }

  // 5. Empty State
  if (!activePage) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-zinc-950">
        <div className="text-center text-zinc-400 p-4">
          <div className="text-4xl mb-4">⬆️</div>
          <p className="mb-2 text-lg font-medium">No Page Selected</p>
          <button onClick={onUpload} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium">
            Upload PDF
          </button>
        </div>
      </div>
    );
  }

  // 6. Render Canvas
  return (
    <div 
      className="h-full w-full overflow-hidden bg-zinc-900 relative"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div
        ref={containerRef}
        className="absolute origin-top-left transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          width: activePage.width,
          height: activePage.height
        }}
      >
        {/* The PDF Image */}
        <img 
          src={activePage.image_url} 
          alt="Blueprint" 
          className="pointer-events-none select-none"
          style={{ maxWidth: 'none' }} // Prevent CSS constraints
        />

        {/* The Annotation Overlay */}
        <svg 
            className="absolute top-0 left-0 w-full h-full"
            style={{ pointerEvents: activeTool === 'draw_box' ? 'none' : 'auto' }}
        >
            {/* Existing Detections */}
            {pageDetections.map((det) => (
                <g key={det.id} className="group cursor-pointer">
                    <rect
                        x={det.bbox_x1}
                        y={det.bbox_y1}
                        width={det.bbox_x2 - det.bbox_x1}
                        height={det.bbox_y2 - det.bbox_y1}
                        fill={det.is_manual ? "rgba(34, 197, 94, 0.2)" : "rgba(59, 130, 246, 0.2)"}
                        stroke={det.is_manual ? "#22c55e" : "#3b82f6"}
                        strokeWidth={2 / scale}
                        vectorEffect="non-scaling-stroke"
                    />
                    <text
                        x={det.bbox_x1}
                        y={det.bbox_y1 - 5}
                        fill={det.is_manual ? "#22c55e" : "#3b82f6"}
                        fontSize={14 / scale}
                        fontWeight="bold"
                    >
                        {det.class_name} ({Math.round(det.confidence * 100)}%)
                    </text>
                    {/* Delete Button (Visible on Hover) */}
                    {activeTool === 'eraser' && (
                        <rect
                            x={det.bbox_x1}
                            y={det.bbox_y1}
                            width={det.bbox_x2 - det.bbox_x1}
                            height={det.bbox_y2 - det.bbox_y1}
                            fill="rgba(239, 68, 68, 0.4)"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteDetection(det.id);
                            }}
                            className="cursor-pointer hover:fill-red-500/60"
                        />
                    )}
                </g>
            ))}

            {/* Currently Drawing Box */}
            {currentBox && (
                <rect
                    x={currentBox.x}
                    y={currentBox.y}
                    width={currentBox.w}
                    height={currentBox.h}
                    fill="rgba(34, 197, 94, 0.2)"
                    stroke="#22c55e"
                    strokeWidth={2 / scale}
                    strokeDasharray="4"
                />
            )}
        </svg>
      </div>
      
      {/* HUD Info */}
      <div className="absolute bottom-4 right-4 bg-zinc-900/90 px-3 py-1.5 rounded text-xs text-zinc-400 border border-zinc-800">
        {Math.round(scale * 100)}% | {Math.round(position.x)}, {Math.round(position.y)}
      </div>
    </div>
  );
}