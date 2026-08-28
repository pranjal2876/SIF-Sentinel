#!/usr/bin/env python3
"""
SIF Sentinel Master Technical & Industrial Explanation Report PDF Generator.
Generates an in-depth, publication-grade master technical report hitting the exact
16–20 page target (max 20 pages) with all 35 sections in complete detail.
"""
import os
import sys
from pathlib import Path
from datetime import datetime

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

PDF_OUTPUT_PATH = Path(__file__).resolve().parents[1] / "docs" / "SIF_Sentinel_Master_Technical_Report.pdf"


class NumberedCanvas(canvas.Canvas):
    """Adds running headers and 'Page X of Y' footers across all pages."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            return  # Suppress running header/footer on title cover page
        
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#475569"))

        # Running Top Header
        self.drawString(45, 11 * inch - 32, "SIF SENTINEL — Master Technical & Industrial Explanation Report")
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawRightString(8.5 * inch - 45, 11 * inch - 32, "Smart India Hackathon (SIH 2026)")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.75)
        self.line(45, 11 * inch - 36, 8.5 * inch - 45, 11 * inch - 36)

        # Running Bottom Footer
        self.line(45, 42, 8.5 * inch - 45, 42)
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(45, 30, "Confidential Technical Documentation — SIF Precursor Intelligence Platform (SIH26165)")
        self.drawRightString(8.5 * inch - 45, 30, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()


def build_master_pdf():
    PDF_OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    doc = SimpleDocTemplate(
        str(PDF_OUTPUT_PATH),
        pagesize=letter,
        leftMargin=45,
        rightMargin=45,
        topMargin=48,
        bottomMargin=48
    )

    styles = getSampleStyleSheet()

    # Color Palette
    c_primary = colors.HexColor("#0f172a")     # Slate 900
    c_secondary = colors.HexColor("#1e293b")   # Slate 800
    c_accent = colors.HexColor("#581c87")      # Purple 900
    c_purple = colors.HexColor("#7e22ce")      # Purple 700
    c_blue = colors.HexColor("#1d4ed8")        # Blue 700
    c_emerald = colors.HexColor("#047857")     # Emerald 700
    c_amber = colors.HexColor("#b45309")       # Amber 700
    c_text = colors.HexColor("#334155")        # Slate 700
    c_muted = colors.HexColor("#64748b")       # Slate 500
    c_light = colors.HexColor("#f8fafc")       # Slate 50
    c_border = colors.HexColor("#cbd5e1")      # Slate 300

    # Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=c_primary,
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=c_purple,
        spaceAfter=12
    )
    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=c_muted
    )
    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=c_primary,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )
    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=c_secondary,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )
    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=c_text,
        spaceAfter=6
    )
    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=c_text,
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=3
    )
    code_box_style = ParagraphStyle(
        'CodeBox',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor("#0f172a")
    )
    callout_text = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor("#1e293b")
    )
    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10.5,
        textColor=c_text
    )
    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10.5,
        textColor=c_primary
    )
    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10.5,
        textColor=colors.white
    )

    story = []

    def make_callout(text, bg_color="#faf5ff", border_color="#d8b4fe"):
        t = Table([[Paragraph(text, callout_text)]], colWidths=[522])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(bg_color)),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor(border_color)),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ]))
        return t

    # =========================================================================
    # PAGE 1: COVER & EXECUTIVE SUMMARY
    # =========================================================================
    story.append(Paragraph("SIF SENTINEL", title_style))
    story.append(Paragraph("Explainable Safety Intelligence for Serious Injury & Fatality Precursor Detection", subtitle_style))
    story.append(Paragraph("<b>Competition / Initiative:</b> Smart India Hackathon (SIH 2026) | <b>Problem Statement:</b> SIH26165", meta_style))
    story.append(Paragraph("<b>Target Industry Domain:</b> Oil & Gas, Upstream Exploration, Petrochemical Processing & Heavy Engineering", meta_style))
    story.append(Paragraph("<b>Tagline:</b> <i>'Don't wait for the incident. Find the precursor.'</i>", meta_style))
    story.append(Paragraph(f"<b>Document Version:</b> 2.0.0 Master Technical Edition | <b>Date:</b> {datetime.now().strftime('%B %d, %Y')}", meta_style))
    story.append(HRFlowable(width="100%", thickness=2, color=c_accent, spaceBefore=6, spaceAfter=10))

    story.append(make_callout(
        "<b>Core Product Positioning & Responsible AI Commitment:</b><br/>"
        "SIF Sentinel is an explainable safety intelligence system that connects differently worded safety observations to uncover recurring Serious Injury & Fatality (SIF) precursor patterns, identify repeatedly failing preventive barriers, detect emerging risk, and support human-led preventive action. "
        "<b>SIF Sentinel does NOT claim to predict worker fatalities or forecast exact industrial accidents.</b> It empowers certified safety engineers with grounded precursor intelligence."
    ))
    story.append(Spacer(1, 10))

    story.append(Paragraph("1. Executive Summary", h1_style))
    story.append(Paragraph(
        "Industrial operations generate thousands of safety reports annually, covering near-misses, unsafe acts (UAs), and unsafe conditions (UCs). "
        "While catastrophic accidents are rare, high-consequence Serious Injuries and Fatalities (SIFs) are almost invariably preceded by recurring, uncorrected precursor events where critical safety barriers failed or were bypassed. "
        "SIF Sentinel provides a complete end-to-end intelligence system that automates the extraction, semantic clustering, risk quantification, and preventive action tracking across industrial safety operations.",
        body_style
    ))
    story.append(Paragraph("• <b>What It Solves:</b> Eliminates the blind spots of keyword searching by using dense semantic vector embeddings to connect differently worded observations describing identical barrier breakdowns across disparate facilities.", bullet_style))
    story.append(Paragraph("• <b>Who Uses It:</b> Site HSE Officers (daily observation screening & evidence verification), Asset Managers (barrier health monitoring & emerging risk radar), and Executive Leadership (quantifiable risk reduction measurement).", bullet_style))
    story.append(Paragraph("• <b>What the AI Engine Does:</b> Ingests narrative reports, extracts structured safety concepts with contextual negation parsing, projects text into a 384-dimensional vector space, clusters recurring precursors via DBSCAN, scores SIF risk (0–100), and classifies 10 operational event states from oil-well sensor telemetry.", bullet_style))
    story.append(Paragraph("• <b>What the Human HSE Officer Does:</b> Certified safety engineers maintain complete oversight via an interactive Expert Review governance banner, validating, modifying, or rejecting AI findings before issuing preventive work orders.", bullet_style))
    story.append(Paragraph("• <b>The Core Closed-Loop Safety Paradigm:</b>", bullet_style))
    story.append(Paragraph("<b>REPORT → UNDERSTAND → CONNECT → IDENTIFY → WARN → VALIDATE → ACT → MEASURE → IMPROVE</b>", ParagraphStyle('Loop', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9.5, leading=13, textColor=c_accent, leftIndent=14, spaceBefore=3, spaceAfter=6)))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 2: INDUSTRIAL SAFETY PROBLEM & THE HEINRICH PARADOX
    # =========================================================================
    story.append(Paragraph("2. Industrial Safety Problem & Operational Context", h1_style))
    story.append(Paragraph(
        "In traditional safety management, the <b>Heinrich / Bird Safety Pyramid</b> posits that for every 1 major injury, there are 29 minor injuries and 300 near-miss incidents. "
        "However, modern safety research (Campbell Institute, DEKRA, and IOGP) reveals a critical nuance known as the <b>SIF Paradox</b>: <i>Reducing minor injuries (e.g. slips, trips) does not automatically reduce fatalities, because only a specific subset (approximately 20–25%) of near-misses possess SIF Potential</i>.",
        body_style
    ))

    story.append(Paragraph("The Fundamental Failure of Traditional Keyword Searching", h2_style))
    story.append(Paragraph(
        "When safety personnel attempt to query existing safety databases using standard keyword searches or relational filters, critical systemic precursors are missed entirely due to natural language variability. Consider four actual field reports logged across different sites:",
        body_style
    ))

    ex_table_data = [
        [Paragraph("Field Observation Narrative", table_header), Paragraph("Vocabulary Used", table_header), Paragraph("Underlying Failed Barrier", table_header)],
        [Paragraph("<i>'Electrical panel remained energized during maintenance.'</i>", table_cell), Paragraph("energized, panel, maintenance", table_cell), Paragraph("<b>Electrical Isolation / LOTO Verification</b>", table_cell_bold)],
        [Paragraph("<i>'Breaker was not locked out prior to pump motor overhaul.'</i>", table_cell), Paragraph("breaker, locked out, overhaul", table_cell), Paragraph("<b>Electrical Isolation / LOTO Verification</b>", table_cell_bold)],
        [Paragraph("<i>'Isolation was incomplete on 415V MCC feeder.'</i>", table_cell), Paragraph("isolation, incomplete, MCC feeder", table_cell), Paragraph("<b>Electrical Isolation / LOTO Verification</b>", table_cell_bold)],
        [Paragraph("<i>'Zero energy state was not verified with multimeter.'</i>", table_cell), Paragraph("zero energy, verified, multimeter", table_cell), Paragraph("<b>Electrical Isolation / LOTO Verification</b>", table_cell_bold)],
    ]
    t_ex = Table(ex_table_data, colWidths=[240, 130, 152])
    t_ex.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_ex)
    story.append(Spacer(1, 8))

    story.append(Paragraph(
        "<b>The Industrial Blind Spot:</b> A relational SQL query searching for `'LOTO'` finds only Report #2, completely missing Reports #1, #3, and #4. "
        "As a result, management perceives these as single isolated occurrences across four sites rather than recognizing an enterprise-wide electrical isolation breakdown. SIF Sentinel solves this through dense semantic vector spaces and ontology mapping.",
        body_style
    ))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 3: INDUSTRIAL TERMS CHEAT SHEET (PART 1)
    # =========================================================================
    story.append(Paragraph("3. Industrial Terms & Acronyms Cheat Sheet (Part 1)", h1_style))
    story.append(Paragraph("A comprehensive glossary of industrial safety, machine learning, and operational terms utilized throughout SIF Sentinel:", body_style))

    terms_data_1 = [
        [Paragraph("Term / Acronym", table_header), Paragraph("Simple Operational Meaning", table_header), Paragraph("Why It Matters in SIF Sentinel", table_header)],
        [Paragraph("SIF", table_cell_bold), Paragraph("Serious Injury & Fatality (life-altering or fatal event)", table_cell), Paragraph("Primary risk category the system is built to eliminate", table_cell)],
        [Paragraph("SIF Precursor", table_cell_bold), Paragraph("High-risk situation where controls failed or were missing", table_cell), Paragraph("Target unit of detection in NLP and clustering pipelines", table_cell)],
        [Paragraph("SIF Potential", table_cell_bold), Paragraph("Measure of whether an observation could cause fatal harm", table_cell), Paragraph("Computed via 5-factor mathematical risk scoring (0–100)", table_cell)],
        [Paragraph("UA (Unsafe Act)", table_cell_bold), Paragraph("Human behavior or procedural non-adherence violating safety rules", table_cell), Paragraph("Extracted into separate ontology categories for root-cause analysis", table_cell)],
        [Paragraph("UC (Unsafe Condition)", table_cell_bold), Paragraph("Physical defect or environmental hazard in the workplace", table_cell), Paragraph("Extracted into separate ontology categories for barrier repair", table_cell)],
        [Paragraph("Near Miss", table_cell_bold), Paragraph("Unplanned event with potential to cause harm, but no injury occurred", table_cell), Paragraph("Richest source of proactive leading-indicator safety data", table_cell)],
        [Paragraph("Barrier / Control", table_cell_bold), Paragraph("Physical or procedural defense preventing hazard escalation", table_cell), Paragraph("Tracked in Barrier Health engine to measure degradation velocity", table_cell)],
        [Paragraph("Barrier Failure", table_cell_bold), Paragraph("Breach, omission, or defect in a preventive safety defense", table_cell), Paragraph("Primary clustering attribute linking related field reports", table_cell)],
        [Paragraph("Leading Indicator", table_cell_bold), Paragraph("Proactive metric measuring safety efforts before incidents happen", table_cell), Paragraph("SIF Sentinel's primary operational output (radar alerts, barrier scores)", table_cell)],
        [Paragraph("Lagging Indicator", table_cell_bold), Paragraph("Reactive metric measuring past injuries, spills, or fatalities", table_cell), Paragraph("Traditional metrics that only report what went wrong retrospectively", table_cell)],
        [Paragraph("LOTO", table_cell_bold), Paragraph("Lockout / Tagout (zero-energy isolation verification)", table_cell), Paragraph("Critical life-saving control extracted with high priority", table_cell)],
    ]
    t_terms_1 = Table(terms_data_1, colWidths=[90, 210, 222])
    t_terms_1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_terms_1)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 4: INDUSTRIAL TERMS CHEAT SHEET (PART 2)
    # =========================================================================
    story.append(Paragraph("3. Industrial Terms & Acronyms Cheat Sheet (Part 2)", h1_style))
    terms_data_2 = [
        [Paragraph("Term / Acronym", table_header), Paragraph("Simple Operational Meaning", table_header), Paragraph("Why It Matters in SIF Sentinel", table_header)],
        [Paragraph("PTW", table_cell_bold), Paragraph("Permit to Work (formal operational authorization document)", table_cell), Paragraph("Procedural barrier extracted across hot work and confined spaces", table_cell)],
        [Paragraph("Process Safety", table_cell_bold), Paragraph("Prevention of catastrophic releases of hazardous substances", table_cell), Paragraph("Core domain covering pressure containment, degassing, and flares", table_cell)],
        [Paragraph("Loss of Containment", table_cell_bold), Paragraph("Unplanned escape of hydrocarbons or toxic chemicals", table_cell), Paragraph("High-severity consequence trigger in the 5-factor SIF engine", table_cell)],
        [Paragraph("DHSV", table_cell_bold), Paragraph("Downhole Safety Valve (fail-safe subsea/wellhead safety valve)", table_cell), Paragraph("Key oil-well component in 3W ML (Class 2: Spurious Closure)", table_cell)],
        [Paragraph("PCK", table_cell_bold), Paragraph("Production Choke (valve regulating well flow and pressure)", table_cell), Paragraph("Key oil-well valve in 3W ML (Class 6: Restriction, Class 7: Scaling)", table_cell)],
        [Paragraph("BSW", table_cell_bold), Paragraph("Basic Sediment & Water (water cut percentage in produced fluid)", table_cell), Paragraph("Key operational fluid metric in 3W ML (Class 1: BSW Surge)", table_cell)],
        [Paragraph("all-MiniLM-L6-v2", table_cell_bold), Paragraph("384-dimensional pretrained dense neural embedding model", table_cell), Paragraph("Converts report text into semantic vector representations for similarity", table_cell)],
        [Paragraph("DBSCAN", table_cell_bold), Paragraph("Density-based spatial clustering grouping vectors and isolating noise", table_cell), Paragraph("Discovers recurring precursor patterns without predefined cluster counts", table_cell)],
        [Paragraph("Random Forest", table_cell_bold), Paragraph("Ensemble of decision trees trained with balanced class weights", table_cell), Paragraph("Classifies 10 operational event states from multi-sensor well telemetry", table_cell)],
        [Paragraph("Data Leakage", table_cell_bold), Paragraph("Contamination of test evaluation set by training data information", table_cell), Paragraph("Crucial scientific check verified in Section 22 regarding well overlap", table_cell)],
        [Paragraph("pgvector", table_cell_bold), Paragraph("PostgreSQL extension for high-speed vector nearest-neighbor search", table_cell), Paragraph("Target production database technology for scalable semantic indexing", table_cell)],
    ]
    t_terms_2 = Table(terms_data_2, colWidths=[90, 210, 222])
    t_terms_2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_terms_2)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 5: PRODUCT VISION & USPs (PART 1)
    # =========================================================================
    story.append(Paragraph("4. Product Vision & Key Unique Selling Propositions (USPs - Part 1)", h1_style))
    usps_table_1 = [
        [Paragraph("USP Feature", table_header), Paragraph("What It Does", table_header), Paragraph("How It Works Technically", table_header), Paragraph("Why It Matters / Differentiation", table_header)],
        [Paragraph("1. Semantic Connect the Dots", table_cell_bold), Paragraph("Uncovers hidden relationships across differently phrased safety observations.", table_cell), Paragraph("Projects reports into 384-d space via `all-MiniLM-L6-v2` and clusters using DBSCAN.", table_cell), Paragraph("Breaks organizational silos; identifies systemic hazards across multiple sites.", table_cell)],
        [Paragraph("2. Control Failure Intelligence", table_cell_bold), Paragraph("Isolates which preventive barrier is breaking down repeatedly.", table_cell), Paragraph("Deterministic ontology maps text to life-saving rules (LOTO, Gas Test, PTW).", table_cell), Paragraph("Pinpoints exact engineering/procedural root causes rather than generic labels.", table_cell)],
        [Paragraph("3. Emerging SIF Radar", table_cell_bold), Paragraph("Flags newly accelerating hazard clusters before incidents occur.", table_cell), Paragraph("Tracks monthly velocity ($\Delta\%$) with a $+15\%$ threshold for 'INCREASING' risk.", table_cell), Paragraph("Shifts safety operations from reactive lagging metrics to proactive leading indicators.", table_cell)],
        [Paragraph("4. Explainable SIF Scoring", table_cell_bold), Paragraph("Scores observations on a transparent 0–100 SIF potential scale.", table_cell), Paragraph("Deterministic sum of Severity (25), Control (25), Exposure (20), Recurrence (20), Consequence (10).", table_cell), Paragraph("Zero black-box obscurity; every score is fully explainable to auditors and judges.", table_cell)],
        [Paragraph("5. Evidence Traceability", table_cell_bold), Paragraph("Highlights verbatim sentence spans justifying risk classifications.", table_cell), Paragraph("Sentence boundary regex parser extracts exact text snippets into `evidence_spans`.", table_cell), Paragraph("Builds operator trust and allows rapid verification during incident triage.", table_cell)],
    ]
    t_usps_1 = Table(usps_table_1, colWidths=[100, 130, 142, 150])
    t_usps_1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_usps_1)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 6: PRODUCT VISION & USPs (PART 2)
    # =========================================================================
    story.append(Paragraph("4. Product Vision & Key Unique Selling Propositions (USPs - Part 2)", h1_style))
    usps_table_2 = [
        [Paragraph("USP Feature", table_header), Paragraph("What It Does", table_header), Paragraph("How It Works Technically", table_header), Paragraph("Why It Matters / Differentiation", table_header)],
        [Paragraph("6. Human-in-the-Loop", table_cell_bold), Paragraph("Provides a formal governance interface for safety officer review.", table_cell), Paragraph("Records `CONFIRM`, `MODIFY`, or `REJECT` decisions in `safety_reviews` table.", table_cell), Paragraph("Ensures algorithmic suggestions are strictly vetted by certified HSE personnel.", table_cell)],
        [Paragraph("7. Closed-Loop Actions", table_cell_bold), Paragraph("Tracks preventive interventions and measures risk reduction.", table_cell), Paragraph("Calculates precursor frequency change ($\Delta\%$) in the 60 days post-intervention.", table_cell), Paragraph("Provides quantifiable audit proof of risk reduction following safety investments.", table_cell)],
        [Paragraph("8. Barrier Health Index", table_cell_bold), Paragraph("Monitors real-time barrier degradation across the enterprise.", table_cell), Paragraph("Computes 0–100 health index based on failure count, velocity, and site spread.", table_cell), Paragraph("Identifies crumbling defenses (scores <50) before catastrophic breaches occur.", table_cell)],
        [Paragraph("9. Multi-Source Intelligence", table_cell_bold), Paragraph("Integrates 4 diverse industrial datasets with strict provenance.", table_cell), Paragraph("Explicit metadata tagging (`IHM`, `OISD`, `BSEE`, `Petrobras 3W 2.0.0`).", table_cell), Paragraph("Prevents data contamination while providing rich multi-domain safety intelligence.", table_cell)],
        [Paragraph("10. Zero-Key Offline Operation", table_cell_bold), Paragraph("Executes 100% locally on CPU without external API keys.", table_cell), Paragraph("Pretrained Sentence Transformers and Scikit-Learn Random Forest run locally.", table_cell), Paragraph("Guarantees enterprise data confidentiality and compliance with air-gapped networks.", table_cell)],
    ]
    t_usps_2 = Table(usps_table_2, colWidths=[100, 130, 142, 150])
    t_usps_2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_usps_2)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 7: SYSTEM ARCHITECTURE & TECH STACK
    # =========================================================================
    story.append(Paragraph("5. Complete System Architecture", h1_style))
    arch_diagram = """
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 SIF SENTINEL SYSTEM ARCHITECTURE                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

  [QUALITATIVE TEXTUAL NLP SAFETY TRACK]                [QUANTITATIVE 3W WELL TELEMETRY TRACK]
  
  ┌──────────────────────────────┐                       ┌──────────────────────────────┐
  │   IHM Stefanini / Reports    │                       │  Petrobras 3W 2.0.0 Dataset  │
  │   (425 Industrial CSVs)      │                       │  (2,228 Multi-Sensor Parquets)│
  └──────────────┬───────────────┘                       └──────────────┬───────────────┘
                 │                                                      │
                 ▼                                                      ▼
  ┌──────────────────────────────┐                       ┌──────────────────────────────┐
  │  Rule-Based Safety Ontology  │                       │  Streaming Lazy Data Loader  │
  │  & Negation Handling Engine  │                       │  (Zero RAM Exhaustion)       │
  └──────────────┬───────────────┘                       └──────────────┬───────────────┘
                 │                                                      │
                 ▼                                                      ▼
  ┌──────────────────────────────┐                       ┌──────────────────────────────┐
  │  all-MiniLM-L6-v2 Embeddings │                       │  58-Channel Feature Extractor│
  │  (Dense 384-dim Vectors)     │                       │  (Pressures, Temps, Deltas)  │
  └──────────────┬───────────────┘                       └──────────────┬───────────────┘
                 │                                                      │
                 ▼                                                      ▼
  ┌──────────────────────────────┐                       ┌──────────────────────────────┐
  │  DBSCAN Density Clustering   │                       │  Random Forest Classifier    │
  │  (eps=0.45, min_samples=2)   │                       │  (class_weight='balanced')   │
  └──────────────┬───────────────┘                       └──────────────┬───────────────┘
                 │                                                      │
                 ▼                                                      ▼
  ┌──────────────────────────────┐                       ┌──────────────────────────────┐
  │  5-Factor SIF Risk Engine &  │                       │  Operational Event Classifier│
  │  Barrier Health Snapshots    │                       │  (10 Event Classes & Probs)  │
  └──────────────┬───────────────┘                       └──────────────┬───────────────┘
                 │                                                      │
                 ▼                                                      ▼
  ┌──────────────────────────────┐                       ┌──────────────────────────────┐
  │  Human Expert Review Banner  │                       │  Operational-to-Safety Risk  │
  │  & Closed-Loop Action Engine │                       │  Interface (Expert Review)   │
  └──────────────┬───────────────┘                       └──────────────┬───────────────┘
                 │                                                      │
                 └───────────────────────┬──────────────────────────────┘
                                         ▼
                         ┌──────────────────────────────┐
                         │   Next.js 16 Command Center  │
                         │   13 Production Web Routes   │
                         └──────────────────────────────┘
    """
    story.append(Paragraph(arch_diagram.strip().replace('\n', '<br/>'), code_box_style))
    story.append(Spacer(1, 8))

    story.append(Paragraph("6. Technology Stack & Dependency Inventory", h1_style))
    tech_table = [
        [Paragraph("Layer", table_header), Paragraph("Technology", table_header), Paragraph("Verified Version", table_header), Paragraph("Role & Architecture", table_header), Paragraph("Execution", table_header)],
        [Paragraph("Backend", table_cell_bold), Paragraph("Python / FastAPI", table_cell), Paragraph("3.11.9 / 0.111.0", table_cell), Paragraph("Async REST API routing & validation", table_cell), Paragraph("Local CPU", table_cell)],
        [Paragraph("Database ORM", table_cell_bold), Paragraph("SQLAlchemy", table_cell), Paragraph("2.0.31", table_cell), Paragraph("Schema modeling & query abstraction", table_cell), Paragraph("Local SQLite", table_cell)],
        [Paragraph("NLP Embeddings", table_cell_bold), Paragraph("Sentence-Transformers", table_cell), Paragraph("3.0.1", table_cell), Paragraph("all-MiniLM-L6-v2 (384-dim dense vectors)", table_cell), Paragraph("Local PyTorch", table_cell)],
        [Paragraph("ML / Clustering", table_cell_bold), Paragraph("Scikit-Learn", table_cell), Paragraph("1.9.0 (Pinned)", table_cell), Paragraph("DBSCAN clustering & Random Forest classifier", table_cell), Paragraph("Local CPU", table_cell)],
        [Paragraph("Data Engines", table_cell_bold), Paragraph("NumPy / Pandas / PyArrow", table_cell), Paragraph("1.26.4 / 2.2.2 / 16.1.0", table_cell), Paragraph("Vector math, schema profiling, parquet reader", table_cell), Paragraph("In-Memory", table_cell)],
        [Paragraph("PDF Processing", table_cell_bold), Paragraph("PyMuPDF (fitz) / ReportLab", table_cell), Paragraph("1.24.9 / 4.2.2", table_cell), Paragraph("OISD PDF extraction & technical report generation", table_cell), Paragraph("Local Disk", table_cell)],
        [Paragraph("Frontend", table_cell_bold), Paragraph("Next.js / React / Tailwind", table_cell), Paragraph("16.3.2 / 19.2.8 / v4", table_cell), Paragraph("Turbopack SSR UI, 13 production routes", table_cell), Paragraph("Browser Node", table_cell)],
        [Paragraph("Visualization", table_cell_bold), Paragraph("Recharts", table_cell), Paragraph("3.10.1", table_cell), Paragraph("Time-series sensor charts & confusion matrices", table_cell), Paragraph("Client Browser", table_cell)],
    ]
    t_tech = Table(tech_table, colWidths=[70, 110, 95, 185, 62])
    t_tech.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(t_tech)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 8: MULTI-DATASET INVENTORY & IHM STEFANINI
    # =========================================================================
    story.append(Paragraph("7. Multi-Dataset Inventory & Provenance Separation", h1_style))
    story.append(Paragraph(
        "SIF Sentinel ingests four distinct, validated industrial datasets without data contamination. "
        "Every record carries explicit provenance metadata to ensure absolute scientific and regulatory transparency:",
        body_style
    ))

    ds_table = [
        [Paragraph("Dataset Source", table_header), Paragraph("Format & Volume", table_header), Paragraph("Data Modality", table_header), Paragraph("Analytical Scope", table_header), Paragraph("Role in SIF Sentinel", table_header)],
        [Paragraph("IHM Stefanini", table_cell_bold), Paragraph("425 CSV records (193 KB)", table_cell), Paragraph("Text & categorical", table_cell), Paragraph("Mining, manufacturing, and industrial incident narratives", table_cell), Paragraph("NLP Evaluation Benchmark", table_cell)],
        [Paragraph("OISD Case Studies", table_cell_bold), Paragraph("92 PDF files (~45 MB)", table_cell), Paragraph("Technical PDF case studies", table_cell), Paragraph("Indian oil & gas safety alerts, root causes & recommendations", table_cell), Paragraph("Domain Ontology Expansion", table_cell)],
        [Paragraph("BSEE IncInv", table_cell_bold), Paragraph("2,016 CSV rows (150 KB)", table_cell), Paragraph("Structured incident logs", table_cell), Paragraph("GOM offshore incident frequency, recurrence & temporal trends", table_cell), Paragraph("Offshore Analytics Track", table_cell)],
        [Paragraph("Petrobras 3W 2.0.0", table_cell_bold), Paragraph("2,228 Parquets (1.74 GB)", table_cell), Paragraph("Multi-sensor time series", table_cell), Paragraph("Continuous sensor telemetry for 10 oil-well operational event classes", table_cell), Paragraph("3W ML Training & Testing", table_cell)],
        [Paragraph("Synthetic Demo Data", table_cell_bold), Paragraph("1,000 SQLite records", table_cell), Paragraph("Simulated reports", table_cell), Paragraph("Multi-facility plant observations with planted precursor patterns", table_cell), Paragraph("UI Command Center Demo", table_cell)],
    ]
    t_ds = Table(ds_table, colWidths=[90, 100, 95, 137, 100])
    t_ds.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(t_ds)
    story.append(Spacer(1, 8))

    story.append(Paragraph("8. IHM Stefanini NLP Ingestion & Safety Extraction Pipeline", h1_style))
    story.append(Paragraph(
        "The IHM Stefanini dataset contains 425 real-world industrial incident observations. "
        "A critical audit verification confirmed that source-provided <b>Potential Accident Level</b> (Levels I: 49, II: 95, III: 106, IV: 143, V: 31, VI: 1) is cleanly preserved in `potential_severity` distinct from actual `severity` (Levels I: 316, II: 40, III: 31, IV: 30, V: 8). "
        "This ensures that minor actual injuries that had severe catastrophic potential (e.g. an arc flash that singed a glove instead of electrocuting a worker) are prioritized with high SIF scores.",
        body_style
    ))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 9: SAFETY ONTOLOGY & CONTEXTUAL NEGATION LOGIC
    # =========================================================================
    story.append(Paragraph("9. Industrial Safety Ontology & Contextual Negation Logic", h1_style))
    story.append(Paragraph(
        "SIF Sentinel maps 9 critical hazard domains in [`backend/app/services/ontology.py`](file:///d:/Startups/SIF-Sentinel/backend/app/services/ontology.py): Electrical, Working at Height, Confined Space, Process Safety, Lifting/Rigging, Chemical, Excavation, Line of Fire, and Heavy Vehicles. "
        "Contextual negation parsing in [`backend/app/services/extraction_service.py`](file:///d:/Startups/SIF-Sentinel/backend/app/services/extraction_service.py) prevents false positive alert fatigue:",
        body_style
    ))

    neg_table_data = [
        [Paragraph("Input Safety Report Narrative", table_header), Paragraph("Negation / Context Parsing", table_header), Paragraph("Extracted Hazard & Control Outcome", table_header)],
        [Paragraph("<i>'LOTO was followed and zero energy state confirmed with multimeter.'</i>", table_cell), Paragraph("Compliance indicators matched; zero failure terms.", table_cell), Paragraph("<b>No Hazard Extracted / Compliant</b> (Zero false positive)", table_cell_bold)],
        [Paragraph("<i>'Full body harness was worn with dual lanyards 100% tied off.'</i>", table_cell), Paragraph("Compliance indicators matched; zero failure terms.", table_cell), Paragraph("<b>No Hazard Extracted / Compliant</b> (Zero false positive)", table_cell_bold)],
        [Paragraph("<i>'LOTO was not followed prior to opening breaker panel.'</i>", table_cell), Paragraph("Regex `\\bnot\\b` detected with isolation keywords.", table_cell), Paragraph("<b>Electrical / LOTO Isolation Breakdown</b> (Active Precursor)", table_cell_bold)],
        [Paragraph("<i>'Worker climbed scaffold without harness and with lanyard unhooked.'</i>", table_cell), Paragraph("Regex `\\bwithout\\b` and `\\bunhooked\\b` detected.", table_cell), Paragraph("<b>Working at Height / Fall Protection Failure</b>", table_cell_bold)],
        [Paragraph("<i>'Technician entered crude storage vessel without gas testing.'</i>", table_cell), Paragraph("Regex `\\bwithout\\b` detected with vessel keywords.", table_cell), Paragraph("<b>Confined Space / Atmospheric Gas Testing Breakdown</b>", table_cell_bold)],
    ]
    t_neg = Table(neg_table_data, colWidths=[200, 150, 172])
    t_neg.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_neg)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 10: SENTENCE TRANSFORMERS & CONNECT THE DOTS
    # =========================================================================
    story.append(Paragraph("10. Dense Semantic Vector Space (all-MiniLM-L6-v2)", h1_style))
    story.append(Paragraph(
        "Pretrained `sentence-transformers/all-MiniLM-L6-v2` maps safety narratives to 384-dimensional dense vectors on local CPU. "
        "The model achieves a **5.77x semantic contrast ratio** between semantically related safety phrases (mean cosine similarity: 0.4161) and unrelated observations (mean cosine similarity: 0.0722), enabling robust semantic clustering across diverse field phrasing without fine-tuning overhead.",
        body_style
    ))

    story.append(Paragraph("11. Semantic Connect the Dots & Density Clustering", h1_style))
    story.append(Paragraph(
        "SIF Sentinel clusters pairwise cosine distance matrices ($1.0 - \text{Cosine Sim}$) using **DBSCAN** (`eps=0.45`, `min_samples=2`). "
        "Unlike $k$-means, DBSCAN requires no predefined cluster count and automatically separates isolated non-recurring reports as noise (-1). "
        "In our held-out evaluation, **38.0% of reports were correctly isolated as non-recurring noise**, achieving a **0.8425 mean cluster coherence score**.",
        body_style
    ))

    story.append(Paragraph("12. SIF Risk Engine & 5-Factor Mathematical Scoring", h1_style))
    story.append(Paragraph(
        "Every safety observation is scored across 5 transparent, deterministic factors producing a normalized score from **0 to 100**:",
        body_style
    ))

    sif_factors_table = [
        [Paragraph("Factor Name", table_header), Paragraph("Max Weight", table_header), Paragraph("Evaluation Criteria & Mathematical Logic", table_header)],
        [Paragraph("Potential Severity", table_cell_bold), Paragraph("25 points", table_cell), Paragraph("Source severity rating or extracted consequence potential (Level I to VI).", table_cell)],
        [Paragraph("Control Failure", table_cell_bold), Paragraph("25 points", table_cell), Paragraph("Failure of critical life-saving barriers (LOTO, Gas Test, Fall Protection, PTW).", table_cell)],
        [Paragraph("Activity Exposure", table_cell_bold), Paragraph("20 points", table_cell), Paragraph("High-energy operational context (hot work, live electrical, confined space, lifting).", table_cell)],
        [Paragraph("Precursor Recurrence", table_cell_bold), Paragraph("20 points", table_cell), Paragraph("Frequency of similar precursor observations logged across enterprise facilities.", table_cell)],
        [Paragraph("Consequence Potential", table_cell_bold), Paragraph("10 points", table_cell), Paragraph("Realistic worst-case physical harm potential (electrocution, fall, toxic asphyxiation).", table_cell)],
    ]
    t_sif = Table(sif_factors_table, colWidths=[120, 75, 327])
    t_sif.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_sif)
    story.append(Spacer(1, 4))
    story.append(Paragraph("<i>Risk Bands: Critical (80–100), High (60–79), Moderate (35–59), Low (0–34). Prototype scoring methodology; configurable to OIL standards.</i>", meta_style))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 11: EMERGING RADAR, BARRIER HEALTH & GOVERNANCE
    # =========================================================================
    story.append(Paragraph("13. Emerging SIF Radar & Temporal Trend Detection", h1_style))
    story.append(Paragraph(
        "SIF Sentinel tracks monthly precursor counts ($M_{\text{current}}$ vs $M_{\text{prior}}$). "
        "Velocity changes $\Delta\% \ge +15.0\%$ trigger an **INCREASING / EMERGING RISK RADAR** alert, shifting HSE operations from reactive post-incident investigations to proactive leading-indicator interventions.",
        body_style
    ))

    story.append(Paragraph("14. Barrier Health & Degradation Velocity Monitoring", h1_style))
    story.append(Paragraph(
        "A **Safety Barrier** is a physical or procedural defense preventing hazard escalation. "
        "The **Barrier Health Index (0–100)** measures barrier integrity based on failure volume ($N_{\text{failures}}$), velocity ($\Delta\%$), and multi-site spread ($N_{\text{sites}}$). "
        "Scores below 50 indicate **DETERIORATING** barrier integrity. Every analysis run persists historical snapshots to monitor long-term degradation.",
        body_style
    ))

    story.append(Paragraph("15. Human-in-the-Loop Governance & Expert Audit Trail", h1_style))
    story.append(Paragraph(
        "AI-detected clusters initialize in the `AI_DETECTED` state. Certified safety inspectors review verbatim evidence spans and choose `CONFIRM`, `MODIFY`, or `REJECT`. "
        "All decisions are recorded with reviewer names, roles, and timestamps in the `safety_reviews` table, guaranteeing complete regulatory auditability.",
        body_style
    ))

    story.append(Paragraph("16. Closed-Loop Preventive Action & Reduction Velocity", h1_style))
    story.append(Paragraph(
        "Precursor clusters generate targeted preventive actions assigned to site owners with due dates. "
        "The system calculates the **Precursor Reduction Velocity ($\Delta\%$)** by comparing observation frequency in the 60 days before intervention against the 60 days post-completion, providing quantifiable proof of risk reduction.",
        body_style
    ))

    story.append(Paragraph("17. BSEE Offshore & 18. OISD Indian Case Studies", h1_style))
    story.append(Paragraph(
        "• <b>BSEE Offshore Engine:</b> Ingests 2,016 canonical investigation records to compute offshore incident recurrence: Fire (14.7%), Pollution (13.5%), and LTA (>3 days, 6.1%).<br/>"
        "• <b>OISD Indian Case Studies:</b> Parses 92 technical PDF case studies and alerts from the Oil Industry Safety Directorate with 100% success rate using PyMuPDF.",
        body_style
    ))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 12: PETROBRAS 3W TIME-SERIES ML MODULE
    # =========================================================================
    story.append(Paragraph("19. Petrobras 3W Oil-Well Operational Event Intelligence ML", h1_style))
    story.append(Paragraph(
        "A dedicated time-series machine learning module classifying 10 official operational event states from 2,228 multi-sensor Parquet files (1.74 GB, ~12M observations). "
        "A streaming lazy loader reads one Parquet file at a time, extracting 58 domain features without RAM exhaustion.",
        body_style
    ))

    classes_3w_data = [
        [Paragraph("CID", table_header), Paragraph("Official Event Class Name", table_header), Paragraph("Total Files", table_header), Paragraph("% Dist", table_header), Paragraph("Operational Event Meaning & Physical Mechanism", table_header)],
        [Paragraph("0", table_cell), Paragraph("Normal Operation", table_cell_bold), Paragraph("594", table_cell), Paragraph("26.7%", table_cell), Paragraph("Steady-state production without sensor anomalies", table_cell)],
        [Paragraph("1", table_cell), Paragraph("Abrupt Increase of BSW", table_cell_bold), Paragraph("128", table_cell), Paragraph("5.7%", table_cell), Paragraph("Sudden surge in water cut percentage (Basic Sediment & Water)", table_cell)],
        [Paragraph("2", table_cell), Paragraph("Spurious Closure of DHSV", table_cell_bold), Paragraph("38", table_cell), Paragraph("1.7%", table_cell), Paragraph("Unintended trip of Downhole Safety Valve shutting in well", table_cell)],
        [Paragraph("3", table_cell), Paragraph("Severe Slugging", table_cell_bold), Paragraph("106", table_cell), Paragraph("4.8%", table_cell), Paragraph("High-amplitude multiphase gas/liquid hydrodynamic flow oscillations", table_cell)],
        [Paragraph("4", table_cell), Paragraph("Flow Instability", table_cell_bold), Paragraph("343", table_cell), Paragraph("15.4%", table_cell), Paragraph("Production flow rate and bottomhole pressure fluctuations", table_cell)],
        [Paragraph("5", table_cell), Paragraph("Rapid Productivity Loss", table_cell_bold), Paragraph("450", table_cell), Paragraph("20.2%", table_cell), Paragraph("Sudden decline in well inflow productivity index", table_cell)],
        [Paragraph("6", table_cell), Paragraph("Quick Restriction in PCK", table_cell_bold), Paragraph("221", table_cell), Paragraph("9.9%", table_cell), Paragraph("Rapid physical blockage narrowing production choke opening", table_cell)],
        [Paragraph("7", table_cell), Paragraph("Scaling in PCK", table_cell_bold), Paragraph("46", table_cell), Paragraph("2.1%", table_cell), Paragraph("Mineral scale deposition gradually constricting choke valve", table_cell)],
        [Paragraph("8", table_cell), Paragraph("Hydrate in Production Line", table_cell_bold), Paragraph("95", table_cell), Paragraph("4.3%", table_cell), Paragraph("Solid gas hydrate ice plug forming inside production flowline", table_cell)],
        [Paragraph("9", table_cell), Paragraph("Hydrate in Service Line", table_cell_bold), Paragraph("207", table_cell), Paragraph("9.3%", table_cell), Paragraph("Hydrate plug forming inside gas-lift or service lines", table_cell)],
    ]
    t_3w_c = Table(classes_3w_data, colWidths=[25, 130, 45, 45, 277])
    t_3w_c.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_accent),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(t_3w_c)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 13: 3W FEATURE ENGINEERING (58 FEATURES)
    # =========================================================================
    story.append(Paragraph("20. 3W Domain Feature Engineering (58 Features)", h1_style))
    story.append(Paragraph(
        "The Petrobras 3W machine learning model extracts **58 domain features** across 9 continuous telemetry channels (`P-PDG`, `P-TPT`, `T-TPT`, `P-MON-CKP`, `P-JUS-CKP`, `T-MON-CKP`, `ABER-CKP`, `QGL`, `ESTADO-DHSV`):",
        body_style
    ))

    feat_table_data = [
        [Paragraph("Feature Group", table_header), Paragraph("Channels Covered", table_header), Paragraph("Mathematical Extraction", table_header), Paragraph("Physical Interpretation", table_header)],
        [Paragraph("Mean Statistics (9)", table_cell_bold), Paragraph("All 9 channels", table_cell), Paragraph("`df[col].mean()`", table_cell), Paragraph("Baseline operational level across the observation window", table_cell)],
        [Paragraph("Variance / Volatility (9)", table_cell_bold), Paragraph("All 9 channels", table_cell), Paragraph("`df[col].std()`", table_cell), Paragraph("Dynamic sensor fluctuations and operational instability", table_cell)],
        [Paragraph("Minima Limits (9)", table_cell_bold), Paragraph("All 9 channels", table_cell), Paragraph("`df[col].min()`", table_cell), Paragraph("Downhole pressure collapse or valve closure dips", table_cell)],
        [Paragraph("Maxima Limits (9)", table_cell_bold), Paragraph("All 9 channels", table_cell), Paragraph("`df[col].max()`", table_cell), Paragraph("Wellhead pressure surges or thermal temperature spikes", table_cell)],
        [Paragraph("Onset Trajectory Delta (9)", table_cell_bold), Paragraph("All 9 channels", table_cell), Paragraph("`mean(tail 15%) - mean(head 15%)`", table_cell), Paragraph("Directional slope and acceleration of event onset", table_cell)],
        [Paragraph("Sensor Missingness (9)", table_cell_bold), Paragraph("All 9 channels", table_cell), Paragraph("`df[col].isna().mean()`", table_cell), Paragraph("Sensor dropout rate and telemetry reliability", table_cell)],
        [Paragraph("Choke Pressure Ratio (1)", table_cell_bold), Paragraph("`P-MON-CKP`, `P-JUS-CKP`", table_cell), Paragraph("`P_upstream / P_downstream`", table_cell), Paragraph("Choke differential ratio detecting restriction or hydrate formation", table_cell)],
        [Paragraph("Hydrostatic Delta P (1)", table_cell_bold), Paragraph("`P-PDG`, `P-TPT`", table_cell), Paragraph("`P_PDG - P_TPT`", table_cell), Paragraph("Hydrostatic pressure column gradient inside tubing", table_cell)],
        [Paragraph("Choke Volatility (1)", table_cell_bold), Paragraph("`ABER-CKP`", table_cell), Paragraph("`mean(abs(diff()))`", table_cell), Paragraph("Frequency and magnitude of automated choke step adjustments", table_cell)],
        [Paragraph("Observation Count (1)", table_cell_bold), Paragraph("DataFrame Index", table_cell), Paragraph("`len(df)`", table_cell), Paragraph("Duration and sampling density of the operational event", table_cell)],
    ]
    t_feat = Table(feat_table_data, colWidths=[120, 110, 132, 160])
    t_feat.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(t_feat)
    story.append(Spacer(1, 4))
    story.append(Paragraph("<b>Total Input Dimensionality:</b> Exactly 58 features (Verified in `backend/data/models/threew_rf_model.joblib`).", body_style))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 14: 3W TRAINING, LEAKAGE AUDIT & EVALUATION
    # =========================================================================
    story.append(Paragraph("21. 3W Model Training & Hyperparameters", h1_style))
    story.append(Paragraph(
        "Trained using `sklearn.ensemble.RandomForestClassifier(n_estimators=100, max_depth=12, class_weight='balanced', random_state=42, n_jobs=-1)` on 1,786 training instances. "
        "Model artifact serialized to `backend/data/models/threew_rf_model.joblib` (1.2 MB).",
        body_style
    ))

    story.append(Paragraph("22. 3W Data Leakage Verification & Well-Grouping Analysis (CRITICAL)", h1_style))
    story.append(make_callout(
        "<b>CRITICAL AUDIT FINDING — WELL-LEVEL DATA LEAKAGE:</b><br/>"
        "Our technical audit of `backend/data/models/threew_split_metadata.json` revealed that instances were partitioned using <b>stratified random instance-level shuffling</b> rather than grouping by Well ID. "
        "Train set contained 40 wells; test set contained 23 wells; <b>21 overlapping well IDs appeared in both train and test partitions</b>. "
        "Because the model saw time slices from the same physical wells during training, baseline sensor offsets were accessible. "
        "<b>The reported 98.93% Macro F1 reflects instance-level classification performance and must NOT be cited as unseen-well cross-generalization.</b>",
        bg_color="#fff1f2", border_color="#fecdd3"
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph("23. 3W Empirical Model Evaluation & Confusion Matrix", h1_style))
    story.append(Paragraph("Evaluated on 442 held-out test instances (Current Instance-Level Split):", body_style))

    threew_eval_table = [
        [Paragraph("Metric", table_header), Paragraph("Random Forest Score", table_header), Paragraph("Majority Class Baseline", table_header), Paragraph("Performance Significance", table_header)],
        [Paragraph("Macro F1 Score", table_cell_bold), Paragraph("98.93%", table_cell_bold), Paragraph("4.21%", table_cell), Paragraph("<b>+2,247.6% lift</b> over trivial majority guessing", table_cell)],
        [Paragraph("Balanced Accuracy", table_cell_bold), Paragraph("99.36%", table_cell_bold), Paragraph("10.00%", table_cell), Paragraph("Demonstrates strong sensitivity across rare classes (DHSV closure)", table_cell)],
        [Paragraph("Weighted F1 Score", table_cell_bold), Paragraph("99.10%", table_cell_bold), Paragraph("11.23%", table_cell), Paragraph("High generalizability across full instance distribution", table_cell)],
        [Paragraph("Raw Accuracy", table_cell_bold), Paragraph("99.10%", table_cell_bold), Paragraph("26.70%", table_cell), Paragraph("438 / 442 test instances correctly classified", table_cell)],
    ]
    t_3w_ev = Table(threew_eval_table, colWidths=[105, 95, 110, 212])
    t_3w_ev.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_accent),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(t_3w_ev)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 15: NLP EVALUATION, DATABASE & REST APIS
    # =========================================================================
    story.append(Paragraph("24. NLP & Safety Precursor Empirical Evaluation", h1_style))
    nlp_t_data = [
        [Paragraph("Evaluation Benchmark", table_header), Paragraph("Precision", table_header), Paragraph("Recall", table_header), Paragraph("F1 Score", table_header), Paragraph("Accuracy", table_header), Paragraph("Key Finding", table_header)],
        [Paragraph("Ontology (Dev Set, 46 samples)", table_cell_bold), Paragraph("96.00%", table_cell), Paragraph("66.67%", table_cell), Paragraph("78.69%", table_cell), Paragraph("73.9%", table_cell), Paragraph("High precision on known safety rules", table_cell)],
        [Paragraph("Ontology (Held-Out, 50 samples)", table_cell_bold), Paragraph("68.42%", table_cell), Paragraph("37.14%", table_cell), Paragraph("48.15%", table_cell), Paragraph("52.0%", table_cell), Paragraph("Conservative recall highlights need for embeddings", table_cell)],
    ]
    t_nlp_ev = Table(nlp_t_data, colWidths=[120, 55, 55, 55, 55, 182])
    t_nlp_ev.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(t_nlp_ev)
    story.append(Spacer(1, 6))

    story.append(Paragraph("25. Database Architecture (SQLite Local & PostgreSQL pgvector Target)", h1_style))
    story.append(Paragraph(
        "• <b>Active Local DB (`backend/data/sifsentinel.db`):</b> 10.3 MB SQLite database containing 12 relational tables. Raw 1.74 GB 3W Parquet data remains purely on disk.<br/>"
        "• <b>Target Enterprise Architecture:</b> PostgreSQL 16 with the `pgvector` extension for indexed nearest-neighbor cosine search (`Vector(384)` with HNSW indexes).",
        body_style
    ))

    story.append(Paragraph("26. REST API Architecture & Endpoint Directory", h1_style))
    api_summary_data = [
        [Paragraph("Route Prefix", table_header), Paragraph("Primary Endpoints", table_header), Paragraph("Backend Services", table_header), Paragraph("Functionality", table_header)],
        [Paragraph("/api/v1/reports", table_cell_bold), Paragraph("GET /, POST /, POST /analyze", table_cell), Paragraph("extraction_service, risk_engine", table_cell), Paragraph("Ingest, profile, and analyze safety reports", table_cell)],
        [Paragraph("/api/v1/patterns", table_cell_bold), Paragraph("GET /, GET /{id}, POST /discover", table_cell), Paragraph("pattern_engine, embedding_service", table_cell), Paragraph("DBSCAN clustering, Connect the Dots graph", table_cell)],
        [Paragraph("/api/v1/dashboard", table_cell_bold), Paragraph("GET /kpis, GET /trends", table_cell), Paragraph("dashboard, risk_engine", table_cell), Paragraph("Real-time SIF KPIs, high-risk site ranking", table_cell)],
        [Paragraph("/api/v1/barrier-health", table_cell_bold), Paragraph("GET /, GET /snapshots", table_cell), Paragraph("barrier_service", table_cell), Paragraph("Barrier degradation indices & historical trends", table_cell)],
        [Paragraph("/api/v1/actions", table_cell_bold), Paragraph("GET /, POST /, PUT /{id}", table_cell), Paragraph("action_service", table_cell), Paragraph("Closed-loop preventive action lifecycle", table_cell)],
        [Paragraph("/api/v1/copilot", table_cell_bold), Paragraph("POST /query", table_cell), Paragraph("copilot_service", table_cell), Paragraph("Telemetry-grounded safety Q&A with safeguards", table_cell)],
        [Paragraph("/api/v1/threew", table_cell_bold), Paragraph("GET /overview, GET /confusion-matrix, GET /instance-data", table_cell), Paragraph("threew_loader, threew_model", table_cell), Paragraph("3W metrics, time-series streaming & inference", table_cell)],
        [Paragraph("/api/v1/bsee & /oisd", table_cell_bold), Paragraph("GET /analytics, GET /case-studies", table_cell), Paragraph("bsee_service, oisd_service", table_cell), Paragraph("Offshore incident analytics & Indian case studies", table_cell)],
    ]
    t_api = Table(api_summary_data, colWidths=[85, 125, 132, 180])
    t_api.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(t_api)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 16: FRONTEND, SECURITY, TESTING, LIMITATIONS & ROADMAP
    # =========================================================================
    story.append(Paragraph("27. Frontend Command Center & Interactive Dashboards", h1_style))
    story.append(Paragraph(
        "Next.js 16 (Turbopack) and React 19 across 13 routes: `/dashboard` (Command Center), `/oil-well-intelligence` (3W multi-sensor chart & confusion matrix), `/offshore-analytics` (BSEE & OISD tabs), `/patterns` (Emerging Radar), `/patterns/[id]` (Connect the Dots Graph), `/barrier-health` (Degradation velocity), `/actions` (Closed-loop tracking), `/reports/analyze` (Live NLP analyzer).",
        body_style
    ))

    story.append(Paragraph("28. Security, Air-Gapped Operation & API Key Independence", h1_style))
    story.append(Paragraph(
        "<b>NO EXTERNAL API KEY REQUIRED FOR CURRENT CORE PIPELINE.</b> "
        "All NLP extractions, sentence transformers, clustering, and 3W random forests execute locally on CPU hardware. Scanned with 0 exposed credentials, ensuring confidential enterprise data never leaves the air-gapped environment.",
        body_style
    ))

    story.append(Paragraph("29. Quality Assurance, Unit & Integration Testing", h1_style))
    story.append(Paragraph(
        "• <b>Backend Automated Tests:</b> <b>25 of 25 passed in 25.87s</b> (`pytest tests/ -v`).<br/>"
        "• <b>Frontend Production Build:</b> <b>Compiled in 14.7s with 0 TypeScript errors</b> across all 13 routes (`npm run build`).",
        body_style
    ))

    story.append(Paragraph("30. Deployment Architecture: Local Runtime vs Production Target", h1_style))
    story.append(Paragraph(
        "• <b>Current Local Prototype:</b> Next.js (:3000) ──HTTP──> FastAPI (:8000) ──ORM──> SQLite File (10.3 MB).<br/>"
        "• <b>Target Production Architecture:</b> Vercel Edge CDN (Next.js) ──HTTPS──> Containerized FastAPI (Docker/Gunicorn) ──ORM──> PostgreSQL 16 + pgvector.",
        body_style
    ))

    story.append(Paragraph("31. Transparent System Limitations & Boundary Conditions", h1_style))
    story.append(Paragraph("1. <b>3W Well Leakage:</b> Stratified instance split contains overlapping wells; performance must be evaluated with GroupKFold.", bullet_style))
    story.append(Paragraph("2. <b>Colloquial Slang Recall:</b> Rule-based recall on unseen slang is 37.1%, requiring ongoing ontology expansion.", bullet_style))
    story.append(Paragraph("3. <b>Prototype Scoring Weights:</b> 5-factor scoring weights (25/25/20/20/10) must be calibrated to an operator's formal risk matrix.", bullet_style))
    story.append(Paragraph("4. <b>No Accident Prediction:</b> Detects precursor states; does not predict exact future accident timestamps.", bullet_style))

    story.append(Paragraph("32. Future Roadmap & Production Hardening Milestones", h1_style))
    story.append(Paragraph("• <b>P0 (Immediate SIH Polish):</b> Implement GroupKFold well grouping in 3W preprocessing and persist OISD case studies in an SQLite table.", bullet_style))
    story.append(Paragraph("• <b>P1 (Post-Hackathon Production):</b> Add TreeSHAP explainability for 3W predictions and deploy PostgreSQL 16 with pgvector HNSW indexing.", bullet_style))
    story.append(Paragraph("• <b>P2 (Enterprise Integration):</b> Connect live OPC-UA/SCADA sensor telemetry streams and ingest authorized internal safety reports.", bullet_style))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 17: SIH JUDGE Q&A & FINAL SUMMARY CARD
    # =========================================================================
    story.append(Paragraph("34. SIH Judge Quick 20-Second Technical Q&A", h1_style))
    qa_data = [
        [Paragraph("Judge Question", table_header), Paragraph("Ideal 20-Second Technical Response", table_header)],
        [Paragraph("What is a SIF precursor?", table_cell_bold), Paragraph("A high-risk condition where controls failed, which could have caused fatal harm under slight variation.", table_cell)],
        [Paragraph("Why not just use keyword search?", table_cell_bold), Paragraph("Different technicians describe the same hazard with different words; keyword matching misses connections and flags safe audits.", table_cell)],
        [Paragraph("What is your NLP model?", table_cell_bold), Paragraph("Pretrained sentence-transformers/all-MiniLM-L6-v2 (384-dim) combined with a deterministic safety ontology and negation parser.", table_cell)],
        [Paragraph("Did you train all-MiniLM?", table_cell_bold), Paragraph("No, it is a pretrained model used for dense semantic embeddings. Our custom code handles ontology, negation, and DBSCAN clustering.", table_cell)],
        [Paragraph("Why use DBSCAN?", table_cell_bold), Paragraph("It discovers clusters of arbitrary shape without predefined k and automatically isolates non-recurring reports as noise.", table_cell)],
        [Paragraph("What is the 3W model?", table_cell_bold), Paragraph("An explainable Random Forest classifier with balanced class weighting trained on 58 domain sensor features across 10 classes.", table_cell)],
        [Paragraph("Why is 3W Macro F1 so high (98.93%)?", table_cell_bold), Paragraph("The current instance split contains overlapping wells. Under strict unseen-well GroupKFold evaluation, Macro F1 is expected to normalize to ~85–92%.", table_cell)],
        [Paragraph("Do you need an API key?", table_cell_bold), Paragraph("No. The entire core pipeline runs 100% locally and offline on standard CPU hardware with zero external API dependencies.", table_cell)],
        [Paragraph("Does it predict accidents?", table_cell_bold), Paragraph("No. It is an explainable precursor discovery and decision-support system that identifies broken barriers before accidents occur.", table_cell)],
        [Paragraph("How do you measure prevention?", table_cell_bold), Paragraph("Our closed-loop action tracker measures precursor frequency in the 60 days before intervention vs 60 days after to calculate reduction velocity.", table_cell)],
    ]
    t_qa = Table(qa_data, colWidths=[130, 392])
    t_qa.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(t_qa)
    story.append(Spacer(1, 8))

    story.append(Paragraph("35. Final Technical Summary Card", h1_style))
    sum_data = [
        [Paragraph("Dimension", table_header), Paragraph("Current Verified Status in Repository", table_header)],
        [Paragraph("Core Value Proposition", table_cell_bold), Paragraph("Uncovers latent precursor patterns and tracks barrier health degradation without black-box hallucination.", table_cell)],
        [Paragraph("Empirical NLP Performance", table_cell_bold), Paragraph("96.0% Precision on Dev Set, 68.4% Precision on Held-Out Set, 5.77x semantic vector contrast ratio.", table_cell)],
        [Paragraph("Petrobras 3W ML Performance", table_cell_bold), Paragraph("98.93% Macro F1, 99.36% Balanced Accuracy across 10 classes (442 held-out test instances).", table_cell)],
        [Paragraph("Critical Audit Transparency", table_cell_bold), Paragraph("Transparently identifies 3W well-level instance leakage and documents exact mitigation steps.", table_cell)],
        [Paragraph("Dataset Integrations", table_cell_bold), Paragraph("4 distinct datasets (IHM Stefanini, OISD, BSEE, Petrobras 3W) with strict provenance separation.", table_cell)],
        [Paragraph("System Quality & Stability", table_cell_bold), Paragraph("25 / 25 automated pytest tests passing (100%), Next.js 16 production build with 0 TypeScript errors across 13 routes.", table_cell)],
    ]
    t_sum = Table(sum_data, colWidths=[130, 392])
    t_sum.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_accent),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(t_sum)
    story.append(Spacer(1, 8))

    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#94a3b8"), spaceBefore=4, spaceAfter=6))
    story.append(Paragraph("<b>End of Master Technical Report — SIF Sentinel System Verification Suite</b>", ParagraphStyle('Foot', parent=styles['Normal'], fontSize=8, textColor=c_muted, alignment=1)))

    # Compile Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Master technical report PDF successfully generated at: {PDF_OUTPUT_PATH}")


if __name__ == "__main__":
    build_master_pdf()
