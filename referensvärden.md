# Referensvärden — Implementation (uppdaterad)

Källa: Aktivitus kliniska referensdata + InBody + Ekblom-Bak normtabell.

## Blodanalys

Källa: `getBloodRefRange()` + `evaluateBloodMetric()` i `healthEvaluation.ts`

### Hemoglobin (g/L)

| Kön | Grön (optimal) | Gul (varning) | Röd (högrisk) |
|-----|----------------|---------------|----------------|
| **Man** (alla åldrar) | 141–165 | 134–140 / 166–170 | <134 / >170 |
| **Kvinna** (alla åldrar) | 121–144 | 117–120 / 145–153 | <117 / >153 |

### Glukos (mmol/L)

| Grupp | Grön | Gul | Röd |
|-------|------|-----|-----|
| Alla | 4.2–6.0 | 3.75–4.2 / 6.0–6.45 | <3.75 / >6.45 |

*OBS: Kliniskt används HbA1c (mmol/mol), inte fP-Glukos. Glukos-referenserna är generiska defaults.*

### HDL-kolesterol (mmol/L) — högre är bättre

| Kön | Grön | Gul | Röd |
|-----|------|-----|-----|
| **Man** | ≥ 1.11 | 0.8–1.10 | < 0.8 |
| **Kvinna** | ≥ 1.11 | 1.0–1.10 | < 1.0 |

### LDL-kolesterol (mmol/L) — lägre är bättre

| Ålder | Grön | Gul | Röd |
|-------|------|-----|-----|
| 18–30 | 0–4.0 | 4.1–4.3 | ≥ 4.4 |
| 31–50 | 0–4.2 | 4.3–4.7 | ≥ 4.8 |
| > 50 | 0–4.9 | 5.0–5.3 | ≥ 5.4 |

*Samma för man och kvinna.*

### Triglycerider (mmol/L) — lägre är bättre

| Grupp | Grön | Gul | Röd |
|-------|------|-----|-----|
| Alla | 0–2.3 | 2.4–2.69 | ≥ 2.7 |

---

## Kroppskomposition (InBody)

### Kroppsfett (%)

| Kön | Grön | Gul | Röd |
|-----|------|-----|-----|
| **Man** | 10–20 | 21–25 | <10 / >25 |
| **Kvinna** | 18–28 | 10–17.9 / 29–35 | <10 / >35 |

---

## Blodtryck (mmHg) — ESC/ESH riktlinjer

| Risk | Systoliskt | Diastoliskt |
|------|-----------|-------------|
| Optimal | <120 | <80 |
| Bra | 120–129 | <80 |
| Varning | 130–139 | 80–89 |
| Högrisk | ≥140 | ≥90 |

---

## VO2 Max — Ekblom-Bak (ml/min/kg)

### Man

| Ålder | Mycket låg (Röd) | Låg (Gul) | Medel (Bra) | Hög/Mycket hög (Grön) |
|-------|-------------------|-----------|-------------|------------------------|
| 20–29 | < 34 | 34–43 | 44–52 | ≥ 53 |
| 30–39 | < 31 | 31–41 | 42–49 | ≥ 50 |
| 40–49 | < 27 | 27–38 | 39–47 | ≥ 48 |
| 50–59 | < 25 | 25–36 | 37–44 | ≥ 45 |
| 60–69 | < 23 | 23–32 | 33–40 | ≥ 41 |

### Kvinna

| Ålder | Mycket låg (Röd) | Låg (Gul) | Medel (Bra) | Hög/Mycket hög (Grön) |
|-------|-------------------|-----------|-------------|------------------------|
| 20–29 | < 28 | 28–36 | 37–44 | ≥ 45 |
| 30–39 | < 26 | 26–34 | 35–42 | ≥ 43 |
| 40–49 | < 23 | 23–32 | 33–40 | ≥ 41 |
| 50–59 | < 21 | 21–29 | 30–37 | ≥ 38 |
| 60–69 | < 18 | 18–26 | 27–34 | ≥ 35 |

---

## Greppstyrka (kg) — ej könsanpassad ännu

| Risk | Gräns |
|------|-------|
| Optimal | ≥ 30 |
| Bra | 20–30 |
| Varning | < 20 |

---

## Risklablar

| RiskLevel | Label |
|-----------|-------|
| optimal | Optimalt |
| good | Bra |
| warning | Varning |
| high-risk | Högrisk |
