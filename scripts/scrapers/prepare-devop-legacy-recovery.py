#!/usr/bin/env python3
"""Prepare, but never submit, the retained Devop Sale observations for recovery.

The input JSON and workbook stay untouched.  This tool creates a deterministic
normalised observation set, a source-ID keyed geography manifest, a qualification
CSV, and a summary.  It does not contact Supabase or invoke canonical RPCs.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import unicodedata
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

NS = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
TYPE_MAP = {
    "Casa": "House", "Casa de Playa": "House", "Casa de Campo": "House",
    "Lote": "Land", "Terreno": "Land", "Lote Comercial": "Land",
    "Apartamento": "Condo", "Apartaestudio": "Condo", "Finca": "Farm",
    "Campos, Chacras y Quintas": "Farm", "Local": "Commercial Property",
    "Edificio": "Commercial Property", "Oficina": "Commercial Property", "Cabaña": "Cabin",
}

def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def clean(value: object) -> str:
    return str(value or "").strip()

def norm(value: object) -> str:
    text = unicodedata.normalize("NFD", clean(value)).encode("ascii", "ignore").decode().lower()
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s]", " ", text)).strip()

def aliases(term: dict) -> set[str]:
    return {norm(term.get(key)) for key in ("term_name", "term_name_en", "term_name_es", "slug", "slug_en", "slug_es")} - {""}

def source_aliases(value: object, kind: str) -> set[str]:
    result = {norm(value)} - {""}
    if kind == "province": result |= {re.sub(r"\bprovincia\b", "", item).strip() for item in result}
    if kind == "canton": result |= {re.sub(r"\b(canton|capital)\b", "", item).strip() for item in result}
    if kind == "district": result |= {re.sub(r"\bcentro\b", "", item).strip() for item in result}
    return result - {""}

def matches(value: object, terms: list[dict], kind: str, parent: object | None = None) -> list[dict]:
    wanted = source_aliases(value, kind)
    return [term for term in terms if (parent is None or str(term.get("parent_id")) == str(parent)) and wanted & aliases(term)]

def read_workbook(path: Path) -> dict[str, dict]:
    with zipfile.ZipFile(path) as book:
        strings = []
        if "xl/sharedStrings.xml" in book.namelist():
            root = ET.fromstring(book.read("xl/sharedStrings.xml"))
            strings = ["".join(node.text or "" for node in item.findall(".//x:t", NS)) for item in root.findall("x:si", NS)]
        sheet = next(name for name in book.namelist() if name.startswith("xl/worksheets/sheet") and name.endswith(".xml"))
        root = ET.fromstring(book.read(sheet))
    rows = []
    for row in root.findall(".//x:sheetData/x:row", NS):
        values = {}
        for cell in row.findall("x:c", NS):
            column = "".join(letter for letter in cell.attrib["r"] if letter.isalpha())
            node = cell.find("x:v", NS)
            value = "" if node is None else node.text or ""
            values[column] = strings[int(value)] if cell.attrib.get("t") == "s" and value else value
        rows.append(values)
    headers = rows[0]
    records = [{headers.get(key, key): value for key, value in row.items()} for row in rows[1:]]
    return {clean(row.get("Código")): row for row in records if clean(row.get("Código"))}

def measurement(value: object) -> bool:
    return bool(re.fullmatch(r"\d+(?:[.,]\d+)?\s*m(?:²|2)", clean(value), flags=re.I))

def map_geography(source: dict, terms: list[dict]) -> tuple[dict, str]:
    provinces = [term for term in terms if term.get("term_type") == "province"]
    cantons = [term for term in terms if term.get("term_type") == "canton"]
    districts = [term for term in terms if term.get("term_type") == "district"]
    province_value, city_value = source.get("Estado / Departamento"), source.get("Ciudad")
    pm = matches(province_value, provinces, "province")
    province = pm[0] if len(pm) == 1 else None
    parent_cantons = [term for term in cantons if province and str(term.get("parent_id")) == str(province.get("id"))]
    parent_districts = [term for term in districts if any(str(canton.get("id")) == str(term.get("parent_id")) for canton in parent_cantons)]
    dm = matches(city_value, parent_districts, "district") if province else []
    cm = matches(city_value, parent_cantons, "canton") if province else []
    all_district_matches = matches(city_value, districts, "district")
    manifest = {
        "source_province": province_value or None, "source_city": city_value or None,
        "source_map_option": source.get("Opciones mapa") or None,
        "province": None, "canton": None, "district": None,
        "candidate_count": len(dm), "cross_province_district_match_count": len(all_district_matches),
    }
    if province and len(dm) == 1:
        district = dm[0]
        canton = next((term for term in parent_cantons if str(term.get("id")) == str(district.get("parent_id"))), None)
        if canton:
            manifest.update({
                "province": {"official_code": province.get("official_code"), "name": province.get("term_name")},
                "canton": {"official_code": canton.get("official_code"), "name": canton.get("term_name")},
                "district": {"official_code": district.get("official_code"), "name": district.get("term_name")},
                "parent_chain_valid": True,
            })
            return manifest, "VERIFIED_EXACT_PARENT_CHAIN"
    manifest["parent_chain_valid"] = False
    if province and len(dm) > 1 or (province and not dm and all_district_matches): return manifest, "CONFLICTING_GEOGRAPHY"
    if province and len(cm) == 1: return manifest, "CANTON_ONLY"
    return manifest, "UNRESOLVED_GEOGRAPHY"

def qualification(row: dict, geographic_status: str) -> str:
    if geographic_status == "CONFLICTING_GEOGRAPHY": return geographic_status
    if geographic_status != "VERIFIED_EXACT_PARENT_CHAIN": return "UNRESOLVED_EXACT_GEOGRAPHY"
    kind = TYPE_MAP.get(row.get("property_type"))
    if not kind: return "UNSUPPORTED_SOURCE_PROPERTY_TYPE"
    if row.get("source_transaction") != "sale": return "MISSING_REQUIRED_TRANSACTION_EVIDENCE"
    price = row.get("sale_asking_price") or {}
    if not price.get("amount") or not price.get("currency"): return "MISSING_EXACT_PRICE"
    if not (row.get("whatsapp_numbers") or [None])[0]: return "MISSING_WHATSAPP"
    prop, construction = measurement((row.get("property_area") or {}).get("source_value")), measurement((row.get("construction_area") or {}).get("source_value"))
    if kind in {"House", "Cabin"} and not (prop and construction): return "MISSING_REQUIRED_EXPLICIT_MEASUREMENT"
    if kind in {"Condo", "Commercial Property"} and not construction: return "MISSING_REQUIRED_EXPLICIT_MEASUREMENT"
    if kind in {"Land", "Farm"} and not prop: return "MISSING_REQUIRED_EXPLICIT_MEASUREMENT"
    return "QUALIFIED_FOR_CANONICAL_SUBMISSION"

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--observations", required=True, type=Path)
    parser.add_argument("--workbook", required=True, type=Path)
    parser.add_argument("--terms", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    observations = json.loads(args.observations.read_text())
    workbook, terms = read_workbook(args.workbook), json.loads(args.terms.read_text())
    args.output.mkdir(parents=True, exist_ok=True)
    normalised, manifest, report = [], [], []
    for original in observations:
        row = json.loads(json.dumps(original))
        source = workbook.get(clean(row.get("source_listing_id")))
        if not source:
            outcome, geography, transaction = "MISSING_WORKBOOK_SOURCE_EVIDENCE", {}, None
        else:
            business = clean(source.get("Tipo de negocio"))
            transaction = "sale" if business in {"Vender", "Vender - Arrendar"} else None
            geography, geography_status = map_geography(source, terms)
            if transaction:
                row["source_transaction"] = transaction
                row["transaction"] = "sale"
                if business == "Vender - Arrendar": row.setdefault("source_evidence", {})["also_advertises_rent"] = True
                price = row.get("sale_asking_price") or {}

                if (
                    price.get("amount") is not None
                    and price.get("currency")
                    and price.get("source_label")
                    and price.get("source_value")
                    and row.get("source_url")
                    and (row.get("source_evidence") or {}).get("detail_retrieved_at")
                ):
                    row["raw_price_evidence"] = {
                        "flight_price": {
                            "amount": {"value": str(price["amount"])},
                            "currency": price["currency"],
                            "source_label": price["source_label"],
                            "source_value": price["source_value"],
                        },
                        "source_url": row["source_url"],
                        "observed_at": row["source_evidence"]["detail_retrieved_at"],
                    }

                reasons = []
                
                if not row.get("source_url", "").startswith("https://devop.inmo.co/"): reasons.append("SOURCE_URL_NOT_ALLOWED")
                if not price.get("amount") or not price.get("currency"): reasons.append("EXACT_SOURCE_PRICE_UNAVAILABLE")
                if transaction != "sale": reasons.append("SOURCE_TRANSACTION_MISMATCH")
                row["collection_eligibility"] = json.dumps({"status": "REJECTED" if reasons else "ELIGIBLE", "reasons": reasons, "basis": "legacy_verified_source_facts"}, separators=(",", ":"))
                row.setdefault("source_evidence", {})["legacy_recovery"] = {"workbook_sha256": sha(args.workbook), "workbook_code": source.get("Código"), "workbook_transaction": business, "normalizer": "prepare-devop-legacy-recovery.py"}
                if geography_status == "VERIFIED_EXACT_PARENT_CHAIN":
                    row["geography"] = {"source_fields": {"province": source.get("Estado / Departamento"), "city": source.get("Ciudad"), "zone": source.get("Zona")}, "province": geography["province"]["name"], "canton": geography["canton"]["name"], "district": geography["district"]["name"], "canonical_codes": {"province": geography["province"]["official_code"], "canton": geography["canton"]["official_code"], "district": geography["district"]["official_code"]}, "exact_pcd_published": True, "resolution_reasons": {"province": "resolved", "canton": "resolved", "district": "resolved"}}
            outcome = qualification(row, geography_status)
        manifest.append({"source_listing_id": row.get("source_listing_id"), "source_url": row.get("source_url"), "status": outcome if outcome in {"CONFLICTING_GEOGRAPHY", "UNRESOLVED_EXACT_GEOGRAPHY"} else ("VERIFIED_EXACT_PARENT_CHAIN" if geography.get("parent_chain_valid") else geography_status if source else "MISSING_WORKBOOK_SOURCE_EVIDENCE"), "mapping": geography})
        report.append({"source_listing_id": row.get("source_listing_id"), "source_url": row.get("source_url"), "workbook_transaction": source.get("Tipo de negocio") if source else "", "source_transaction": row.get("source_transaction", ""), "geography_status": manifest[-1]["status"], "canonical_province": row.get("geography", {}).get("canonical_codes", {}).get("province", ""), "canonical_canton": row.get("geography", {}).get("canonical_codes", {}).get("canton", ""), "canonical_district": row.get("geography", {}).get("canonical_codes", {}).get("district", ""), "qualification_outcome": outcome})
        normalised.append(row)
    (args.output / "devop-sale-normalized-observations.json").write_text(json.dumps(normalised, indent=2) + "\n")
    (args.output / "devop-sale-geography-manifest.json").write_text(json.dumps({"workbook_sha256": sha(args.workbook), "terms_sha256": sha(args.terms), "mappings": manifest}, indent=2) + "\n")
    with (args.output / "devop-sale-qualification.csv").open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(report[0])); writer.writeheader(); writer.writerows(report)
    counts = {}
    for item in report: counts[item["qualification_outcome"]] = counts.get(item["qualification_outcome"], 0) + 1
    summary = {"observations": len(observations), "counts": counts, "source_observations_sha256": sha(args.observations), "workbook_sha256": sha(args.workbook), "terms_sha256": sha(args.terms), "normalizer": "prepare-devop-legacy-recovery.py"}
    (args.output / "devop-sale-recovery-summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    print(json.dumps(summary, indent=2))

if __name__ == "__main__": main()
