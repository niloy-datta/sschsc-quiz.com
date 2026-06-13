import json
import os
import time
from typing import Any, Dict, List, Optional

import httpx
from google.auth.transport.requests import Request as GoogleAuthRequest
from google.oauth2 import service_account

from .config import settings

_SCOPES = ["https://www.googleapis.com/auth/datastore"]
_credentials: Optional[service_account.Credentials] = None
_token_cache: Dict[str, Any] = {"token": None, "expiry": 0.0}


def _project_id() -> str:
    if hasattr(settings, "GOOGLE_PROJECT_ID") and settings.GOOGLE_PROJECT_ID:
        return settings.GOOGLE_PROJECT_ID
    return os.getenv("FIREBASE_PROJECT_ID", "")


def _get_credentials() -> service_account.Credentials:
    global _credentials
    if _credentials is not None:
        return _credentials

    raw = os.getenv("FIREBASE_SERVICE_ACCOUNT", "").strip()
    if not raw:
        raise RuntimeError(
            "FIREBASE_SERVICE_ACCOUNT env is required for Firestore access"
        )

    info = json.loads(raw)
    _credentials = service_account.Credentials.from_service_account_info(
        info,
        scopes=_SCOPES,
    )
    return _credentials


def _auth_headers() -> dict:
    creds = _get_credentials()
    now = time.time()
    if not _token_cache["token"] or now >= float(_token_cache["expiry"]) - 300:
        creds.refresh(GoogleAuthRequest())
        _token_cache["token"] = creds.token
        if creds.expiry:
            _token_cache["expiry"] = creds.expiry.timestamp()
        else:
            _token_cache["expiry"] = now + 3600
    return {"Authorization": f"Bearer {_token_cache['token']}"}


# Helper: Convert flat Python dict to Firestore fields JSON
def to_firestore_fields(data: dict) -> dict:
    fields = {}
    for k, v in data.items():
        if isinstance(v, bool):
            fields[k] = {"booleanValue": v}
        elif isinstance(v, int):
            fields[k] = {"integerValue": str(v)}
        elif isinstance(v, float):
            fields[k] = {"doubleValue": v}
        elif isinstance(v, str):
            fields[k] = {"stringValue": v}
        elif isinstance(v, list):
            values = []
            for item in v:
                if isinstance(item, str):
                    values.append({"stringValue": item})
                elif isinstance(item, int):
                    values.append({"integerValue": str(item)})
            fields[k] = {"arrayValue": {"values": values}}
        elif v is None:
            fields[k] = {"nullValue": None}
    return {"fields": fields}


# Helper: Convert Firestore JSON response to flat Python dict
def from_firestore_document(doc: dict) -> dict:
    fields = doc.get("fields", {})
    data = {}
    name = doc.get("name", "")
    if name:
        data["id"] = name.split("/")[-1]

    for k, v in fields.items():
        if "stringValue" in v:
            data[k] = v["stringValue"]
        elif "integerValue" in v:
            data[k] = int(v["integerValue"])
        elif "doubleValue" in v:
            data[k] = float(v["doubleValue"])
        elif "booleanValue" in v:
            data[k] = v["booleanValue"]
        elif "nullValue" in v:
            data[k] = None
        elif "arrayValue" in v:
            values = v["arrayValue"].get("values", [])
            item_list = []
            for val in values:
                if "stringValue" in val:
                    item_list.append(val["stringValue"])
                elif "integerValue" in val:
                    item_list.append(int(val["integerValue"]))
            data[k] = item_list
    return data


# Firestore Operations
async def get_document(collection: str, doc_id: str) -> Optional[dict]:
    project_id = _project_id()
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/{collection}/{doc_id}"

    async with httpx.AsyncClient() as client:
        res = await client.get(url, headers=_auth_headers())
        if res.status_code == 200:
            return from_firestore_document(res.json())
        return None


async def create_document(collection: str, doc_id: str, data: dict) -> dict:
    return await update_document(collection, doc_id, data)


async def update_document(collection: str, doc_id: str, data: dict) -> dict:
    project_id = _project_id()
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/{collection}/{doc_id}"

    body = to_firestore_fields(data)
    async with httpx.AsyncClient() as client:
        res = await client.patch(url, json=body, headers=_auth_headers())
        if res.status_code == 200:
            return from_firestore_document(res.json())
        raise Exception(f"Failed to update document: {res.text}")


async def add_document(collection: str, data: dict) -> dict:
    project_id = _project_id()
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/{collection}"

    body = to_firestore_fields(data)
    async with httpx.AsyncClient() as client:
        res = await client.post(url, json=body, headers=_auth_headers())
        if res.status_code == 200:
            return from_firestore_document(res.json())
        raise Exception(f"Failed to add document: {res.text}")


async def run_query(
    collection: str,
    field: str,
    op: str,
    value: Any,
    order_by: str = None,
    limit: int = None,
) -> List[dict]:
    project_id = _project_id()
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents:runQuery"

    op_map = {
        "==": "EQUAL",
        ">": "GREATER_THAN",
        "<": "LESS_THAN",
        ">=": "GREATER_THAN_OR_EQUAL",
        "<=": "LESS_THAN_OR_EQUAL",
    }

    val_dict = {}
    if isinstance(value, bool):
        val_dict = {"booleanValue": value}
    elif isinstance(value, int):
        val_dict = {"integerValue": str(value)}
    elif isinstance(value, float):
        val_dict = {"doubleValue": value}
    else:
        val_dict = {"stringValue": str(value)}

    query = {
        "structuredQuery": {
            "from": [{"collectionId": collection}],
            "where": {
                "fieldFilter": {
                    "field": {"fieldPath": field},
                    "op": op_map.get(op, "EQUAL"),
                    "value": val_dict,
                }
            },
        }
    }

    if order_by:
        query["structuredQuery"]["orderBy"] = [
            {
                "field": {"fieldPath": order_by},
                "direction": "DESCENDING",
            }
        ]

    if limit:
        query["structuredQuery"]["limit"] = limit

    async with httpx.AsyncClient() as client:
        res = await client.post(url, json=query, headers=_auth_headers())
        if res.status_code != 200:
            return []

        results = res.json()
        documents = []
        for r in results:
            doc = r.get("document")
            if doc:
                documents.append(from_firestore_document(doc))
        return documents


async def delete_document(collection: str, doc_id: str) -> bool:
    project_id = _project_id()
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/{collection}/{doc_id}"

    async with httpx.AsyncClient() as client:
        res = await client.delete(url, headers=_auth_headers())
        return res.status_code == 200


async def get_all_documents(collection: str) -> List[dict]:
    project_id = _project_id()
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/{collection}"

    async with httpx.AsyncClient() as client:
        res = await client.get(url, headers=_auth_headers())
        if res.status_code == 200:
            docs = res.json().get("documents", [])
            return [from_firestore_document(d) for d in docs]
        return []


async def get_documents_at_path(collection_path: str) -> List[dict]:
    """List documents under a nested collection path, e.g. attempts/{userId}/runs."""
    project_id = _project_id()
    path = collection_path.strip("/")
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/{path}"

    async with httpx.AsyncClient() as client:
        res = await client.get(url, headers=_auth_headers())
        if res.status_code == 200:
            docs = res.json().get("documents", [])
            return [from_firestore_document(d) for d in docs]
        return []


TOP_100_COLLECTION = "leaderboards"
TOP_100_DOC_ID = "top_100"


async def get_top_100_leaderboard() -> Optional[dict]:
    """Single-document read for precomputed global top-100 (1 Firestore read)."""
    return await get_document(TOP_100_COLLECTION, TOP_100_DOC_ID)


async def set_top_100_leaderboard(data: dict) -> dict:
    """Upsert precomputed global top-100 (1 Firestore write)."""
    existing = await get_document(TOP_100_COLLECTION, TOP_100_DOC_ID)
    if existing is not None:
        return await update_document(TOP_100_COLLECTION, TOP_100_DOC_ID, data)

    project_id = _project_id()
    url = (
        f"https://firestore.googleapis.com/v1/projects/{project_id}"
        f"/databases/(default)/documents/{TOP_100_COLLECTION}"
        f"?documentId={TOP_100_DOC_ID}"
    )
    body = to_firestore_fields(data)
    async with httpx.AsyncClient() as client:
        res = await client.post(url, json=body, headers=_auth_headers())
        if res.status_code == 200:
            return from_firestore_document(res.json())
        raise Exception(f"Failed to create top_100 leaderboard: {res.text}")


async def try_create_document(collection: str, doc_id: str, data: dict) -> bool:
    """Create doc with fixed ID. Returns False if document already exists (409)."""
    project_id = _project_id()
    url = (
        f"https://firestore.googleapis.com/v1/projects/{project_id}"
        f"/databases/(default)/documents/{collection}"
        f"?documentId={doc_id}"
    )
    body = to_firestore_fields(data)
    async with httpx.AsyncClient() as client:
        res = await client.post(url, json=body, headers=_auth_headers())
        if res.status_code == 200:
            return True
        if res.status_code == 409:
            return False
        raise Exception(f"Failed to create document {collection}/{doc_id}: {res.text}")
