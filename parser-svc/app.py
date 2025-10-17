from fastapi import FastAPI, UploadFile, Form
from fastapi.responses import JSONResponse
import csv, io, uuid
from datetime import datetime

app = FastAPI(title="parser-svc")

def try_decode(raw: bytes) -> str:
    """UTF-8 d'abord, puis CP1252 (Windows-1252) en fallback."""
    try:
        return raw.decode("utf-8")
    except UnicodeDecodeError:
        return raw.decode("cp1252", errors="replace")

def clean_amount(s: str | None) -> float:
    if not s:
        return 0.0
    # Enlever € espaces insécables, espaces, convertir virgule en point
    s = s.replace("€", "").replace("\xa0", "").replace(" EUR", "").replace("EUR", "")
    s = s.replace(" ", "").replace(",", ".").strip()
    # Certains exports mettent le signe à droite ; déjà géré par float()
    try:
        return float(s)
    except ValueError:
        # Dernier recours : retirer tout sauf chiffres, signe, point
        import re
        s2 = "".join(re.findall(r"[0-9\.\-]+", s))
        try:
            return float(s2)
        except:
            return 0.0

def ym(d: datetime) -> str:
    return d.strftime("%Y-%m")

def normalize(s: str) -> str:
    t = s.strip().lower()
    repl = {
        "é":"e","è":"e","ê":"e","ë":"e",
        "à":"a","â":"a","ä":"a",
        "î":"i","ï":"i",
        "ô":"o","ö":"o",
        "û":"u","ü":"u",
        "ç":"c",
        "’":"'", "œ":"oe"
    }
    for k,v in repl.items():
        t = t.replace(k,v)
    return t

def find_header_and_slice(text: str) -> tuple[list[str], list[list[str]]]:
    """
    Retourne (headers, rows) en ignorant toute ligne avant l'entête.
    Détecte deux formats SG :
    A) "Date opération;Date valeur;Libellé;Débit;Crédit"
    B) "Date de l'opération;Libellé;Détail de l'écriture;Montant de l'opération;Devise"
    """
    lines = [ln for ln in text.splitlines() if ln.strip() != ""]
    # Chercher la première ligne qui ressemble à une entête
    header_idx = -1
    for i, ln in enumerate(lines):
        low = normalize(ln)
        if ("date" in low and "operation" in low and ";" in ln) or \
           ("date de l" in low and "operation" in low and ";" in ln) or \
           ("libelle" in low and ";" in ln) or \
           ("montant" in low and ";" in ln and "devise" in low):
            header_idx = i
            break
    if header_idx == -1:
        # Pas d'entête claire : on tente tout le fichier comme CSV et on espère la 1re ligne en header
        header_idx = 0

    snippet = "\n".join(lines[header_idx:])
    reader = csv.reader(io.StringIO(snippet), delimiter=";")
    rows = list(reader)
    if not rows:
        return [], []

    headers = rows[0]
    data = rows[1:]
    return headers, data

def parse_format_A(headers: list[str], data: list[list[str]], filename: str) -> list[dict]:
    """
    A) Date opération;Date valeur;Libellé;Débit;Crédit
    """
    # Index par nom (tolérant)
    def idx(names: list[str]) -> int | None:
        hnorm = [normalize(h) for h in headers]
        for want in names:
            wantn = normalize(want)
            for i, h in enumerate(hnorm):
                if wantn in h:
                    return i
        return None

    i_dateop = idx(["date operation", "date op"])
    i_dateval = idx(["date valeur", "date val"])
    i_label  = idx(["libelle","nature","intitule","intitulé"])
    i_debit  = idx(["debit","montant debit"])
    i_credit = idx(["credit","montant credit"])

    out = []
    for row in data:
        try:
            dop_str = (row[i_dateop] if i_dateop is not None and i_dateop < len(row) else "").strip()
            if not dop_str:
                continue
            dop = datetime.strptime(dop_str, "%d/%m/%Y")
        except:
            continue

        dval = None
        if i_dateval is not None and i_dateval < len(row):
            dval_str = (row[i_dateval] or "").strip()
            if dval_str:
                try:
                    dval = datetime.strptime(dval_str, "%d/%m/%Y")
                except:
                    dval = None

        label = (row[i_label] if i_label is not None and i_label < len(row) else "").strip()

        debit = clean_amount(row[i_debit]) if (i_debit is not None and i_debit < len(row)) else 0.0
        credit = clean_amount(row[i_credit]) if (i_credit is not None and i_credit < len(row)) else 0.0

        out.append({
            "id": str(uuid.uuid4()),
            "bank": "SG",
            "accountIban": None,
            "dateOperation": dop.strftime("%Y-%m-%d"),
            "dateValeur": dval.strftime("%Y-%m-%d") if dval else None,
            "label": label,
            "details": None,
            "debit": round(debit, 2),
            "credit": round(credit, 2),
            "amount": round(credit - debit, 2),
            "yearMonth": ym(dop),
            "sourceFile": filename,
            "categoryId": None
        })
    return out

def parse_format_B(headers: list[str], data: list[list[str]], filename: str) -> list[dict]:
    """
    B) Date de l'opération;Libellé;Détail de l'écriture;Montant de l'opération;Devise
    """
    def idx(names: list[str]) -> int | None:
        hnorm = [normalize(h) for h in headers]
        for want in names:
            wantn = normalize(want)
            for i, h in enumerate(hnorm):
                if wantn in h:
                    return i
        return None

    i_dateop  = idx(["date de l'operation","date operation","date de l operation"])
    i_label   = idx(["libelle","intitule","intitulé"])
    i_detail  = idx(["detail de l'ecriture","detail de l ecriture","detail","details"])
    i_amount  = idx(["montant de l'operation","montant operation","montant"])
    i_devise  = idx(["devise"])

    out = []
    for row in data:
        try:
            dop_str = (row[i_dateop] if i_dateop is not None and i_dateop < len(row) else "").strip()
            if not dop_str:
                continue
            dop = datetime.strptime(dop_str, "%d/%m/%Y")
        except:
            continue

        label  = (row[i_label]  if i_label  is not None and i_label  < len(row) else "").strip()
        detail = (row[i_detail] if i_detail is not None and i_detail < len(row) else "").strip()
        montant = clean_amount(row[i_amount]) if (i_amount is not None and i_amount < len(row)) else 0.0
        # devise = (row[i_devise] if i_devise is not None and i_devise < len(row) else "").strip()

        debit  = abs(montant) if montant < 0 else 0.0
        credit = montant if montant > 0 else 0.0

        out.append({
            "id": str(uuid.uuid4()),
            "bank": "SG",
            "accountIban": None,
            "dateOperation": dop.strftime("%Y-%m-%d"),
            "dateValeur": None,
            "label": label,
            "details": detail or None,
            "debit": round(debit, 2),
            "credit": round(credit, 2),
            "amount": round(credit - debit, 2),
            "yearMonth": ym(dop),
            "sourceFile": filename,
            "categoryId": None
        })
    return out

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/parse/sg/csv")
async def parse_sg_csv(file: UploadFile = Form(...)):
    raw = await file.read()
    text = try_decode(raw)

    headers, data = find_header_and_slice(text)
    if not headers:
        return JSONResponse({"transactions": []})

    # Normalise les headers pour détecter le format
    hnorm = [normalize(h) for h in headers]
    has_date_val = any("date valeur" in h for h in hnorm)
    has_montant  = any("montant" in h for h in hnorm)
    has_devise   = any("devise" in h for h in hnorm)
    has_detail   = any("detail" in h for h in hnorm)

    if has_date_val:
        # Format A
        out = parse_format_A(headers, data, file.filename)
    elif has_montant and has_devise:
        # Format B (celui de ton extrait)
        out = parse_format_B(headers, data, file.filename)
    else:
        # tentative : si on a "libellé" + "montant", considère format B sans devise
        if has_montant:
            out = parse_format_B(headers, data, file.filename)
        else:
            out = []

    return JSONResponse({"transactions": out})
