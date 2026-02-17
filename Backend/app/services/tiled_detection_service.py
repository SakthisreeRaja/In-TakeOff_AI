"""
Tiled YOLO Inference Service

Handles YOLO inference on large images by splitting into tiles,
detecting on each tile, and merging results with NMS.
"""
import numpy as np
import torch
from typing import List, Tuple, Dict
import cv2
from PIL import Image
import logging

logger = logging.getLogger(__name__)

# Patch torch.load to support older YOLO models (PyTorch 2.6 compatibility)
_original_load = torch.load
def safe_load(*args, **kwargs):
    if "weights_only" not in kwargs:
        kwargs["weights_only"] = False
    return _original_load(*args, **kwargs)
torch.load = safe_load

from ultralytics import YOLO
from ultralytics.nn.modules.head import Detect, OBB, Pose, Segment


def _patch_yolo_heads(model):
    """Patch older OBB/Segment/Pose heads missing the `detect` attribute."""
    torch_model = getattr(model, "model", None)
    if torch_model is None:
        return False
    patched = False
    for module in torch_model.modules():
        if isinstance(module, (OBB, Segment, Pose)) and not hasattr(module, "detect"):
            module.detect = Detect.forward
            patched = True
    return patched


class TiledDetectionService:
    """
    Handles YOLO inference on large images by splitting into tiles,
    detecting on each tile, and merging results with NMS.
    """
    
    def __init__(self, model_path: str = "best.pt"):
        """Initialize YOLO model"""
        try:
            self.model = YOLO(model_path)
            
            # Patch YOLO heads for compatibility
            if _patch_yolo_heads(self.model):
                logger.info("✅ Patched YOLO head modules missing 'detect' attribute.")
            
            logger.info(f"✅ Tiled detection model loaded: {model_path}")
        except Exception as e:
            logger.error(f"❌ Failed to load model: {e}")
            self.model = None
        
        # Configuration
        self.tile_grid = (2, 4)  # 2 rows x 4 columns = 8 tiles
        self.overlap_ratio = 0.1  # 10% overlap between tiles
        self.nms_iou_threshold = 0.5  # IoU threshold for duplicate removal
        self.confidence_threshold = 0.25
    
    
    def detect_with_tiling(
        self, 
        image: Image.Image,
        confidence: float = None
    ) -> List[Dict]:
        """
        Main method: Split image into tiles, detect, and merge results.
        
        Args:
            image: PIL Image object
            confidence: Detection confidence threshold (optional)
            
        Returns:
            List of detections with pixel coordinates matching YOLO output format
        """
        if self.model is None:
            raise RuntimeError("YOLO model not loaded")
        
        conf_threshold = confidence or self.confidence_threshold
        
        # Convert PIL to numpy array (OpenCV format)
        image_np = np.array(image)
        if len(image_np.shape) == 2:  # Grayscale
            image_np = cv2.cvtColor(image_np, cv2.COLOR_GRAY2RGB)
        elif image_np.shape[2] == 4:  # RGBA
            image_np = cv2.cvtColor(image_np, cv2.COLOR_RGBA2RGB)
        
        img_height, img_width = image_np.shape[:2]
        
        # Step 1: Generate tiles with overlap
        tiles = self._generate_tiles(image_np, img_width, img_height)
        
        logger.info(f"🔲 Generated {len(tiles)} tiles from {img_width}x{img_height} image")
        
        # Step 2: Run inference on each tile
        all_detections = []
        
        for tile_info in tiles:
            tile_image = tile_info['image']
            tile_offset = tile_info['offset']  # (x_offset, y_offset)
            
            # Run YOLO on this tile
            results = self.model(
                tile_image,
                conf=conf_threshold,
                verbose=False
            )
            
            # Convert to absolute coordinates in original image
            tile_detections = self._process_tile_results(
                results[0],
                tile_offset,
                img_width,
                img_height
            )
            
            all_detections.extend(tile_detections)
        
        logger.info(f"📦 Total detections before NMS: {len(all_detections)}")
        
        # Step 3: Remove duplicates using NMS
        merged_detections = self._merge_detections_nms(all_detections)
        
        logger.info(f"✅ Final detections after NMS: {len(merged_detections)}")
        
        return merged_detections
    
    
    def _generate_tiles(
        self, 
        image: np.ndarray,
        img_width: int,
        img_height: int
    ) -> List[Dict]:
        """
        Split image into overlapping tiles.
        
        Returns:
            List of dicts with 'image' and 'offset' (x, y)
        """
        rows, cols = self.tile_grid
        
        # Calculate tile dimensions with overlap
        tile_width = img_width // cols
        tile_height = img_height // rows
        
        overlap_x = int(tile_width * self.overlap_ratio)
        overlap_y = int(tile_height * self.overlap_ratio)
        
        tiles = []
        
        for row in range(rows):
            for col in range(cols):
                # Calculate tile boundaries with overlap
                x_start = max(0, col * tile_width - overlap_x)
                y_start = max(0, row * tile_height - overlap_y)
                
                x_end = min(img_width, (col + 1) * tile_width + overlap_x)
                y_end = min(img_height, (row + 1) * tile_height + overlap_y)
                
                # Extract tile
                tile_image = image[y_start:y_end, x_start:x_end]
                
                tiles.append({
                    'image': tile_image,
                    'offset': (x_start, y_start),
                    'tile_id': f"tile_{row}_{col}"
                })
        
        return tiles
    
    
    def _process_tile_results(
        self,
        result,
        tile_offset: Tuple[int, int],
        img_width: int,
        img_height: int
    ) -> List[Dict]:
        """
        Convert tile detections to original image coordinates (pixels).
        
        Args:
            result: YOLO result for one tile
            tile_offset: (x_offset, y_offset) of tile in original image
            img_width: Original image width
            img_height: Original image height
            
        Returns:
            List of detections with pixel coordinates
        """
        detections = []
        x_offset, y_offset = tile_offset
        
        if result.boxes is None or len(result.boxes) == 0:
            return detections
        
        for box in result.boxes:
            # Get box in tile coordinates (pixels)
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
            
            # Convert to original image coordinates (pixels)
            abs_x1 = float(x1 + x_offset)
            abs_y1 = float(y1 + y_offset)
            abs_x2 = float(x2 + x_offset)
            abs_y2 = float(y2 + y_offset)
            
            detections.append({
                'bbox_x1': abs_x1,
                'bbox_y1': abs_y1,
                'bbox_x2': abs_x2,
                'bbox_y2': abs_y2,
                'confidence': float(box.conf[0]),
                'class_id': int(box.cls[0]),
                'class_name': result.names[int(box.cls[0])],
                # Keep for NMS
                '_abs_coords': [abs_x1, abs_y1, abs_x2, abs_y2]
            })
        
        return detections
    
    
    def _merge_detections_nms(
        self, 
        detections: List[Dict]
    ) -> List[Dict]:
        """
        Remove duplicate detections using Non-Maximum Suppression.
        
        Detections from overlapping tiles may detect the same object twice.
        NMS keeps the detection with highest confidence.
        """
        if not detections:
            return []
        
        # Group by class
        class_groups = {}
        for det in detections:
            class_id = det['class_id']
            if class_id not in class_groups:
                class_groups[class_id] = []
            class_groups[class_id].append(det)
        
        # Apply NMS per class
        final_detections = []
        
        for class_id, dets in class_groups.items():
            # Convert to numpy arrays for NMS
            boxes = np.array([d['_abs_coords'] for d in dets])
            scores = np.array([d['confidence'] for d in dets])
            
            # Apply NMS
            keep_indices = self._nms(boxes, scores, self.nms_iou_threshold)
            
            # Keep only non-duplicate detections
            for idx in keep_indices:
                det = dets[idx].copy()
                # Remove temporary absolute coords
                del det['_abs_coords']
                final_detections.append(det)
        
        return final_detections
    
    
    def _nms(
        self, 
        boxes: np.ndarray, 
        scores: np.ndarray, 
        iou_threshold: float
    ) -> List[int]:
        """
        Non-Maximum Suppression implementation.
        
        Args:
            boxes: Array of [x1, y1, x2, y2] boxes
            scores: Confidence scores
            iou_threshold: IoU threshold for suppression
            
        Returns:
            Indices of boxes to keep
        """
        if len(boxes) == 0:
            return []
        
        x1 = boxes[:, 0]
        y1 = boxes[:, 1]
        x2 = boxes[:, 2]
        y2 = boxes[:, 3]
        
        areas = (x2 - x1) * (y2 - y1)
        order = scores.argsort()[::-1]  # Sort by confidence (descending)
        
        keep = []
        
        while order.size > 0:
            i = order[0]
            keep.append(i)
            
            # Calculate IoU with remaining boxes
            xx1 = np.maximum(x1[i], x1[order[1:]])
            yy1 = np.maximum(y1[i], y1[order[1:]])
            xx2 = np.minimum(x2[i], x2[order[1:]])
            yy2 = np.minimum(y2[i], y2[order[1:]])
            
            w = np.maximum(0, xx2 - xx1)
            h = np.maximum(0, yy2 - yy1)
            
            intersection = w * h
            iou = intersection / (areas[i] + areas[order[1:]] - intersection)
            
            # Keep boxes with IoU less than threshold
            inds = np.where(iou <= iou_threshold)[0]
            order = order[inds + 1]
        
        return keep
