from typing import List
from pydantic import BaseModel, Field

class ModelSchema(BaseModel):
    name: str
    description: str
    dataset_obj_id: str
    dataset_obj_id_str: str
    hidden_size: int = 64
    batch_size: int = 64
    num_epochs: int = 30
    
class PreprocessSchema(BaseModel):
    dest_obj_id: str
    dest_obj_id_str: str
    src_obj_id_str: str
    features: List[str]
    label: str
    field_mapping: dict
    
class InferenceSchema(BaseModel):
    text: str
    model_id: str