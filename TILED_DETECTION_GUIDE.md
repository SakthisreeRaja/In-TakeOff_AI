# Tiled Detection Implementation

## 🎯 Overview

Tiled detection splits large HVAC drawings into smaller tiles (2x4 grid = 8 tiles), runs YOLO inference on each tile, and merges results with NMS to remove duplicates.

## ✅ What Was Added

### 1. **New Service: `tiled_detection_service.py`**
- Splits images into 8 tiles with 10% overlap
- Runs YOLO on each tile independently
- Maps coordinates back to original image
- Removes duplicate detections using NMS

### 2. **Updated: `pdf_service.py`**
- Added `generate_detections_tiled()` method
- Uses TiledDetectionService for inference
- Saves results in same format as original method

### 3. **Updated: `detection_service.py`**
- Added `use_tiling` parameter to `run_detection_for_page()`
- Defaults to `True` for better accuracy

### 4. **Updated: `detections.py` (API)**
- Added `use_tiling` query parameter
- Endpoint: `POST /api/detections/run/{page_id}?use_tiling=true`

---

## 🚀 Usage

### **API Request**

```bash
# Use tiled detection (recommended)
POST /api/detections/run/{page_id}?use_tiling=true

# Use original full-image detection
POST /api/detections/run/{page_id}?use_tiling=false

# Default (uses tiled)
POST /api/detections/run/{page_id}
```

### **Response**

```json
{
  "message": "Detection completed",
  "page_id": "abc123",
  "detections_count": 42,
  "method": "tiled",
  "detections": [...]
}
```

---

## 🧪 Testing

### **Test with Python Script**

```bash
cd Backend
python test_tiled_detection.py path/to/large_hvac_drawing.png
```

This will:
1. Load your image
2. Run tiled detection
3. Show detection counts by class
4. Optionally save visualization

### **Test via API**

```bash
# Start the server
uvicorn app.main:app --reload

# Trigger detection on a page
curl -X POST "http://localhost:8000/api/detections/run/PAGE_ID?use_tiling=true"
```

---

## ⚙️ Configuration

Edit `tiled_detection_service.py` to customize:

```python
class TiledDetectionService:
    def __init__(self, model_path: str = "best.pt"):
        # Tile grid (rows, cols)
        self.tile_grid = (2, 4)  # 8 tiles
        
        # Overlap between tiles (prevents boundary issues)
        self.overlap_ratio = 0.1  # 10%
        
        # NMS threshold for duplicate removal
        self.nms_iou_threshold = 0.5
        
        # Detection confidence
        self.confidence_threshold = 0.25
```

### **Tuning Tips**

- **More tiles** (e.g., `(3, 3)` or `(4, 4)`): Better for very large images, but slower
- **More overlap** (e.g., `0.15`): Catches more boundary objects, but more duplicates to filter
- **Lower NMS threshold** (e.g., `0.4`): More aggressive duplicate removal
- **Higher confidence** (e.g., `0.35`): Fewer but more confident detections

---

## 🎨 Frontend Integration

No changes needed! The frontend works exactly the same because:
- Detections are stored in the same database format
- Coordinates are in pixels (same as before)
- API response structure is identical

---

## 📊 Expected Improvements

✅ **Better Accuracy**: Tiles match YOLO training image size  
✅ **No Missing Detections**: Overlap catches boundary objects  
✅ **No Duplicates**: NMS removes overlapping detections  
✅ **handles Large Images**: Memory-efficient tile processing  

---

## 🐛 Troubleshooting

### **Issue: "YOLO model not loaded"**
- Check that `best.pt` exists in Backend directory
- Verify model path in environment variables

### **Issue: Too many duplicates**
- Lower `nms_iou_threshold` (more aggressive filtering)
- Reduce `overlap_ratio`

### **Issue: Missing detections at tile boundaries**
- Increase `overlap_ratio` (e.g., to 0.15 or 0.2)
- Check that objects aren't too small

### **Issue: Slow performance**
- Reduce number of tiles (e.g., `(2, 3)` instead of `(2, 4)`)
- Reduce overlap ratio
- Lower image resolution before detection

---

## 📝 Files Modified

```
Backend/
├── app/
│   ├── api/
│   │   └── detections.py          ✏️ Updated (added use_tiling param)
│   └── services/
│       ├── tiled_detection_service.py  ✨ NEW
│       ├── pdf_service.py         ✏️ Updated (added tiled method)
│       └── detection_service.py   ✏️ Updated (added tiling support)
└── test_tiled_detection.py        ✨ NEW (test script)
```

---

## 🎯 Next Steps

1. **Test on your HVAC drawings**
   ```bash
   python test_tiled_detection.py your_drawing.png
   ```

2. **Compare results**: Run with `use_tiling=true` and `use_tiling=false` to see the difference

3. **Tune parameters** if needed based on your specific drawings

4. **Deploy** when satisfied with results

---

## 📞 Support

If you encounter issues:
1. Check the logs for errors
2. Verify model is loaded correctly
3. Test with a smaller image first
4. Adjust tiling parameters as needed
