"""
Test script for tiled detection service.
Run this to test tiled detection on a sample image.
"""

from app.services.tiled_detection_service import TiledDetectionService
from PIL import Image
import sys

# Allow loading very large images
Image.MAX_IMAGE_PIXELS = None  # Remove decompression bomb warning


def test_tiled_detection(image_path: str):
    """
    Test tiled detection on an image.
    
    Usage:
        python test_tiled_detection.py path/to/image.png
    """
    print(f"🔍 Loading image: {image_path}")
    
    try:
        image = Image.open(image_path)
        print(f"✅ Image loaded: {image.size[0]}x{image.size[1]} pixels")
    except Exception as e:
        print(f"❌ Failed to load image: {e}")
        return
    
    # Initialize tiled detection service
    print("\n🤖 Initializing tiled detection service...")
    service = TiledDetectionService("best.pt")
    
    # Run detection
    print("🔲 Running tiled detection...")
    detections = service.detect_with_tiling(image, confidence=0.25)
    
    print(f"\n✅ Detection complete!")
    print(f"📊 Found {len(detections)} detections")
    
    # Display results
    if detections:
        print("\n📋 Detection Summary:")
        class_counts = {}
        for det in detections:
            class_name = det['class_name']
            class_counts[class_name] = class_counts.get(class_name, 0) + 1
        
        for class_name, count in sorted(class_counts.items()):
            print(f"   • {class_name}: {count}")
        
        print("\n🔍 Sample detections:")
        for i, det in enumerate(detections[:5]):
            print(f"   {i+1}. {det['class_name']} - confidence: {det['confidence']:.2f}")
            print(f"      bbox: ({det['bbox_x1']:.1f}, {det['bbox_y1']:.1f}, {det['bbox_x2']:.1f}, {det['bbox_y2']:.1f})")
    else:
        print("\n⚠️  No detections found")
    
    # Optional: Visualize results
    visualize = input("\n💾 Save visualization? (y/n): ").lower() == 'y'
    if visualize:
        output_path = image_path.rsplit('.', 1)[0] + '_detected.png'
        visualize_detections(image_path, detections, output_path)
        print(f"✅ Saved to: {output_path}")


def visualize_detections(image_path: str, detections: list, output_path: str):
    """Draw bounding boxes on image"""
    import cv2
    import numpy as np
    
    image = cv2.imread(image_path)
    
    # Color map for classes
    colors = {
        'supply_diffuser': (0, 255, 0),
        'return_grille': (255, 0, 0),
        'vav_box': (0, 0, 255),
        'fcu': (255, 255, 0),
        'exhaust_fan': (255, 0, 255),
    }
    
    for det in detections:
        x1 = int(det['bbox_x1'])
        y1 = int(det['bbox_y1'])
        x2 = int(det['bbox_x2'])
        y2 = int(det['bbox_y2'])
        
        color = colors.get(det['class_name'], (128, 128, 128))
        cv2.rectangle(image, (x1, y1), (x2, y2), color, 2)
        
        label = f"{det['class_name']} {det['confidence']:.2f}"
        cv2.putText(image, label, (x1, y1 - 5),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
    
    cv2.imwrite(output_path, image)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_tiled_detection.py <image_path>")
        print("Example: python test_tiled_detection.py drawing.png")
        sys.exit(1)
    
    test_tiled_detection(sys.argv[1])
