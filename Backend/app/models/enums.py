from enum import Enum

class ProjectStatus(str, Enum):
    draft = "draft"
    processing = "processing"
    complete = "complete"
    archived = "archived"
