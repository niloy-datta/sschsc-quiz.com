import os
import httpx
from typing import Any, Dict, List, Optional
from .config import settings

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
    project_id = settings.GOOGLE_PROJECT_ID if hasattr(settings, "GOOGLE_PROJECT_ID") else os.getenv("FIREBASE_PROJECT_ID", "")
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/{collection}/{doc_id}"
    
    async with httpx.AsyncClient() as client:
        res = await client.get(url)
        if res.status_code == 200:
            return from_firestore_document(res.json())
        return None

async def create_document(collection: str, doc_id: str, data: dict) -> dict:
    return await update_document(collection, doc_id, data)


async def update_document(collection: str, doc_id: str, data: dict) -> dict:
    project_id = settings.GOOGLE_PROJECT_ID if hasattr(settings, "GOOGLE_PROJECT_ID") else os.getenv("FIREBASE_PROJECT_ID", "")
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/{collection}/{doc_id}"

    body = to_firestore_fields(data)
    async with httpx.AsyncClient() as client:
        res = await client.patch(url, json=body)
        if res.status_code == 200:
            return from_firestore_document(res.json())
        raise Exception(f"Failed to update document: {res.text}")

async def add_document(collection: str, data: dict) -> dict:
    project_id = settings.GOOGLE_PROJECT_ID if hasattr(settings, "GOOGLE_PROJECT_ID") else os.getenv("FIREBASE_PROJECT_ID", "")
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/{collection}"
    
    body = to_firestore_fields(data)
    async with httpx.AsyncClient() as client:
        res = await client.post(url, json=body)
        if res.status_code == 200:
            return from_firestore_document(res.json())
        else:
            raise Exception(f"Failed to add document: {res.text}")

async def run_query(collection: str, field: str, op: str, value: Any, order_by: str = None, limit: int = None) -> List[dict]:
    project_id = settings.GOOGLE_PROJECT_ID if hasattr(settings, "GOOGLE_PROJECT_ID") else os.getenv("FIREBASE_PROJECT_ID", "")
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
                    "value": val_dict
                }
            }
        }
    }
    
    if order_by:
        query["structuredQuery"]["orderBy"] = [
            {
                "field": {"fieldPath": order_by},
                "direction": "DESCENDING"
            }
        ]
        
    if limit:
        query["structuredQuery"]["limit"] = limit
        
    async with httpx.AsyncClient() as client:
        res = await client.post(url, json=query)
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
    project_id = settings.GOOGLE_PROJECT_ID if hasattr(settings, "GOOGLE_PROJECT_ID") else os.getenv("FIREBASE_PROJECT_ID", "")
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/{collection}/{doc_id}"
    
    async with httpx.AsyncClient() as client:
        res = await client.delete(url)
        return res.status_code == 200


async def get_all_documents(collection: str) -> List[dict]:
    project_id = settings.GOOGLE_PROJECT_ID if hasattr(settings, "GOOGLE_PROJECT_ID") else os.getenv("FIREBASE_PROJECT_ID", "")
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/{collection}"
    
    async with httpx.AsyncClient() as client:
        res = await client.get(url)
        if res.status_code == 200:
            docs = res.json().get("documents", [])
            return [from_firestore_document(d) for d in docs]
        return []

