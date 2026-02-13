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

export const INITIAL_ANNOTATION_FILTERS = Object.fromEntries(
  ANNOTATION_CLASS_OPTIONS.map(option => [option.value, true])
)

export function getAnnotationClassLabel(className) {
  return classLabelMap[className] || className
}
