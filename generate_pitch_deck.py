import os
from fpdf import FPDF

class PitchDeckPDF(FPDF):
    def header(self):
        self.set_font("helvetica", "B", 12)
        self.cell(0, 10, "SIH 2026: SIF Sentinel Pitch Deck", border=False, ln=1, align="C")
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("helvetica", "I", 8)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")

    def section_title(self, title):
        self.set_font("helvetica", "B", 14)
        self.set_text_color(0, 51, 102)
        self.cell(0, 10, title, ln=1)
        self.set_text_color(0, 0, 0)
        self.ln(2)

    def content_body(self, text):
        self.set_font("helvetica", "", 11)
        self.multi_cell(0, 6, text)
        self.ln(5)

    def sub_title(self, text):
        self.set_font("helvetica", "B", 12)
        self.cell(0, 8, text, ln=1)

def create_pitch_deck():
    pdf = PitchDeckPDF()
    pdf.add_page()
    
    # Title Page
    pdf.set_font("helvetica", "B", 24)
    pdf.cell(0, 20, "SIF Sentinel", ln=1, align="C")
    pdf.set_font("helvetica", "I", 14)
    pdf.cell(0, 10, "Don't wait for the incident. Find the precursor.", ln=1, align="C")
    pdf.set_font("helvetica", "", 12)
    pdf.cell(0, 10, "SIH26165 (Oil India Limited) - Round 1 Pitch Deck", ln=1, align="C")
    pdf.ln(10)
    pdf.content_body("This document is structured exactly for a 6-member team presentation.")
    
    # Members 1 & 2
    pdf.add_page()
    pdf.section_title("SPEAKER 1 & 2: PROBLEM, SOLUTION & PROTOTYPE")
    
    pdf.sub_title("1. Problem Statement")
    pdf.content_body("Major industrial incidents are rarely isolated events. They are preceded by dozens of low-severity observations and near-misses (e.g., an unclipped harness, a rushed isolation). \n\nBecause these observations are written by hundreds of different workers using different words (like 'panel live' vs 'equipment energized'), traditional keyword search fails. Safety teams miss the hidden connections, and accidents happen.")
    
    pdf.sub_title("2. Idea / Solution")
    pdf.content_body("SIF Sentinel is an explainable safety intelligence system. We use Natural Language Processing to connect differently worded observations and uncover recurring Serious Injury & Fatality (SIF) precursor patterns.\n\nWe provide a full Closed-Loop Intelligence system: REPORT -> UNDERSTAND -> CONNECT -> IDENTIFY -> WARN -> VALIDATE -> ACT -> MEASURE -> IMPROVE. We don't just predict; we identify failing preventive barriers so safety teams can take action before an incident occurs.")
    
    pdf.sub_title("3. Technical Approach (Overview)")
    pdf.content_body("Our Hybrid AI Architecture works in 5 steps:\n1. NLP Safety Ontology Extraction Engine: Reads text and extracts hazards and control failures.\n2. Dense Semantic Vector Space: Converts text into 384-dimensional mathematical vectors to understand meaning.\n3. Density-Based Clustering (DBSCAN): Groups related issues into 'Precursor Patterns'.\n4. 5-Factor SIF Risk Scoring: Calculates an explainable 0-100 risk score (Severity, Control, Exposure, Recurrence, Consequence).\n5. Human-in-the-Loop: Experts validate the AI findings and assign closed-loop actions.")
    
    pdf.add_page()
    pdf.sub_title("4. Full Prototype Explanation (Feature Walkthrough)")
    pdf.content_body("Let's walk through the actual prototype we built:\n\n"
                     "- /dashboard (Command Center): Shows 4 Primary KPI Cards (Active Patterns, Critical Precursors, Reports Analyzed, High Risk Sites). It also displays our Data Provenance Badge showing if data is Synthetic or Public.\n"
                     "- [DISCOVER HIDDEN SIF PATTERNS] Button: The core action. Clicking this runs our NLP clustering live in real-time, grouping scattered reports into clusters on our 'Emerging SIF Radar'.\n"
                     "- Emerging SIF Precursor Pattern Page: Clicking a specific pattern (e.g., 'Electrical Isolation') opens an executive 'WHY THIS MATTERS' banner. It shows how 30+ different reports across 4 facilities converged on a single failure.\n"
                     "- [CONNECT THE DOTS] Tab: An interactive causal network graph. The central node is the Precursor. Linked nodes are individual reports, failing barriers, and locations. You can click any node to see verbatim text snippets.\n"
                     "- Human-in-the-Loop Governance Banner: Features a [CONFIRM PATTERN] button. An expert reviews the AI, enters remarks, and submits it to a permanent audit trail.\n"
                     "- /actions (Closed-Loop Preventive Action): Here, experts click [CREATE PREVENTIVE ACTION] to assign tasks. Once done, they click [MARK COMPLETED WITH EVIDENCE] and the system tracks the percentage drop in incidents (e.g., -41.9% reduction).\n"
                     "- /barrier-health: Shows 0-100 scores for specific safety controls (like LOTO) and shows a trendline of their deterioration.\n"
                     "- Safety Copilot & What-If Simulator: A chatbot in the header where you can ask 'Which barrier is failing fastest?' and a slider to project how fixing a problem reduces future risk.")
                     
    # Member 3
    pdf.add_page()
    pdf.section_title("SPEAKER 3: DATASETS & ML MODELS")
    pdf.sub_title("1. Datasets Used")
    pdf.content_body("We strictly maintain data transparency and provenance. We do not use any proprietary Oil India Limited data yet.\n\n"
                     "1. Synthetic Demonstration Dataset (1,000 records): Controlled near-miss observations modeling upstream oil & gas operations. We planted precursor clusters here to validate our algorithmic clustering.\n"
                     "2. IHM Stefanini Public Industrial Dataset (425 records): Real-world public industrial and mining incident descriptions to demonstrate real-world generalization.\n\n"
                     "We use a 'Data Profiler' that normalizes raw data into our canonical 'SafetyReport' schema, extracting Hazard Category and Control Failure dynamically.")
    
    pdf.sub_title("2. Machine Learning Models")
    pdf.content_body("We use a Hybrid AI approach without any paid API dependencies:\n\n"
                     "- Sentence-Transformers ('all-MiniLM-L6-v2'): A 22.7M parameter pretrained deep learning model. We use it out-of-the-box to generate 384-dimensional dense semantic vectors. It understands language context locally.\n"
                     "- DBSCAN (Density-Based Spatial Clustering of Applications with Noise): A Scikit-learn algorithm that clusters precomputed cosine distance matrices. Unlike k-means, it doesn't assume spherical clusters or need a fixed 'k', and it naturally segregates noise.\n"
                     "- Ontology & Regex Extraction: We use deterministic lexical tokenization aligned with IOGP Life-Saving Rules to pull verbatim evidence snippets out of text.")

    # Members 4, 5, 6
    pdf.add_page()
    pdf.section_title("SPEAKER 4, 5 & 6: FEASIBILITY, USP, COMPETITORS & SCALABILITY")
    
    pdf.sub_title("1. Feasibility & Viability")
    pdf.content_body("Feasibility: Highly feasible. Our system operates entirely offline using open-source Python libraries (FastAPI, Scikit-learn, SentenceTransformers). It requires no expensive GPUs for inference; batch vectorization runs on standard CPUs.\n\n"
                     "Viability: Very viable. Companies currently spend millions on manual incident review. This system integrates seamlessly into existing HSE (Health, Safety, Environment) workflows without disrupting them.")
    
    pdf.sub_title("2. Unique Selling Proposition (USP)")
    pdf.content_body("- 100% Local & Secure: Zero external API dependency (no OpenAI/GPT calls). Data never leaves the enterprise.\n"
                     "- Explainable AI (XAI): We don't just give a risk score. The 5-Factor SIF engine provides plain-English reasoning and contribution points.\n"
                     "- Closed-Loop Action: We track the exact percentage drop in precursors after a safety action is taken, closing the loop instead of just making a dashboard.")
                     
    pdf.sub_title("3. Existing Competitors")
    pdf.content_body("Most competitors (Enablon, Sphera) rely on Drop-down Menus or basic Keyword Search. If one worker writes 'live panel' and another writes 'equipment energized', keyword searches fail to connect them. SIF Sentinel uses dense semantic embeddings to map meaning, finding connections that keywords miss.")
    
    pdf.sub_title("4. Scalability")
    pdf.content_body("The current prototype uses local SQLite. However, it is architected with SQLAlchemy ORM. For production scalability, we can instantly migrate to PostgreSQL with 'pgvector' for highly scalable semantic similarity search across millions of records. The Next.js frontend uses App Router and SSR to easily scale.")
    
    pdf.sub_title("5. Future Scope")
    pdf.content_body("Supervised Learning Pathway: Once authorized to use large-scale proprietary E&P safety records (50,000+), we will fine-tune a domain-specific Transformer (like RoBERTa). This will introduce a Multi-Task Classifier Head for direct SIF Potential Probability and Barrier Failure prediction.")
    
    pdf.sub_title("6. Impact and Benefits")
    pdf.content_body("The ultimate benefit is saving lives. By identifying the deterioration of critical safety barriers before they fail completely, we shift safety management from Reactive (investigating accidents) to Preventive (managing precursors). It provides quantifiable metrics, like '-41.9% reduction in electrical near-misses', proving the ROI of safety interventions.")
    
    pdf.output("d:/Startups/SIF-Sentinel/SIH_Pitch_Deck_SIF_Sentinel.pdf")

if __name__ == "__main__":
    create_pitch_deck()
    print("PDF generated successfully.")
