export const ANNOTATION_CLASS_OPTIONS = [
  { value: "AHU", label: "AHU" },
  { value: "Exhaust Fan", label: "Exhaust Fan" },
  { value: "Exhaust Grille", label: "Exhaust Grille" },
  { value: "Linear Diffuser -Supply-", label: "Linear Diffuser" },
  { value: "Return Diffuser", label: "Return Diffuser" },
  { value: "Return Grille", label: "Return Grille" },
  { value: "Supply Diffuser", label: "Supply Diffuser" },
  { value: "VAV_FCU", label: "VAV_FCU" },
]

const classLabelMap = Object.fromEntries(
  ANNOTATION_CLASS_OPTIONS.map(option => [option.value, option.label])
)

// Class-based color scheme with opacity 0.2 (AHU: 0.35 for better visibility)
export const CLASS_COLORS = {
  "AHU": { fill: "rgba(183, 222, 232, 0.35)", stroke: "#B7DEE8", hex: "#B7DEE8" },
  "Exhaust Fan": { fill: "rgba(102, 153, 255, 0.2)", stroke: "#6699FF", hex: "#6699FF" },
  "Exhaust Grille": { fill: "rgba(255, 0, 0, 0.2)", stroke: "#FF0000", hex: "#FF0000" },
  "Linear Diffuser -Supply-": { fill: "rgba(255, 255, 0, 0.2)", stroke: "#FFFF00", hex: "#FFFF00" },
  "Return Diffuser": { fill: "rgba(255, 128, 0, 0.2)", stroke: "#FF8000", hex: "#FF8000" },
  "Return Grille": { fill: "rgba(255, 128, 0, 0.2)", stroke: "#FF8000", hex: "#FF8000" },
  "Supply Diffuser": { fill: "rgba(0, 0, 255, 0.2)", stroke: "#0000FF", hex: "#0000FF" },
  "VAV_FCU": { fill: "rgba(128, 64, 0, 0.2)", stroke: "#804000", hex: "#804000" },
}

export function getClassColor(className) {
  return CLASS_COLORS[className] || { fill: "rgba(156, 163, 175, 0.2)", stroke: "#9ca3af", hex: "#9ca3af" }
}

export const INITIAL_ANNOTATION_FILTERS = Object.fromEntries(
  ANNOTATION_CLASS_OPTIONS.map(option => [option.value, true])
)

export function getAnnotationClassLabel(className) {
  return classLabelMap[className] || className
}
