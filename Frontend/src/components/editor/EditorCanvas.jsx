import { useEffect, useRef, useState } from "react";

export default function EditorCanvas({ activeTool, pages, activePageId, detections, filters, onAddDetection, onUpdateDetection, onDeleteDetection, onUpload, isProcessing, isUploading, isInitialLoading, selectedClass }) {
  const containerRef = useRef(null);
  const canvasContainerRef = useRef(null); // Outer container for mouse coordinates
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [currentBox, setCurrentBox] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [editState, setEditState] = useState(null);

  const activePage = pages.find(p => p.page_id === activePageId);
  // Filter detections based on page and checkbox filters
  const pageDetections = detections.filter(d => {
    if (d.page_id !== activePageId) return false;
    // Check if this class is enabled in filters
    const className = d.class_name;
    // If filters has this class and it's false, hide it
    if (filters && filters.hasOwnProperty(className)) {
      return filters[className];
    }
    // For classes not in filters (like Manual_Item), always show
    return true;
  });

  // Fit image to canvas when page changes or loads
  useEffect(() => {
    setCurrentBox(null);
    setIsDrawing(false);
    setSelectedId(null);
    setEditState(null);
    
    // Wait for next frame to ensure container has rendered with correct dimensions
    requestAnimationFrame(() => {
      if (!activePage || !canvasContainerRef.current) {
        setScale(1);
        setPosition({ x: 0, y: 0 });
        return;
      }
      
      const container = canvasContainerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const imageWidth = activePage.width;
      const imageHeight = activePage.height;
      
      if (containerWidth > 0 && containerHeight > 0 && imageWidth > 0 && imageHeight > 0) {
        // Calculate scale to fit entire image with some padding
        const padding = 40; // 40px padding on all sides
        const scaleX = (containerWidth - padding * 2) / imageWidth;
        const scaleY = (containerHeight - padding * 2) / imageHeight;
        const fitScale = Math.min(scaleX, scaleY);
        
        // Center the image in the canvas
        const scaledWidth = imageWidth * fitScale;
        const scaledHeight = imageHeight * fitScale;
        const centerX = (containerWidth - scaledWidth) / 2;
        const centerY = (containerHeight - scaledHeight) / 2;
        
        setScale(fitScale);
        setPosition({ x: centerX, y: centerY });
      } else {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    });
  }, [activePageId, activePage]);

  useEffect(() => {
    if (selectedId && !detections.some(d => d.id === selectedId)) {
      setSelectedId(null);
    }
  }, [detections, selectedId]);

  useEffect(() => {
    if (activeTool !== "select" && editState) {
      setEditState(null);
    }
  }, [activeTool, editState]);

  // Prevent browser zoom on the canvas container (passive: false required)
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    // Prevent browser zoom with Ctrl+wheel
    const preventBrowserZoom = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    // Prevent pinch-to-zoom on trackpad
    const preventGestureZoom = (e) => {
      e.preventDefault();
    };

    // Add event listeners with passive: false to allow preventDefault
    container.addEventListener('wheel', preventBrowserZoom, { passive: false });
    container.addEventListener('gesturestart', preventGestureZoom, { passive: false });
    container.addEventListener('gesturechange', preventGestureZoom, { passive: false });
    container.addEventListener('gestureend', preventGestureZoom, { passive: false });

    return () => {
      container.removeEventListener('wheel', preventBrowserZoom);
      container.removeEventListener('gesturestart', preventGestureZoom);
      container.removeEventListener('gesturechange', preventGestureZoom);
      container.removeEventListener('gestureend', preventGestureZoom);
    };
  }, []);

  // Zoom limits
  const MIN_ZOOM = 0.25;
  const MAX_ZOOM = 5;
  const MIN_BOX_SIZE = 5;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const getDetectionColors = (det) => {
    if (det.is_manual) {
      return {
        fill: "rgba(34, 197, 94, 0.2)",
        stroke: "#22c55e",
        text: "#22c55e",
      };
    }
    if (det.is_edited) {
      return {
        fill: "rgba(245, 158, 11, 0.25)",
        stroke: "#f59e0b",
        text: "#f59e0b",
      };
    }
    return {
      fill: "rgba(59, 130, 246, 0.2)",
      stroke: "#3b82f6",
      text: "#3b82f6",
    };
  };

  // 1. Handle Zoom (Mouse wheel and trackpad gestures - canvas only)
  const handleWheel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = canvasContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Determine zoom factor based on wheel delta
    // Support both regular wheel and trackpad pinch (which also sends wheel events)
    let zoomFactor;
    if (e.ctrlKey || e.metaKey) {
      // Trackpad pinch zoom (sends smaller deltas with ctrlKey)
      zoomFactor = 1 - e.deltaY * 0.01;
    } else {
      // Regular mouse wheel zoom
      zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    }
    
    const newScale = Math.min(Math.max(MIN_ZOOM, scale * zoomFactor), MAX_ZOOM);
    
    // Adjust position to zoom towards mouse pointer
    const scaleChange = newScale / scale;
    setPosition(prev => ({
      x: mouseX - (mouseX - prev.x) * scaleChange,
      y: mouseY - (mouseY - prev.y) * scaleChange
    }));
    setScale(newScale);
  };

  // 2. Coordinate Conversion (Screen <-> Image)
  const getMouseCoords = (e) => {
    // Use the outer canvas container for mouse position
    const canvasRect = canvasContainerRef.current?.getBoundingClientRect();
    if (!canvasRect) return { x: 0, y: 0 };
    
    // Mouse position relative to canvas container
    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;
    
    // Convert to image coordinates by reversing the transform
    return {
      x: (mouseX - position.x) / scale,
      y: (mouseY - position.y) / scale
    };
  };

  const getMoveBox = (startBox, startMouse, coords) => {
    if (!activePage) return startBox;
    const width = startBox.bbox_x2 - startBox.bbox_x1;
    const height = startBox.bbox_y2 - startBox.bbox_y1;
    const maxX1 = Math.max(0, activePage.width - width);
    const maxY1 = Math.max(0, activePage.height - height);
    const nextX1 = clamp(startBox.bbox_x1 + (coords.x - startMouse.x), 0, maxX1);
    const nextY1 = clamp(startBox.bbox_y1 + (coords.y - startMouse.y), 0, maxY1);

    return {
      bbox_x1: nextX1,
      bbox_y1: nextY1,
      bbox_x2: nextX1 + width,
      bbox_y2: nextY1 + height,
    };
  };

  const getResizeBox = (startBox, coords, handle) => {
    if (!activePage) return startBox;
    let x1 = startBox.bbox_x1;
    let y1 = startBox.bbox_y1;
    let x2 = startBox.bbox_x2;
    let y2 = startBox.bbox_y2;

    if (handle.includes("w")) {
      x1 = clamp(coords.x, 0, x2 - MIN_BOX_SIZE);
    }
    if (handle.includes("e")) {
      x2 = clamp(coords.x, x1 + MIN_BOX_SIZE, activePage.width);
    }
    if (handle.includes("n")) {
      y1 = clamp(coords.y, 0, y2 - MIN_BOX_SIZE);
    }
    if (handle.includes("s")) {
      y2 = clamp(coords.y, y1 + MIN_BOX_SIZE, activePage.height);
    }

    return { bbox_x1: x1, bbox_y1: y1, bbox_x2: x2, bbox_y2: y2 };
  };

  const hasBoxChanged = (a, b) => {
    const EPS = 0.5;
    return (
      Math.abs(a.bbox_x1 - b.bbox_x1) > EPS ||
      Math.abs(a.bbox_y1 - b.bbox_y1) > EPS ||
      Math.abs(a.bbox_x2 - b.bbox_x2) > EPS ||
      Math.abs(a.bbox_y2 - b.bbox_y2) > EPS
    );
  };

  const startMoveEdit = (e, det) => {
    if (activeTool !== "select") return;
    e.preventDefault();
    e.stopPropagation();
    const coords = getMouseCoords(e);
    const startBox = {
      bbox_x1: det.bbox_x1,
      bbox_y1: det.bbox_y1,
      bbox_x2: det.bbox_x2,
      bbox_y2: det.bbox_y2,
    };
    setSelectedId(det.id);
    setEditState({
      id: det.id,
      type: "move",
      handle: null,
      startMouse: coords,
      startBox,
      currentBox: startBox,
      isManual: det.is_manual,
      wasEdited: Boolean(det.is_edited),
    });
  };

  const startResizeEdit = (e, det, handle) => {
    if (activeTool !== "select") return;
    e.preventDefault();
    e.stopPropagation();
    const coords = getMouseCoords(e);
    const startBox = {
      bbox_x1: det.bbox_x1,
      bbox_y1: det.bbox_y1,
      bbox_x2: det.bbox_x2,
      bbox_y2: det.bbox_y2,
    };
    setSelectedId(det.id);
    setEditState({
      id: det.id,
      type: "resize",
      handle,
      startMouse: coords,
      startBox,
      currentBox: startBox,
      isManual: det.is_manual,
      wasEdited: Boolean(det.is_edited),
    });
  };

  const commitEdit = () => {
    if (!editState) return;
    const startBox = editState.startBox;
    const finalBox = editState.currentBox || startBox;

    if (hasBoxChanged(finalBox, startBox) && onUpdateDetection) {
      const updates = {
        bbox_x1: finalBox.bbox_x1,
        bbox_y1: finalBox.bbox_y1,
        bbox_x2: finalBox.bbox_x2,
        bbox_y2: finalBox.bbox_y2,
      };
      if (!editState.isManual) {
        updates.is_edited = true;
      }

      const previous = {
        ...startBox,
        is_edited: editState.wasEdited,
      };
      const next = {
        ...finalBox,
        is_edited: editState.isManual ? editState.wasEdited : true,
      };

      onUpdateDetection(editState.id, updates, {
        previous,
        next,
        reason: editState.type,
      });
    }

    setEditState(null);
  };

  // 3. Mouse Interactions
  const handleMouseDown = (e) => {
    if (!activePage) return;

    if (activeTool === "select") {
      setSelectedId(null);
      return;
    }

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
    if (editState) {
      const coords = getMouseCoords(e);
      setEditState(prev => {
        if (!prev) return prev;
        const nextBox =
          prev.type === "move"
            ? getMoveBox(prev.startBox, prev.startMouse, coords)
            : getResizeBox(prev.startBox, coords, prev.handle);
        return { ...prev, currentBox: nextBox };
      });
      return;
    }

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
    if (editState) {
      commitEdit();
      return;
    }

    if (activeTool === "pan") {
      setIsDragging(false);
    } else if (activeTool === "draw_box" && isDrawing) {
      setIsDrawing(false);
      if (currentBox && currentBox.w > 5 && currentBox.h > 5) {
        // ⚡ INSTANT Save - No waiting for backend!
        // The detection will sync to backend automatically in background
        onAddDetection({
            bbox_x1: currentBox.x,
            bbox_y1: currentBox.y,
            bbox_x2: currentBox.x + currentBox.w,
            bbox_y2: currentBox.y + currentBox.h,
            class_name: selectedClass || "Manual_Item", // Use selected class
            confidence: 1.0,
            is_manual: true,
            is_edited: false,
        });
      }
      setCurrentBox(null);
    }
  };

  // 4. Loading from Cloud State
  if (isInitialLoading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-zinc-950">
        <div className="text-center text-zinc-400 p-4">
          <div className="mb-6">
            <div className="animate-spin h-16 w-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
          <p className="mb-2 text-lg font-medium text-white">
            Loading Canvas
          </p>
        </div>
      </div>
    );
  }

  // 5. Uploading State
  if (isUploading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-zinc-950">
        <div className="text-center text-zinc-400 p-4">
          <div className="mb-6">
            <div className="animate-spin h-16 w-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
          <p className="mb-2 text-lg font-medium text-white">
            Uploading PDF...
          </p>
          <p className="text-sm text-zinc-500">Please wait while we process your file</p>
        </div>
      </div>
    );
  }

  // 6. Empty State
  if (!activePage) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-zinc-950">
        <div className="text-center text-zinc-400 p-4">
          <div className="mb-6 relative w-24 h-24 mx-auto">
            {/* Cloud Shape */}
            <svg 
              className="w-24 h-24" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M18.944 11.112C18.507 7.67 15.56 5 12 5 9.244 5 6.85 6.611 5.757 9.15 3.609 9.792 2 11.82 2 14c0 2.757 2.243 5 5 5h11c2.206 0 4-1.794 4-4a4.01 4.01 0 0 0-3.056-3.888z" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="animate-pulse"
                style={{ animationDuration: '3s' }}
              />
            </svg>
            {/* Bouncing Arrow - Positioned separately for correct animation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg 
                className="w-8 h-8 animate-bounce mt-2" 
                viewBox="0 0 24 24" 
                fill="none"
                style={{ animationDuration: '1.5s' }}
              >
                <path 
                  d="M12 4v12M12 4l-4 4M12 4l4 4" 
                  stroke="#3b82f6" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <p className="mb-2 text-lg font-medium">No Page Selected</p>
          <button onClick={onUpload} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium">
            Upload PDF
          </button>
        </div>
      </div>
    );
  }

  // Prevent right-click context menu on canvas
  const handleContextMenu = (e) => {
    e.preventDefault();
    return false;
  };

  // Prevent drag start on canvas elements
  const handleDragStart = (e) => {
    e.preventDefault();
    return false;
  };

  const selectedDetection = selectedId
    ? pageDetections.find(d => d.id === selectedId)
    : null;

  const orderedDetections = selectedDetection
    ? [...pageDetections.filter(d => d.id !== selectedId), selectedDetection]
    : pageDetections;

  const handleSize = 8 / scale;
  const handleOffset = handleSize / 2;

  // 7. Render Canvas
  return (
    <div 
      ref={canvasContainerRef}
      className="h-full w-full overflow-hidden bg-zinc-900 relative"
      style={{ 
        cursor: activeTool === 'pan' ? (isDragging ? 'grabbing' : 'grab') : activeTool === 'draw_box' ? 'crosshair' : 'default',
        touchAction: 'none', // Prevent browser gestures
        userSelect: 'none',  // Prevent text selection
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
    >
      <div
        ref={containerRef}
        className="absolute origin-top-left"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transition: isDragging || isDrawing ? 'none' : 'transform 75ms ease-out',
          width: activePage.width,
          height: activePage.height
        }}
      >
        {/* The PDF Image - Protected from drag/save/select */}
        <img 
          src={activePage.image_url} 
          alt="Blueprint" 
          className="pointer-events-none select-none"
          style={{ 
            maxWidth: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            WebkitUserDrag: 'none',
            WebkitTouchCallout: 'none',
          }}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        />

        {/* The Annotation Overlay */}
        <svg 
            className="absolute top-0 left-0 w-full h-full"
            style={{ pointerEvents: activeTool === 'draw_box' ? 'none' : 'auto' }}
        >
            {/* Existing Detections */}
            {orderedDetections.map((det) => {
                const displayBox =
                    editState?.id === det.id && editState?.currentBox
                        ? editState.currentBox
                        : det;
                const colors = getDetectionColors(det);
                const isSelected = activeTool === "select" && selectedId === det.id;

                return (
                    <g
                        key={det.id}
                        className={activeTool === "select" ? "cursor-move" : "cursor-pointer"}
                        onMouseDown={(e) => startMoveEdit(e, det)}
                    >
                        <rect
                            x={displayBox.bbox_x1}
                            y={displayBox.bbox_y1}
                            width={displayBox.bbox_x2 - displayBox.bbox_x1}
                            height={displayBox.bbox_y2 - displayBox.bbox_y1}
                            fill={colors.fill}
                            stroke={colors.stroke}
                            strokeWidth={2 / scale}
                            vectorEffect="non-scaling-stroke"
                        />
                        <text
                            x={displayBox.bbox_x1}
                            y={displayBox.bbox_y1 - 5}
                            fill={colors.text}
                            fontSize={14 / scale}
                            fontWeight="bold"
                            pointerEvents="none"
                        >
                            {det.class_name} ({Math.round(det.confidence * 100)}%)
                        </text>
                        {isSelected && (
                            <>
                                {[
                                    { id: "nw", x: displayBox.bbox_x1, y: displayBox.bbox_y1, cursor: "nwse-resize" },
                                    { id: "ne", x: displayBox.bbox_x2, y: displayBox.bbox_y1, cursor: "nesw-resize" },
                                    { id: "se", x: displayBox.bbox_x2, y: displayBox.bbox_y2, cursor: "nwse-resize" },
                                    { id: "sw", x: displayBox.bbox_x1, y: displayBox.bbox_y2, cursor: "nesw-resize" },
                                ].map(handle => (
                                    <rect
                                        key={handle.id}
                                        x={handle.x - handleOffset}
                                        y={handle.y - handleOffset}
                                        width={handleSize}
                                        height={handleSize}
                                        fill="#f8fafc"
                                        stroke="#0f172a"
                                        strokeWidth={1 / scale}
                                        vectorEffect="non-scaling-stroke"
                                        onMouseDown={(e) => startResizeEdit(e, det, handle.id)}
                                        style={{ cursor: handle.cursor }}
                                    />
                                ))}
                            </>
                        )}
                        {/* Delete Button (Visible on Hover) */}
                        {activeTool === 'eraser' && (
                            <rect
                                x={displayBox.bbox_x1}
                                y={displayBox.bbox_y1}
                                width={displayBox.bbox_x2 - displayBox.bbox_x1}
                                height={displayBox.bbox_y2 - displayBox.bbox_y1}
                                fill="rgba(239, 68, 68, 0.4)"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteDetection(det.id);
                                }}
                                className="cursor-pointer hover:fill-red-500/60"
                            />
                        )}
                    </g>
                );
            })}

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
      
      {/* HUD Info & Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        <div className="bg-zinc-900/90 rounded border border-zinc-800 flex items-center">
          <button 
            onClick={() => setScale(s => Math.max(MIN_ZOOM, s / 1.2))}
            className="px-2 py-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-l transition-colors"
            title="Zoom Out"
          >
            −
          </button>
          <span className="px-2 py-1 text-xs text-zinc-400 min-w-[50px] text-center border-x border-zinc-800">
            {Math.round(scale * 100)}%
          </span>
          <button 
            onClick={() => setScale(s => Math.min(MAX_ZOOM, s * 1.2))}
            className="px-2 py-1 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Zoom In"
          >
            +
          </button>
          <button 
            onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }}
            className="px-2 py-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-r border-l border-zinc-800 transition-colors text-xs"
            title="Reset View"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
