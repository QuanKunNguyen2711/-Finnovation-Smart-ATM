import asyncio
import tempfile
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
from facenet_pytorch import MTCNN, InceptionResnetV1
import cv2
import numpy as np
import base64
import time
from io import BytesIO
from PIL import Image as PILImage
from PIL import Image
from scipy.spatial.distance import cosine
from passporteye import read_mrz
import pytesseract

from FaceDetection.constants import COUNTRY, DOB, EXPR_DATE, NAME, PASSPORT_NUM, SEX, SUR_NAME
from app.common.authentication import protected_route
from app.common.dependencies import AuthCredentialDepend

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

router = APIRouter()

mtcnn = MTCNN(keep_all=False, thresholds= [0.7, 0.7, 0.8])
resnet = InceptionResnetV1(pretrained='vggface2').eval()

consecutive_detections = {"count": 0, "last_time": None}
embeddings_store = {}
DETECTION_THRESHOLD = 3
class ImageInput(BaseModel):
    image: str
    target_size: tuple = (160, 160)  # Default size for FaceNet models


def decode_image(image_base64: str) -> np.ndarray:
    image_data = base64.b64decode(image_base64.split(",")[1])
    np_arr = np.frombuffer(image_data, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)


def encode_image(image: np.ndarray) -> str:
    pil_image = PILImage.fromarray(image)
    buffered = BytesIO()
    pil_image.save(buffered, format="JPEG")
    return base64.b64encode(buffered.getvalue()).decode()


def encode_image_to_base64(image: Image) -> str:
    buffered = BytesIO()
    image.save(buffered, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buffered.getvalue()).decode("utf-8")


def base64_to_image(image_base64: str):
    image_data = base64.b64decode(image_base64.split(",")[1])
    np_arr = np.frombuffer(image_data, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return img


def is_front_face(landmarks) -> bool:
    left_eye, right_eye = landmarks[0], landmarks[1]
    nose = landmarks[2]
    mouth_left, mouth_right = landmarks[3], landmarks[4]

    eye_line_tolerance = 0.05 
    if abs(left_eye[1] - right_eye[1]) / abs(left_eye[0] - right_eye[0]) > eye_line_tolerance:
        return False

    nose_center_tolerance = 0.1
    eye_center_x = (left_eye[0] + right_eye[0]) / 2
    if abs(nose[0] - eye_center_x) / abs(left_eye[0] - right_eye[0]) > nose_center_tolerance:
        return False

    mouth_line_tolerance = 0.1
    if abs(mouth_left[1] - mouth_right[1]) / abs(mouth_left[0] - mouth_right[0]) > mouth_line_tolerance:
        return False

    return True

@router.post("/detect-live-face")
@protected_route()
async def detect_face(image: ImageInput, CREDENTIALS: AuthCredentialDepend, CURRENT_USER=None):
    global consecutive_detections
    
    try:
        img = decode_image(image.image)
        boxes, probs, landmarks = mtcnn.detect(img, landmarks=True)

        if boxes is None or landmarks is None:
            consecutive_detections["count"] = 0
            return {"message": "No face detected"}
        
        for i, box in enumerate(boxes):
            if is_front_face(landmarks[i]):
                if consecutive_detections["count"] == 0:
                    consecutive_detections["last_time"] = time.time()
                    
                consecutive_detections["count"] += 1
                current_time = time.time()
                
                if current_time - consecutive_detections["last_time"] >= DETECTION_THRESHOLD:
                    x1, y1, x2, y2 = map(int, box)
                    cropped_face = img[y1:y2, x1:x2]
                    
                    pil_cropped_face = PILImage.fromarray(cropped_face)
                    resized_face = pil_cropped_face.resize(image.target_size, Image.Resampling.LANCZOS)
                    resized_face_np = np.array(resized_face)
                    cropped_face_encoded = encode_image(resized_face_np)
                    
                    img_cropped = mtcnn(img)
                    face_embedding = resnet(img_cropped.unsqueeze(0)).detach().numpy()
                    consecutive_detections["count"] = 0  # Reset after extracting embedding
                    
                    embeddings_store["live"] = face_embedding
                    
                    live_embedding = embeddings_store.get("live")
                    passport_embedding = embeddings_store.get("passport")

                    if live_embedding is None or passport_embedding is None:
                        return {"message": "Both embeddings are required"}

                    # Calculate cosine similarity or distance
                    similarity = 1 - cosine(live_embedding.squeeze(0), passport_embedding.squeeze(0))
                    
                    return {
                        "x": int(box[0]),
                        "y": int(box[1]),
                        "width": int(box[2] - box[0]),
                        "height": int(box[3] - box[1]),
                        "similarity": similarity,
                        "cropped_live_face": f"data:image/jpeg;base64,{cropped_face_encoded}",
                        "message": "Front face detected and embedding extracted"
                    }
                    
                return {
                    "x": int(box[0]),
                    "y": int(box[1]),
                    "width": int(box[2] - box[0]),
                    "height": int(box[3] - box[1]),
                    "message": "Front face detected, waiting for embedding extraction"
                }
                

            else:
                consecutive_detections["count"] = 0
                return {"message": "No front face detected"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
async def detect_passport_photo(image: str, target_size) -> str:
    img = decode_image(image)
    boxes, probs, landmarks = mtcnn.detect(img, landmarks=True)

    if boxes is None:
        return {"message": "No face detected"}

    box = boxes[0]

    x1, y1, x2, y2 = map(int, box)
    cropped_face = img[y1:y2, x1:x2]
    
    pil_cropped_face = PILImage.fromarray(cropped_face)
    resized_face = pil_cropped_face.resize(target_size, Image.Resampling.LANCZOS)
    resized_face_np = np.array(resized_face)
    cropped_face_encoded = encode_image(resized_face_np)
    
    # Extract embedding for the cropped face
    cropped_img = mtcnn(img)
    face_embedding = resnet(cropped_img.unsqueeze(0)).detach().numpy()
    
    embeddings_store["passport"] = face_embedding

    return f"data:image/jpeg;base64,{cropped_face_encoded}"

 
 
async def ocr_passport(image: str) -> dict:
    image = base64_to_image(image)
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as temp_file:
        temp_image_path = temp_file.name
        cv2.imwrite(temp_image_path, image)
        
    mrz = read_mrz(temp_image_path)
    if mrz:
        mrz_data = mrz.to_dict()
        return mrz_data
    else:
        print("MRZ not detected.")
    
            
    
@router.post("/extract-passport")
@protected_route()
async def extract_passport(image: ImageInput, CREDENTIALS: AuthCredentialDepend, CURRENT_USER=None):
    try:
        results = await asyncio.gather(detect_passport_photo(image.image, image.target_size), ocr_passport(image.image))
        base64_str_passport_photo = results[0]
        mrz_data = results[1]
        return {
            "cropped_passport_face": base64_str_passport_photo,
            "passport_detail": {
                PASSPORT_NUM: mrz_data.get(PASSPORT_NUM),
                NAME: mrz_data.get(NAME),
                SUR_NAME: mrz_data.get(SUR_NAME),
                SEX: mrz_data.get(SEX),
                DOB: mrz_data.get(DOB),
                COUNTRY: mrz_data.get(COUNTRY),
                EXPR_DATE: mrz_data.get(EXPR_DATE)
            }    
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
