/**
 * 🔍 Détecte le type d'opération et l'entité associée
 * à partir du libellé brut d'une transaction SG.
 */
export function detectTypeAndEntity(
  label: string
): { typeOperation: string; entity: string | null } {
  const l = (label || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ");

  // -------------------------------
  // 🧩 1️⃣ DÉTERMINATION DU TYPE
  // -------------------------------
  let typeOperation = "AUTRE";

  if (l.includes("PRLV") || l.includes("PRELEVEMENT")) {
    typeOperation = "PRLV";
  } else if (
    l.includes("VIR") ||
    l.includes("VIREMENT") ||
    l.includes("INST RE") ||
    l.includes("PERM")
  ) {
    typeOperation = "VIREMENT";
  } else if (
    l.includes("FRAIS PAIEMENT") ||
    l.includes("PAIEMENT HORS ZONE") ||
    l.includes("OPTION TRANQUILLIT") ||
    l.includes("COTISATION JAZZ") ||
    l.includes("INTERETS DEBITEURS") ||
    l.includes("ARRETE")
  ) {
    typeOperation = "AUTRE (FRAIS BANCAIRES)";
  } else if (l.includes("CARTE") && !l.includes("RETRAIT DAB")) {
    typeOperation = "PAIEMENT CB";
  } else if (l.includes("RETRAIT DAB")) {
    typeOperation = "RETRAIT";
  } else if (l.includes("CHEQUE")) {
    typeOperation = "CHEQUE";
  }

  // -------------------------------
  // 🧠 2️⃣ DÉTECTION DE L’ENTITÉ
  // -------------------------------
  let entity: string | null = null;

  // 💳 Cas 1 : RETRAIT → pas d’entité
  if (typeOperation === "RETRAIT") return { typeOperation, entity: null };

  // 💸 Cas 2 : VIREMENTS
  if (typeOperation === "VIREMENT") {
    if (/VIR\s+(RECU|INST\s+RE)/.test(l)) {
      const match = l.match(/DE[:\s]+([A-Z0-9\s\.\'\-]+?)(?=\s+(DATE|MOTIF|REF|ID|EUR|$)|$)/);
      if (match && match[1]) entity = match[1].trim();
    } else if (/VIR\s+(INSTANTANE|EUROPEEN|PERM)/.test(l) && /POUR[:\s]+/i.test(l)) {
      const match = l.match(/POUR[:\s]+([A-Z0-9\s\.\'\-]+?)(?=\s+(BQ|CPT|REF|DATE|$))/);
      if (match && match[1]) entity = match[1].trim();
    } else if (/LOGITEL/.test(l) && /POUR[:\s]+/i.test(l)) {
      const match = l.match(/POUR[:\s]+([A-Z0-9\s\.\'\-]+?)(?=\s+(BQ|CPT|DATE|$))/);
      if (match && match[1]) entity = match[1].trim();
    }
  }

  // 🛍 Cas 3 : Paiements CB — extraction du commerçant
  if (typeOperation === "PAIEMENT CB") {
    const cleaned = l.replace(/(?:CARTE\s+X\d{4}\s+\d{2}\/\d{2}\s*){1,}/g, "CARTE ");
    const match = cleaned.match(/CARTE\s+([A-Z0-9\*\.\'\-\s]+?)(?=\s+\d{2,}|USD|EUR|COMMERCE|IOPD|ILID|$)/);
    if (match && match[1]) {
      entity = match[1]
        .trim()
        .replace(/\s{2,}/g, " ")
        .replace(/^(\*|\-)+/, "")
        .replace(/\.$/, "")
        .trim();
    }
  }

  // 🧾 Cas 4 : Prélèvements automatiques
  if (typeOperation === "PRLV") {
    if (/POUR\s+CPTE\s+DE[:\s]+/i.test(l)) {
      const match = l.match(/POUR\s+CPTE\s+DE[:\s]+([A-Z0-9\s\.\'\-]+?)(?=\s+(ID|MOTIF|ICS|REF|EUR|$))/);
      if (match && match[1]) entity = match[1].trim();
    } else if (/DE[:\s]+/i.test(l)) {
      const match = l.match(/DE[:\s]+([A-Z0-9\s\.\'\-]+?)(?=\s+(ID|MOTIF|ICS|REF|EUR|$))/);
      if (match && match[1]) entity = match[1].trim();
    }
  }

  // 🏦 Cas 5 : Frais bancaires
  if (typeOperation.startsWith("AUTRE")) {
    if (/FRAIS\s+PAIEMENT\s+HORS\s+ZONE\s+EURO/.test(l))
      entity = "Frais paiement international";
    else if (/FRAIS/.test(l))
      entity = "Frais bancaires";
    else if (/COTISATION\s+JAZZ/.test(l))
      entity = "Cotisation Jazz (SG)";
    else if (/OPTION\s+TRANQUILLITE/.test(l))
      entity = "Option Tranquillité (SG)";
    else if (/INTERETS/.test(l))
      entity = "Intérêts débiteurs";
    else if (/ARRETE/.test(l))
      entity = "Arrêté de compte";
  }

  // 🧾 Cas 6 : Marques connues
  if (!entity) {
    const knownEntities: Record<string, string> = {
      ORANGE: "Orange",
      EDF: "EDF",
      AMAZON: "Amazon",
      FNAC: "Fnac",
      DGFIP: "DGFIP (Impôts)",
      SFR: "SFR",
      FREE: "Free",
      SNCF: "SNCF",
      AIRBNB: "Airbnb",
      GOOGLE: "Google",
      APPLE: "Apple",
      PAYPAL: "PayPal",
      CARREFOUR: "Carrefour",
      LECLERC: "Leclerc",
      LIDL: "Lidl",
      UBER: "Uber",
      META: "Meta (Facebook)",
      NETFLIX: "Netflix",
      O2SWITCH: "O2SWITCH.FR",
      KOALA: "KOALA.SH",
    };
    for (const key of Object.keys(knownEntities)) {
      if (l.includes(key)) {
        entity = knownEntities[key];
        break;
      }
    }
  }

  // 🧩 Cas 7 : Fallback générique
  if (!entity) {
    const genericDe = l.match(/DE[:\s]+([A-Z0-9\s\-]+?)(?=\s(MOTIF|REF|ID|EUR|FR|IOPD|$))/);
    if (genericDe && genericDe[1]) {
      const e = genericDe[1].trim();
      if (e.length > 3 && !e.includes("BRED")) entity = e;
    }
  }

  // -------------------------------
  // 🧹 3️⃣ NETTOYAGE FINAL
  // -------------------------------
  if (entity) {
    entity = entity
      .replace(/\b\d{2}\s\d{2}\b/g, "")
      .replace(/\b\d{4,}\b/g, "")
      .replace(/\bM(R|\.|ONSIEUR)?\s+ET\s+MME(\.|\b)?/gi, "")
      .replace(/\b(M(\.)?|MME(\.)?|MLE(\.)?|MONSIEUR|MADAME|MR|MM)\b[\s\u00A0]*/gi, "")
      .replace(/\s{2,}/g, " ")
      .replace(/^[-–\.]+/, "")
      .trim();
  }

  return { typeOperation, entity };
}
