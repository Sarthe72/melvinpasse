import io
from pathlib import Path
from uuid import uuid4

from PIL import Image, UnidentifiedImageError

FORMATS = {"PNG": ".png", "JPEG": ".jpg", "WEBP": ".webp"}


def validate_image_upload(file_storage):
    if not file_storage or not file_storage.filename:
        raise ValueError("Logo requis")
    payload = file_storage.read()
    try:
        with Image.open(io.BytesIO(payload)) as image:
            image.verify()
            extension = FORMATS.get(image.format)
    except (UnidentifiedImageError, OSError) as exc:
        raise ValueError("Le logo doit être une image PNG, JPEG ou WebP valide") from exc
    if extension is None:
        raise ValueError("Format de logo non pris en charge")
    return payload, extension


def save_logo(payload, extension, upload_root, application_id):
    folder = Path(upload_root) / application_id
    folder.mkdir(parents=True, exist_ok=True)
    filename = f"logo-{uuid4().hex}{extension}"
    (folder / filename).write_bytes(payload)
    return filename
