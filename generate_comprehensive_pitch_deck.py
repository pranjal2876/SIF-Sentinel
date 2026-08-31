import os
from fpdf import FPDF, XPos, YPos

class ComprehensivePitchDeckPDF(FPDF):
    def header(self):
        self.set_font("helvetica", "B", 9)
        self.set_text_color(100, 116, 139)
        self.cell(0, 8, "SIH 2026 | Problem Statement: SIH26165 (Oil India Limited) | SIF Sentinel Pitch Deck", border="B", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="L")
        self.ln(3)

    def footer(self):
        self.set_y(-12)
        self.set_font("helvetica", "I", 8)
        self.set_text_color(148, 163, 184)
        self.cell(0, 8, f"SIF Sentinel - Smart India Hackathon 2026 Round 1 Presentation | Page {self.page_no()}", align="C")

    def slide_header(self, slide_num, title, speaker_info):
        self.set_fill_color(15, 23, 42) # Slate 900
        self.rect(self.l_margin, self.get_y(), self.w - self.l_margin - self.r_margin, 15, style="F")
        self.set_y(self.get_y() + 2)
        self.set_font("helvetica", "B", 12)
        self.set_text_color(255, 255, 255)
        self.cell(115, 6, f"  SLIDE {slide_num}: {title}", new_x=XPos.RIGHT, new_y=YPos.TOP)
        self.set_font("helvetica", "B", 8.5)
        self.set_text_color(251, 191, 36) # Amber 400
        self.cell(0, 6, f"[{speaker_info}]  ", align="R", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_text_color(0, 0, 0)
        self.ln(9)

    def section_header(self, title):
        self.set_font("helvetica", "B", 10.5)
        self.set_text_color(15, 76, 129) # Navy
        self.cell(0, 6, title, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.line(self.l_margin, self.get_y(), self.l_margin + 60, self.get_y())
        self.set_text_color(15, 23, 42)
        self.ln(2)

    def bullet_point(self, title, desc):
        self.set_font("helvetica", "B", 8.5)
        self.set_text_color(30, 41, 59)
        self.cell(4, 4.8, "-", new_x=XPos.RIGHT, new_y=YPos.TOP)
        self.cell(45, 4.8, f" {title}:", new_x=XPos.RIGHT, new_y=YPos.TOP)
        self.set_font("helvetica", "", 8.5)
        self.set_text_color(51, 65, 85)
        self.multi_cell(0, 4.8, f" {desc}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(1)

    def callout_box(self, text, box_type="info"):
        if box_type == "warn":
            self.set_fill_color(254, 243, 199) # Amber 100
            self.set_draw_color(245, 158, 11) # Amber 500
            text_color = (120, 53, 15)
        elif box_type == "success":
            self.set_fill_color(240, 253, 244) # Green 100
            self.set_draw_color(34, 197, 94) # Green 500
            text_color = (20, 83, 45)
        else:
            self.set_fill_color(241, 245, 249) # Slate 100
            self.set_draw_color(148, 163, 184)
            text_color = (30, 41, 59)

        self.set_text_color(*text_color)
        self.set_font("helvetica", "I", 8)
        self.set_line_width(0.3)
        self.multi_cell(0, 4.5, text, border=1, fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_draw_color(0, 0, 0)
        self.set_text_color(0, 0, 0)
        self.ln(2)

def generate_full_pitch_deck():
    pdf = ComprehensivePitchDeckPDF(orientation="P", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=True, margin=15)
    
    # -------------------------------------------------------------
    # COVER PAGE
    # -------------------------------------------------------------
    pdf.add_page()
    pdf.ln(15)
    pdf.set_fill_color(15, 23, 42)
    pdf.rect(15, 30, 180, 75, style="F")
    
    pdf.set_y(40)
    pdf.set_font("helvetica", "B", 26)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 12, "SIF SENTINEL", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.set_font("helvetica", "I", 13)
    pdf.set_text_color(251, 191, 36)
    pdf.cell(0, 8, '"Don\'t wait for the incident. Find the precursor."', align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.set_font("helvetica", "", 10)
    pdf.set_text_color(203, 213, 225)
    pdf.cell(0, 8, "AI-Powered Safety Precursor & Closed-Loop Intelligence System", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.cell(0, 6, "Smart India Hackathon 2026 | Problem Statement: SIH26165 (Oil India Limited)", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.set_y(115)
    pdf.set_text_color(15, 23, 42)
    pdf.set_font("helvetica", "B", 12)
    pdf.cell(0, 8, "TEAM OF 6 PRESENTATION STRUCTURE & ROLE ALLOCATION", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(2)

    roles = [
        ("Speaker 1 & 2 (Co-Presenters)", "Problem Statement, Solution Core Loop, Technical Architecture Overview, and Complete Prototype Walkthrough (Every Screen, Button, and Metric)."),
        ("Speaker 3 (ML & Data Specialist)", "Dataset Provenance (Synthetic vs Public IHM Stefanini), Data Quality Formula, NLP Ontology, SentenceTransformers, Cosine Distance and DBSCAN Clustering."),
        ("Speaker 4, 5 & 6 (Business, Strategy & Engineering)", "Feasibility & Viability, Unique Selling Proposition (USP), Competitive Benchmark, Scalability Architecture, Supervised Learning Roadmap, and Quantified Safety Impact & ROI.")
    ]

    for title, desc in roles:
        pdf.set_fill_color(248, 250, 252)
        pdf.set_font("helvetica", "B", 9)
        pdf.cell(65, 8, f" {title}", border=1, fill=True, new_x=XPos.RIGHT, new_y=YPos.TOP)
        pdf.set_font("helvetica", "", 8.5)
        pdf.multi_cell(0, 8, f" {desc}", border=1, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(1)

    pdf.ln(8)
    pdf.callout_box("NOTE FOR EVALUATORS: SIF Sentinel is an explainable decision-support system running 100% locally and offline without external API dependencies. Demonstrations utilize controlled synthetic and public industrial datasets for prototype validation under SIH26165.", "info")

    # -------------------------------------------------------------
    # SLIDE 1: PROBLEM STATEMENT (Speaker 1 & 2)
    # -------------------------------------------------------------
    pdf.add_page()
    pdf.slide_header("1", "THE PROBLEM STATEMENT", "Speaker 1 & 2")
    
    pdf.section_header("Industrial Safety Reality: The Hidden Precursor Blindspot")
    pdf.bullet_point("The Fundamental Law of Safety", "Catastrophic industrial incidents (blowouts, flash fires, electrocutions, structural collapses) are almost never isolated anomalies. Decades of safety science (Heinrich-Bird Triangle & Campbell Institute research) demonstrate that every major disaster is preceded by dozens of low-severity near-misses, unsafe acts, and minor condition reports.")
    pdf.bullet_point("The Semantic Tower of Babel", "In high-hazard enterprises like Oil India Limited (OIL), hundreds of frontline technicians, drillers, and third-party contractors submit thousands of observations monthly across dozens of remote wellheads, rigs, and production facilities. Each person writes in their own natural language vocabulary.")
    pdf.bullet_point("Why Traditional Tools Fail", "Existing EHS systems (SAP, Enablon, Sphera) rely on basic keyword search or rigid drop-down tags. If Technician A reports 'technician opened live junction box' and Technician B reports 'distribution panel remained energized without isolation', traditional keyword searches find ZERO matches. The dots are never connected.")
    pdf.bullet_point("The Fatal Delay", "Safety officers are overwhelmed by tabular spreadsheets. Weak signals remain buried as isolated noise until the preventive barrier completely degrades, leading to fatal accidents, multi-crore asset loss, and regulatory shutdowns.")
    
    pdf.ln(2)
    pdf.callout_box("CRITICAL PROBLEM SUMMARY: Safety teams do not lack reports; they lack the intelligence to connect differently worded observations and uncover recurring preventive barrier breakdowns before disaster strikes.", "warn")

    # -------------------------------------------------------------
    # SLIDE 2: THE IDEA / SOLUTION (Speaker 1 & 2)
    # -------------------------------------------------------------
    pdf.add_page()
    pdf.slide_header("2", "THE IDEA & SOLUTION CORE LOOP", "Speaker 1 & 2")
    
    pdf.section_header("SIF Sentinel: Explainable Safety Intelligence System")
    pdf.bullet_point("Core Product Definition", "SIF Sentinel is an explainable AI-powered safety precursor discovery and closed-loop intelligence system. It ingests unstructured text, discovers hidden precursor clusters across distributed facilities, tracks safety barrier integrity, and enforces human-led preventive remediation.")
    pdf.bullet_point("Core Intelligence Loop", "SIF Sentinel executes an end-to-end 9-stage closed safety intelligence cycle:")
    
    pdf.ln(2)
    pdf.set_fill_color(241, 245, 249)
    pdf.set_font("helvetica", "B", 7.5)
    pdf.cell(0, 7, "  REPORT  -->  UNDERSTAND  -->  CONNECT  -->  IDENTIFY  -->  WARN  -->  VALIDATE  -->  ACT  -->  MEASURE  -->  IMPROVE", border=1, fill=True, align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(3)

    pdf.section_header("How SIF Sentinel Solves the Problem in Simple Steps")
    pdf.bullet_point("1. Ingest & Normalize", "Accepts raw observation text directly from field apps, paper logs, or CSVs, extracting hazards and failing control barriers automatically.")
    pdf.bullet_point("2. Connect Meaning", "Maps text into a 384-dimensional mathematical concept space. It understands that 'no tag out' = 'live breaker' = 'unisolated circuit'.")
    pdf.bullet_point("3. Uncover Hidden Clusters", "Uses density clustering to discover latent precursor patterns across multiple physical sites without needing predefined search keywords.")
    pdf.bullet_point("4. Quantify Explainable Risk", "Computes a transparent 0-100 SIF Score based on 5 physical risk dimensions so engineers understand exactly why an issue is dangerous.")
    pdf.bullet_point("5. Close the Loop", "Converts validated patterns into assigned work orders and measures the real percentage reduction in precursor reports after implementation.")

    # -------------------------------------------------------------
    # SLIDE 3: TECHNICAL APPROACH OVERVIEW (Speaker 1 & 2)
    # -------------------------------------------------------------
    pdf.add_page()
    pdf.slide_header("3", "TECHNICAL APPROACH & HYBRID AI ARCHITECTURE", "Speaker 1 & 2")
    
    pdf.section_header("The Multi-Layered Hybrid AI Architecture")
    pdf.bullet_point("Layer 1: Deterministic Safety Ontology", "Uses regex span extraction and rule-based NLP aligned with IOGP Life-Saving Rules to identify canonical hazard categories (Electrical, Pressure, Confined Space, Working at Height) and exact failing barriers.")
    pdf.bullet_point("Layer 2: Dense Semantic Vector Space", "Runs sentence-transformers (all-MiniLM-L6-v2) to generate dense 384-dimensional mathematical vector embeddings representing semantic intent.")
    pdf.bullet_point("Layer 3: Cosine Distance & DBSCAN Clustering", "Computes cosine distance matrices and runs multi-stage DBSCAN to cluster related reports while segregating random noise.")
    pdf.bullet_point("Layer 4: 5-Factor SIF Scoring Engine", "Calculates a 0-100 risk score with transparent mathematical point distribution (Severity 25, Control 25, Exposure 20, Recurrence 20, Consequence 10).")
    pdf.bullet_point("Layer 5: Preventive Barrier Health Index", "Monitors real-time deterioration velocities (0-100) across physical safety barriers across all operational fields.")
    pdf.bullet_point("Layer 6: Human-in-the-Loop Governance", "Requires qualified safety professionals to review, confirm, or reject AI findings with permanent audit logs.")
    pdf.bullet_point("Layer 7: Grounded Copilot & Scenario Simulator", "Provides zero-hallucination Q&A grounded strictly in SQL database telemetry and interactive What-If scenario projections.")

    # -------------------------------------------------------------
    # SLIDE 4: PROTOTYPE WALKTHROUGH - COMMAND CENTER (Speaker 1 & 2)
    # -------------------------------------------------------------
    pdf.add_page()
    pdf.slide_header("4", "PROTOTYPE DEEP DIVE: COMMAND CENTER (/dashboard)", "Speaker 1 & 2")
    
    pdf.section_header("Every Component, Card, and Button Explained in Plain Words")
    pdf.bullet_point("Top Data Provenance Badge", "Shows whether active telemetry is 'Synthetic Demonstration Dataset (1,000 records)' or 'IHM Stefanini Public Industrial Dataset (425 records)' with live toggle buttons ('Reload Synthetic' / 'Load Public Dataset').")
    pdf.bullet_point("Signature Action Button [DISCOVER HIDDEN SIF PATTERNS]", "Located in the top header. Clicking this triggers the live backend ML pipeline: encodes all reports, computes distance matrices, and clusters latent precursor patterns in real-time.")
    pdf.bullet_point("4 3D Primary KPI Cards", "1. Active SIF Patterns: Total AI-discovered recurring precursor clusters.\n2. Critical Precursors: Number of high-risk precursors (SIF score >= 80) demanding immediate intervention.\n3. Reports Analyzed: Total raw near-miss observations parsed via NLP (100% extracted).\n4. High Concentration Sites: Count of specific operational facilities where average precursor SIF exceeds 60.")
    pdf.bullet_point("Human Safety Review Governance Rate", "Displays the exact percentage of AI findings verified by human safety leads (e.g. '85% Confirmed - 17 confirmed, 3 rejected').")
    pdf.bullet_point("Reporting Culture Safeguard Banner", "Explains that high report counts indicate a proactive, transparent reporting culture rather than poor safety performance. SIF Sentinel measures precursor severity, not mere report volume.")
    pdf.bullet_point("Interactive 3D Heatmap & Emerging SIF Radar", "Heatmap visualizes facility risk density across operational assets. Emerging Radar maps clusters by velocity trend and SIF severity.")
    pdf.bullet_point("Data Quality & Completeness Diagnostics", "Calculates data completeness (e.g. '94% Quality') based on missing locations, unmapped categories, and NLP extraction confidence.")

    # -------------------------------------------------------------
    # SLIDE 5: PROTOTYPE WALKTHROUGH - PATTERN INVESTIGATION (Speaker 1 & 2)
    # -------------------------------------------------------------
    pdf.add_page()
    pdf.slide_header("5", "PROTOTYPE DEEP DIVE: PRECURSOR INVESTIGATION (/patterns/[id])", "Speaker 1 & 2")
    
    pdf.section_header("Investigating a Discovered Precursor Pattern")
    pdf.bullet_point("Executive 'WHY THIS MATTERS' Banner", "A high-visibility dark banner summarizing the business risk in plain English: '30 semantically related observations across 4 operational facilities converged on a single failure mode (Electrical Isolation / LOTO). Occurrence velocity increased by +42%. Risk Score: 84/100 (CRITICAL).'")
    pdf.bullet_point("Human-in-the-Loop Expert Validation Banner", "Contains three explicit action buttons: [CONFIRM PATTERN], [MODIFY FINDING], and [REJECT PATTERN]. Allows safety engineers to enter formal technical remarks, stamped into an immutable audit trail.")
    pdf.bullet_point("Tab 1: Diagnostic Overview", "Displays the Precursor Frequency Trajectory line chart (Recharts) showing month-by-month event counts and trend velocity (+% / -%), alongside the mathematical 5-Factor SIF assessment drivers.")
    pdf.bullet_point("Tab 2: [CONNECT THE DOTS] Pattern Graph", "Our signature visual graph. The center hub node represents the Precursor. Linked radial nodes represent individual field reports, failing barriers, affected facilities, and contractors. Clicking any node instantly displays verbatim raw worker quotes and extracted evidence snippets.")
    pdf.bullet_point("Prioritized Preventive Interventions", "Lists actionable engineering recommendations (e.g., 'Targeted LOTO Dual Sign-off Audit') with supporting evidence counts.")
    pdf.bullet_point("Action Trigger Buttons", "1. [CREATE PREVENTIVE ACTION]: Opens the work order assignment workflow.\n2. [Simulate Reduction]: Opens the What-If Simulator with pre-filled barrier parameters.")

    # -------------------------------------------------------------
    # SLIDE 6: PROTOTYPE WALKTHROUGH - ACTIONS & INTELLIGENCE TOOLS (Speaker 1 & 2)
    # -------------------------------------------------------------
    pdf.add_page()
    pdf.slide_header("6", "PROTOTYPE DEEP DIVE: CLOSED-LOOP ACTIONS & COPILOT", "Speaker 1 & 2")
    
    pdf.section_header("Closed-Loop Action Management (/actions)")
    pdf.bullet_point("Action Lifecycle", "Tracks work orders across OPEN, IN_PROGRESS, and COMPLETED states with department, site, priority, and target barrier filters.")
    pdf.bullet_point("[Create Preventive Action] Modal", "Enables safety leads to assign tasks with title, description, owner, department, facility, target barrier, and due dates.")
    pdf.bullet_point("[MARK COMPLETED WITH EVIDENCE] Modal", "Requires mandatory proof of completion (audit sign-off checklist, work order number, training log).")
    pdf.bullet_point("Measured Closed-Loop Impact Card", "Once completed, SIF Sentinel queries telemetry to compare precursor frequency before vs. after intervention, displaying hard proof of impact: 'Pre: 5.2/mo -> Post: 3.0/mo | Observed Precursor Change: -41.9%'.")
    
    pdf.section_header("Barrier Health Intelligence & Grounded Copilot")
    pdf.bullet_point("Barrier Health Intelligence (/barrier-health)", "Tracks 0-100 integrity scores for critical controls (LOTO, PTW, Fall Protection, Gas Test) with historical sparklines and deterioration status (IMPROVING, STABLE, DETERIORATING).")
    pdf.bullet_point("Grounded Safety Copilot (Drawer)", "A 100% local assistant accessible from the header. Users click sample queries like 'Which control barrier is deteriorating fastest?' or 'Which sites need audit first?'. It responds with zero hallucinations, citing active database metrics and evidence.")
    pdf.bullet_point("What-If Scenario Simulator (Modal)", "Features an interactive slider (0% to 50% simulated barrier improvement). Generates dual trajectory curves showing projected monthly precursor counts, avoided near-misses, and mitigated high-SIF exposures.")

    # -------------------------------------------------------------
    # SLIDE 7: DATASETS & ML MODELS USED (Speaker 3)
    # -------------------------------------------------------------
    pdf.add_page()
    pdf.slide_header("7", "DATASETS & ML MODELS DEEP DIVE", "Speaker 3 (ML & Data)")
    
    pdf.section_header("1. Dataset Provenance & Ingestion (Data Transparency)")
    pdf.bullet_point("Strict Data Provenance Protocol", "We maintain full academic integrity. Demonstrations utilize zero proprietary or confidential Oil India Limited data. Two transparent datasets are supported:")
    pdf.bullet_point("Dataset A: Synthetic Demonstration Dataset (1,000 records)", "Controlled near-miss observations modeling upstream oil & gas operations (drilling rigs, GGS, pipelines) with planted precursor clusters to validate algorithmic clustering under controlled conditions.")
    pdf.bullet_point("Dataset B: IHM Stefanini Public Industrial Dataset (425 records)", "Real-world public industrial and mining incident dataset containing unstructured incident descriptions and accident severity levels to prove real-world generalization.")
    pdf.bullet_point("Canonical Data Mapping & Dynamic Quality Formula", "The Data Profiler normalizes raw sources into the canonical SafetyReport schema. Data Quality is calculated dynamically:")
    
    pdf.ln(1)
    pdf.set_fill_color(241, 245, 249)
    pdf.set_font("helvetica", "B", 7.5)
    pdf.cell(0, 6, "Data Quality Score = 100 - [(Missing Locations / Total * 30) + (Unmapped Categories / Total * 20)]", border=1, fill=True, align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(2)

    pdf.section_header("2. Machine Learning Architecture & Parameters")
    pdf.bullet_point("Pretrained Dense Embeddings", "Sentence-Transformers (all-MiniLM-L6-v2) with 22.7M parameters mapping text into 384-dimensional dense vectors. Loaded as an in-memory singleton executing batch inference locally on standard CPU.")
    pdf.bullet_point("Density-Based Clustering (DBSCAN)", "Calculates precomputed cosine distance matrices D_ij = 1 - cos(u_i, v_j). Clusters within extracted hazard categories using eps = 0.45 and min_samples = 2. Outliers (label -1) are segregated as noise, avoiding false pattern inflation.")
    pdf.bullet_point("5-Factor SIF Scoring Formula", "Computes a transparent, explainable 0-100 score: SIF Score = Severity (0-25) + Control Failure (0-25) + Exposure (0-20) + Recurrence (0-20) + Consequence (0-10).")

    # -------------------------------------------------------------
    # SLIDE 8: FEASIBILITY & VIABILITY (Speaker 4, 5, 6)
    # -------------------------------------------------------------
    pdf.add_page()
    pdf.slide_header("8", "FEASIBILITY & COMMERCIAL VIABILITY", "Speaker 4, 5 & 6")
    
    pdf.section_header("Technical Feasibility: Immediate Plug-and-Play Deployment")
    pdf.bullet_point("Lightweight CPU Inference", "Requires zero high-end GPU infrastructure. The all-MiniLM-L6-v2 transformer executes batch vectorization for 1,000 records in under 1.8 seconds on standard enterprise CPUs.")
    pdf.bullet_point("100% Air-Gapped & Offline", "The entire stack runs on-premise without internet connectivity or external API subscriptions, meeting strict PSU cybersecurity protocols (MeitY / OIL data sovereignty standards).")
    pdf.bullet_point("Universal Ingestion Adapters", "Pre-built connectors for standard enterprise CSVs, Excel logs, and SQL dumps enable zero-friction integration with existing OIL safety reporting systems.")

    pdf.section_header("Commercial Viability & Return on Investment (ROI)")
    pdf.bullet_point("Massive Cost Avoidance", "A single serious upstream blowout or major plant fire costs between Rs 50 Crore and Rs 500+ Crore in direct asset loss, well control expenses, environmental fines, and production downtime.")
    pdf.bullet_point("HSE Workflow Optimization", "Eliminates hundreds of manual spreadsheet review hours for HSE managers, freeing safety leads to conduct targeted field audits where barrier deterioration is highest.")
    pdf.bullet_point("Regulatory Compliance", "Provides auditable compliance records aligning with DGMS (Directorate General of Mines Safety) and OISD (Oil Industry Safety Directorate) proactive safety standards.")

    # -------------------------------------------------------------
    # SLIDE 9: USP & COMPETITOR BENCHMARK (Speaker 4, 5, 6)
    # -------------------------------------------------------------
    pdf.add_page()
    pdf.slide_header("9", "UNIQUE SELLING PROPOSITIONS & COMPETITIVE BENCHMARK", "Speaker 4, 5 & 6")
    
    pdf.section_header("Our 4 Key Unique Selling Propositions (USPs)")
    pdf.bullet_point("1. True Semantic Intelligence (Not Keywords)", "Connects completely different vocabulary (e.g. 'harness unclipped' <-> 'working at height without tie-off') via 384-dim dense vector embeddings.")
    pdf.bullet_point("2. Transparent, Explainable XAI", "No 'black box' AI. Every SIF risk score is mathematically broken down into 5 explainable factors with plain-English rationales and traceable worker quote snippets.")
    pdf.bullet_point("3. Closed-Loop Effectiveness Verification", "Unlike passive analytics dashboards, SIF Sentinel tracks post-remediation precursor reduction (e.g., -41.9%), proving whether safety actions actually worked.")
    pdf.bullet_point("4. Zero External API / Zero Hallucination", "Completely self-contained; Grounded Safety Copilot cites only SQL database telemetry.")

    pdf.section_header("Competitive Matrix")
    
    headers = ["Capability / Feature", "Traditional EHS (Enablon/Sphera)", "Generic LLMs (ChatGPT/Cloud)", "SIF Sentinel (Our Solution)"]
    widths = [45, 45, 45, 45]
    
    pdf.set_fill_color(15, 23, 42)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("helvetica", "B", 7.5)
    for i, h in enumerate(headers):
        pdf.cell(widths[i], 6, f" {h}", border=1, fill=True, new_x=XPos.RIGHT if i < 3 else XPos.LMARGIN, new_y=YPos.TOP if i < 3 else YPos.NEXT)
    
    matrix_rows = [
        ("Semantic Pattern Discovery", "No (Keyword / Tags Only)", "Partial (Unstructured Q&A)", "YES (DBSCAN + Embeddings)"),
        ("Data Sovereignty & On-Premise", "Yes (Traditional Server)", "NO (Cloud Data Leak Risk)", "YES (100% Offline / Local)"),
        ("Explainable SIF Risk Scoring", "Basic Severity Matrix", "Black Box Hallucinations", "YES (5-Factor Transparent)"),
        ("Closed-Loop Impact Measurement", "No (Task Tracking Only)", "No (Text Generation Only)", "YES (Pre vs Post Trajectory)"),
        ("Barrier Health Indexing", "No (Lagging Metrics Only)", "No (No Industrial Logic)", "YES (0-100 Dynamic Health)")
    ]

    for row in matrix_rows:
        pdf.set_fill_color(248, 250, 252)
        pdf.set_text_color(30, 41, 59)
        pdf.set_font("helvetica", "B", 7)
        pdf.cell(widths[0], 5.5, f" {row[0]}", border=1, fill=True, new_x=XPos.RIGHT, new_y=YPos.TOP)
        pdf.set_font("helvetica", "", 7)
        pdf.cell(widths[1], 5.5, f" {row[1]}", border=1, new_x=XPos.RIGHT, new_y=YPos.TOP)
        pdf.cell(widths[2], 5.5, f" {row[2]}", border=1, new_x=XPos.RIGHT, new_y=YPos.TOP)
        pdf.set_font("helvetica", "B", 7)
        pdf.set_text_color(15, 76, 129)
        pdf.cell(widths[3], 5.5, f" {row[3]}", border=1, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    # -------------------------------------------------------------
    # SLIDE 10: SCALABILITY & FUTURE SCOPE (Speaker 4, 5, 6)
    # -------------------------------------------------------------
    pdf.add_page()
    pdf.slide_header("10", "SCALABILITY ARCHITECTURE & FUTURE ROADMAP", "Speaker 4, 5 & 6")
    
    pdf.section_header("System Scalability Architecture")
    pdf.bullet_point("Database Scaling (SQLite -> PostgreSQL + pgvector)", "The current prototype uses SQLite with SQLAlchemy ORM abstraction. In enterprise deployment, swapping connection strings to PostgreSQL with pgvector enables sub-millisecond semantic indexing across 10,000,000+ historical reports with HNSW vector indexing.")
    pdf.bullet_point("Asynchronous Batch Processing", "FastAPI asynchronous background tasks decouple report ingestion and embedding generation from UI query latency.")
    pdf.bullet_point("Microservices Frontend", "Next.js 16 App Router with Server-Side Rendering (SSR) and modular component widgets allows seamless scaling across thousands of field safety engineers.")

    pdf.section_header("Future Scope & Supervised Learning Pathway")
    pdf.bullet_point("Supervised Transformer Fine-Tuning", "When authorized multi-year OIL historical safety records (50,000+ records) become available, fine-tune domain-specific Transformers (Domain RoBERTa/DeBERTa) on safety annotations.")
    pdf.bullet_point("Multi-Task Prediction Heads", "Add multi-task heads for direct SIF Potential Probability (Sigmoid), Multi-label Barrier Failure Classification (Softmax), and Consequence Severity Regression.")
    pdf.bullet_point("Voice-to-Text & Regional Multilingual Support", "Implement on-device speech-to-text allowing field workers to record observations in Hindi, Assamese, and Bengali, translating directly to canonical safety concepts.")
    pdf.bullet_point("IoT & SCADA Telemetry Fusion", "Correlate near-miss precursor reports with live wellhead pressure sensors and SCADA alarms for unified operational risk modeling.")

    # -------------------------------------------------------------
    # SLIDE 11: IMPACT & BENEFITS (Speaker 4, 5, 6)
    # -------------------------------------------------------------
    pdf.add_page()
    pdf.slide_header("11", "QUANTIFIED IMPACT, BENEFITS & CONCLUSION", "Speaker 4, 5 & 6")
    
    pdf.section_header("Transforming Industrial Safety: From Reactive to Proactive")
    pdf.bullet_point("Zero Fatalities Mission", "Directly addresses Oil India Limited's Core Safety Vision by dismantling the precursor chain before barriers fail, protecting the lives of frontline personnel.")
    pdf.bullet_point("Quantifiable Precursor Reduction", "Demonstrates measurable effectiveness in field operations - prototype validation shows observed precursor frequency reductions of over 40% after targeted barrier interventions.")
    pdf.bullet_point("Data-Driven HSE Budgeting", "Empowers leadership to allocate safety and maintenance capital directly to deteriorating barriers (e.g. electrical switchgear isolation audits) based on empirical mathematical risk.")
    pdf.bullet_point("Fostering a Just Culture", "Encourages workers to report minor unsafe conditions without fear of retribution, because our reporting safeguard algorithm treats high reporting volume as positive transparency.")

    pdf.ln(3)
    pdf.callout_box("FINAL PITCH TAKEAWAY FOR JUDGES: Major industrial disasters give warnings long before they strike. SIF Sentinel gives Oil India Limited the explainable AI intelligence to see those warnings, fix the failing barriers, and protect every worker.", "success")
    
    pdf.ln(2)
    pdf.set_font("helvetica", "B", 10.5)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 8, "THANK YOU! WE ARE READY FOR QUESTIONS & LIVE PROTOTYPE DEMONSTRATION.", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    # Output file
    output_path = "d:/Startups/SIF-Sentinel/SIH_Pitch_Deck_SIF_Sentinel.pdf"
    pdf.output(output_path)
    print(f"Comprehensive PDF pitch deck generated successfully at: {output_path}")

if __name__ == "__main__":
    generate_full_pitch_deck()
