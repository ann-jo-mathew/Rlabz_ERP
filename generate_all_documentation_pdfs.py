import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

# Page geometry - A4
PAGE_WIDTH, PAGE_HEIGHT = A4  # 595.27 x 841.89 points
LEFT_MARGIN = 38
RIGHT_MARGIN = 38
TOP_MARGIN = 42
BOTTOM_MARGIN = 42
CONTENT_WIDTH = PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN  # 519.27 pt

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and print 'Page X of Y' along with
    professional running headers and footers on all pages except the cover page.
    """
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
        self.saveState()
        
        # Header on pages > 1
        if self._pageNumber > 1:
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor("#1E3A8A"))
            self.drawString(LEFT_MARGIN, PAGE_HEIGHT - 28, "RLABZ ERP SYSTEM  |  RAJAGIRI INCUBATION CENTER")
            
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#64748B"))
            header_title = getattr(self, "doc_header_title", "Technical Documentation")
            self.drawRightString(PAGE_WIDTH - RIGHT_MARGIN, PAGE_HEIGHT - 28, header_title)
            
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.6)
            self.line(LEFT_MARGIN, PAGE_HEIGHT - 32, PAGE_WIDTH - RIGHT_MARGIN, PAGE_HEIGHT - 32)

        # Footer on all pages
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.6)
        self.line(LEFT_MARGIN, 32, PAGE_WIDTH - RIGHT_MARGIN, 32)

        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(LEFT_MARGIN, 21, "Confidential  |  Rajagiri School of Engineering & Technology  |  RLabz Software Development Cell")
        self.drawRightString(PAGE_WIDTH - RIGHT_MARGIN, 21, f"Page {self._pageNumber} of {page_count}")
        
        self.restoreState()

def get_canvas_builder(header_title):
    class CustomNumberedCanvas(NumberedCanvas):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            self.doc_header_title = header_title
    return CustomNumberedCanvas

def get_styles():
    base = getSampleStyleSheet()
    
    styles = {
        'DocTitle': ParagraphStyle(
            'DocTitle', parent=base['Normal'],
            fontName='Helvetica-Bold', fontSize=18, leading=22,
            textColor=colors.HexColor('#0F172A'), spaceAfter=3
        ),
        'DocSubtitle': ParagraphStyle(
            'DocSubtitle', parent=base['Normal'],
            fontName='Helvetica-Bold', fontSize=10, leading=13,
            textColor=colors.HexColor('#2563EB'), spaceAfter=8
        ),
        'MetaBox': ParagraphStyle(
            'MetaBox', parent=base['Normal'],
            fontName='Helvetica', fontSize=7.5, leading=10.5,
            textColor=colors.HexColor('#475569')
        ),
        'H1': ParagraphStyle(
            'H1', parent=base['Normal'],
            fontName='Helvetica-Bold', fontSize=12, leading=15,
            textColor=colors.HexColor('#1E3A8A'), spaceBefore=10, spaceAfter=4,
            keepWithNext=True
        ),
        'H2': ParagraphStyle(
            'H2', parent=base['Normal'],
            fontName='Helvetica-Bold', fontSize=9.5, leading=13,
            textColor=colors.HexColor('#0F172A'), spaceBefore=7, spaceAfter=3,
            keepWithNext=True
        ),
        'H3': ParagraphStyle(
            'H3', parent=base['Normal'],
            fontName='Helvetica-Bold', fontSize=8.5, leading=11.5,
            textColor=colors.HexColor('#334155'), spaceBefore=5, spaceAfter=2,
            keepWithNext=True
        ),
        'Body': ParagraphStyle(
            'Body', parent=base['Normal'],
            fontName='Helvetica', fontSize=7.8, leading=11,
            textColor=colors.HexColor('#334155'), spaceAfter=3.5
        ),
        'BodyBold': ParagraphStyle(
            'BodyBold', parent=base['Normal'],
            fontName='Helvetica-Bold', fontSize=7.8, leading=11,
            textColor=colors.HexColor('#0F172A'), spaceAfter=3.5
        ),
        'Bullet': ParagraphStyle(
            'Bullet', parent=base['Normal'],
            fontName='Helvetica', fontSize=7.8, leading=11,
            textColor=colors.HexColor('#334155'), leftIndent=10, firstLineIndent=-7,
            spaceAfter=2
        ),
        'CalloutText': ParagraphStyle(
            'CalloutText', parent=base['Normal'],
            fontName='Helvetica', fontSize=7.5, leading=10.5,
            textColor=colors.HexColor('#1E293B')
        ),
        'CalloutTitle': ParagraphStyle(
            'CalloutTitle', parent=base['Normal'],
            fontName='Helvetica-Bold', fontSize=8, leading=11,
            textColor=colors.HexColor('#1E40AF'), spaceAfter=2
        ),
        'Code': ParagraphStyle(
            'Code', parent=base['Normal'],
            fontName='Courier', fontSize=6.8, leading=8.8,
            textColor=colors.HexColor('#0F172A')
        ),
        'TableHeader': ParagraphStyle(
            'TableHeader', parent=base['Normal'],
            fontName='Helvetica-Bold', fontSize=7.2, leading=9.2,
            textColor=colors.white, alignment=0
        ),
        'TableCell': ParagraphStyle(
            'TableCell', parent=base['Normal'],
            fontName='Helvetica', fontSize=7.2, leading=9.2,
            textColor=colors.HexColor('#1E293B')
        ),
        'TableCellBold': ParagraphStyle(
            'TableCellBold', parent=base['Normal'],
            fontName='Helvetica-Bold', fontSize=7.2, leading=9.2,
            textColor=colors.HexColor('#0F172A')
        ),
        'TableCellCode': ParagraphStyle(
            'TableCellCode', parent=base['Normal'],
            fontName='Courier', fontSize=6.8, leading=8.5,
            textColor=colors.HexColor('#0F172A')
        )
    }
    return styles

def make_callout(title, text, styles, kind="info"):
    color_map = {
        "info": ("#EFF6FF", "#3B82F6", "#1E40AF"),
        "warning": ("#FFFBEB", "#F59E0B", "#B45309"),
        "success": ("#ECFDF5", "#10B981", "#065F46"),
        "danger": ("#FEF2F2", "#EF4444", "#991B1B"),
        "purple": ("#F5F3FF", "#8B5CF6", "#5B21B6")
    }
    bg, border, tcolor = color_map.get(kind, color_map["info"])
    
    t_style = ParagraphStyle(f'CT_{kind}', parent=styles['CalloutTitle'], textColor=colors.HexColor(tcolor))
    content = [
        Paragraph(title, t_style),
        Paragraph(text, styles['CalloutText'])
    ]
    t = Table([[content]], colWidths=[CONTENT_WIDTH])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(bg)),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor(border)),
        ('LINEBEFORE', (0,0), (0,-1), 3.0, colors.HexColor(border)),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 7),
        ('RIGHTPADDING', (0,0), (-1,-1), 7),
    ]))
    return t

def make_code_box(code_text, styles):
    content = Paragraph(code_text.replace("\n", "<br/>").replace(" ", "&nbsp;"), styles['Code'])
    t = Table([[content]], colWidths=[CONTENT_WIDTH])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    return t

def make_header_block(title, subtitle, meta_items, styles, banner_color="#1E3A8A"):
    meta_html = "  |  ".join([f"<b>{k}:</b> {v}" for k, v in meta_items.items()])
    
    header_content = [
        Paragraph(title, styles['DocTitle']),
        Paragraph(subtitle, styles['DocSubtitle']),
        HRFlowable(width="100%", thickness=1, color=colors.HexColor(banner_color), spaceBefore=2, spaceAfter=5),
        Paragraph(meta_html, styles['MetaBox']),
        Spacer(1, 8)
    ]
    return header_content

def build_director_pdf(output_path):
    styles = get_styles()
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=LEFT_MARGIN,
        rightMargin=RIGHT_MARGIN,
        topMargin=TOP_MARGIN,
        bottomMargin=BOTTOM_MARGIN
    )
    story = []
    
    # Title Block
    meta = {
        "Module Name": "Director Module (Module 2)",
        "Role Code": "director",
        "Primary Landing": "/dashboard or /director",
        "Access Level": "Executive Oversight (Read-Only Projects & Faculties)",
        "Security Model": "Enforced Non-Mutating RBAC with 403 Guards",
        "Platform": "RLabz ERP v2.4 Enterprise"
    }
    story.extend(make_header_block(
        "RLabz ERP — Director Module Specification & User Manual",
        "Executive Governance, Real-Time Oversight, Talent Tracking & Financial Health Guide",
        meta, styles, banner_color="#1E3A8A"
    ))
    
    # Chapter 1: Executive Mission & Governance Philosophy
    story.append(Paragraph("1. Executive Mission, Strategic Purpose & Governance Philosophy", styles['H1']))
    story.append(Paragraph(
        "The <b>Director Module</b> serves as the highest-level operational intelligence and executive governance platform "
        "within the RLabz ERP ecosystem at Rajagiri. Operating at the confluence of academic administration and professional "
        "software development, the module equips the College Director, Deans, and Executive Management with a 360-degree, "
        "unfiltered view of incubation activities without requiring technical navigation through sprint boards or code repositories.",
        styles['Body']
    ))
    story.append(Paragraph(
        "<b>The Separation of Duties (SoD) Principle:</b> In traditional management software, executive accounts often "
        "possess unrestricted write privileges, creating risks of accidental state mutations, biased project approvals, or "
        "premature sprint inaugurations that bypass technical feasibility reviews. RLabz ERP fundamentally prevents this by "
        "architecting the Director Module with <b>Read-Only Operational Access</b>. While the Director possesses global visibility "
        "over all projects, proposals, faculty leads, students, and finances, all state-changing operational triggers (accepting proposals, "
        "assigning faculty leads, kicking off sprints) are strictly segregated to the Developer Module. If a Director user invokes an "
        "operational mutating endpoint, the backend Laravel controller returns <code>HTTP 403 Forbidden</code>.",
        styles['Body']
    ))
    story.append(make_callout(
        "Key Architectural Invariant: Read-Only Governance",
        "• The Director can inspect all project proposals, client contracts, budget allocations, and faculty rosters.<br/>"
        "• The Director CANNOT reassign faculty, accept/reject proposals, or trigger sprint start.<br/>"
        "• This preserves engineering autonomy, ensures peer-reviewed technical triage, and eliminates managerial single-point-of-failure risks.",
        styles, kind="info"
    ))
    story.append(Spacer(1, 4))

    # Chapter 2: System Architecture & File Manifest
    story.append(Paragraph("2. System Architecture & File Manifest", styles['H1']))
    story.append(Paragraph(
        "The Director Module is implemented as a cohesive vertical slice spanning the Laravel backend and the Vanilla JS Single Page Application (SPA):",
        styles['Body']
    ))
    
    file_manifest_data = [
        [Paragraph("Component / Layer", styles['TableHeader']), 
         Paragraph("File Path in Codebase", styles['TableHeader']), 
         Paragraph("Technical Role & Description", styles['TableHeader'])],
        
        [Paragraph("<b>Backend Module Manifest</b>", styles['TableCellBold']),
         Paragraph("<code>backend/Modules/Director/module.json</code>", styles['TableCellCode']),
         Paragraph("Registers the module alias <code>'director'</code> within the Laravel modular kernel.", styles['TableCell'])],

        [Paragraph("<b>Backend API Routes</b>", styles['TableCellBold']),
         Paragraph("<code>backend/Modules/Director/Routes/api.php</code>", styles['TableCellCode']),
         Paragraph("Defines 12 protected endpoints under the prefix <code>/api/director</code>, guarded by <code>JwtMiddleware</code>.", styles['TableCell'])],

        [Paragraph("<b>Backend Controller</b>", styles['TableCellBold']),
         Paragraph("<code>backend/Modules/Director/Controllers/DirectorController.php</code>", styles['TableCellCode']),
         Paragraph("840 lines of controller logic handling KPI aggregation, student track groupings, task progress algorithms, and 403 write guards.", styles['TableCell'])],

        [Paragraph("<b>Frontend Layout</b>", styles['TableCellBold']),
         Paragraph("<code>frontend/src/modules/director/DirectorLayout.js</code>", styles['TableCellCode']),
         Paragraph("Wraps the global <code>DashboardLayout</code>, rewrites topbar title to 'DIRECTOR DASHBOARD', and injects executive sidebar navigation.", styles['TableCell'])],

        [Paragraph("<b>Frontend Router</b>", styles['TableCellBold']),
         Paragraph("<code>frontend/src/modules/director/routes.js</code>", styles['TableCellCode']),
         Paragraph("Defines SPA routes (<code>/director</code>, <code>/director/projects</code>, <code>/director/students</code>, etc.) with permission guards.", styles['TableCell'])],

        [Paragraph("<b>Central Service Layer</b>", styles['TableCellBold']),
         Paragraph("<code>frontend/src/modules/director/services/DirectorService.js</code>", styles['TableCellCode']),
         Paragraph("723 lines of state management, localStorage caching, auto token refresh, and asynchronous fetch methods.", styles['TableCell'])],

        [Paragraph("<b>Core Views</b>", styles['TableCellBold']),
         Paragraph("<code>frontend/src/modules/director/views/*.js</code>", styles['TableCellCode']),
         Paragraph("7 interactive view modules: <code>DirectorHome.js</code>, <code>DirectorProjects.js</code>, <code>DirectorStudents.js</code>, <code>DirectorStudentDetail.js</code>, <code>DirectorClients.js</code>, <code>DirectorFinance.js</code>, <code>DirectorAuditLog.js</code>.", styles['TableCell'])],
    ]
    t_manifest = Table(file_manifest_data, colWidths=[90, 180, 249])
    t_manifest.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1E3A8A")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor("#FFFFFF"), colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_manifest)
    story.append(Spacer(1, 6))

    # Chapter 3: Screen-by-Screen Detailed Functional Walkthrough
    story.append(Paragraph("3. Detailed Functional Walkthrough of Director Screens", styles['H1']))
    story.append(Paragraph(
        "Below is an exhaustive breakdown of every screen, widget, metric, and user interaction available to the Director:",
        styles['Body']
    ))

    # 3.1 Overview Dashboard
    story.append(Paragraph("3.1 Executive Cockpit & KPI Overview (<code>/dashboard</code> or <code>/director</code>)", styles['H2']))
    story.append(Paragraph(
        "The primary landing screen synthesizes live institutional metrics into high-impact visual indicators:<br/>"
        "• <b>Total Projects Card:</b> Cumulative count of all software projects ever initiated or proposed.<br/>"
        "• <b>Active Projects Card:</b> Real-time tally of projects with status <code>'in_progress'</code>, <code>'active'</code>, or <code>'accepted'</code>.<br/>"
        "• <b>Proposals Awaiting Approval Card:</b> Live badge highlighting unreviewed submissions (status <code>'proposed'</code> or <code>'pending'</code>).<br/>"
        "• <b>Total Student Talent Card:</b> Unified count of active student engineers, categorized into Nova, Orbit, and Spark designations.<br/>"
        "• <b>Faculty Leads Card:</b> Count of teaching faculty currently supervising one or more incubation projects.<br/>"
        "• <b>Active Project Health Radar:</b> Top 5 active projects displayed with lead faculty name, lifecycle status, and a calculated percentage progress bar.<br/>"
        "• <b>Delivery Velocity Tracker:</b> Algorithmic heuristic tracking project delivery health: On-Track (75% of active), At-Risk (flagged projects), and Delayed.<br/>"
        "• <b>Proposals Requiring Review Widget:</b> Carousel of incoming proposals. When the Director clicks 'View Details', a read-only modal opens showing full client scope, estimated budget, timeline, and deliverables.",
        styles['Body']
    ))

    # 3.2 Projects & Proposals
    story.append(Paragraph("3.2 Projects & Proposals Portfolio (<code>/dashboard/projects</code>)", styles['H2']))
    story.append(Paragraph(
        "This view gives the Director a searchable, filterable repository of the entire software incubation portfolio:<br/>"
        "• <b>Dual-Tab Navigation:</b> Instantly toggle between 'Active Projects' and 'Project Proposals'.<br/>"
        "• <b>Active Projects Table:</b> Lists Project ID (e.g., <code>PROJ-001</code>), Project Title, Client Name, Lead Faculty, Assigned Student Chips, Real-Time Progress %, Budget, and Current Status.<br/>"
        "• <b>Student Track Chips:</b> Students assigned to a project are displayed as color-coded badges indicating their skill track: Purple for <b>Nova</b>, Blue for <b>Orbit</b>, and Green for <b>Spark</b>.<br/>"
        "• <b>Faculty Lead Inspection:</b> Displays the assigned professor. The Director sees a disabled 'Reassign Faculty' button with tooltip <i>'Director has read-only access to faculty assignment'</i>.<br/>"
        "• <b>Proposal Inspection Modal:</b> Clicking 'View Details' on any proposal opens a modal showing client intake source, budget, proposed timeline, and deliverables. All form inputs and radio buttons are set to disabled/read-only.",
        styles['Body']
    ))

    # 3.3 Student Track Roster & Dossier
    story.append(Paragraph("3.3 Student Track Roster & Individual Dossier (<code>/dashboard/students</code>)", styles['H2']))
    story.append(Paragraph(
        "Rajagiri RLabz organizes student engineers into a three-tier merit-based skill framework:<br/>"
        "• <b>Nova Track (Senior Engineers / Architects):</b> Lead developers responsible for core system architecture, code reviews, and critical sprint deliverables. Receives institutional stipend of <b>₹5,000/month</b>.<br/>"
        "• <b>Orbit Track (Core Developers):</b> Experienced developers handling feature implementations, API integrations, and module builds. Receives <b>₹3,000/month</b>.<br/>"
        "• <b>Spark Track (Junior Developers / Apprentices):</b> Foundation-level developers undergoing training, executing UI bug fixes, testing, and documentation. Receives <b>₹1,500/month</b>.<br/>"
        "<b>Screen Capabilities:</b> The Director can filter by track (All, Nova, Orbit, Spark), search across student names, email, and project titles, and view real-time GPA and attendance percentages.<br/>"
        "<b>Student Detail Dossier (<code>/dashboard/students/:id</code>):</b> Clicking any student opens a dedicated performance dossier detailing: academic department, assigned faculty mentor, contact info, GitHub handle, active project list, and task metrics (Total Tasks, Completed Tasks, In-Progress Tasks, Under Review Tasks, and Overall Completion Percentage).",
        styles['Body']
    ))

    # 3.4 Client Requirements
    story.append(Paragraph("3.4 Client Requirements & Intake Specifications (<code>/dashboard/clients</code>)", styles['H2']))
    story.append(Paragraph(
        "The Client Requirements screen documents the contractual and technical expectations of every project sponsor:<br/>"
        "• Displays client organization, contact person name, email, and phone number.<br/>"
        "• Shows intake source (External Corporate Client, Campus Department, Faculty Research Sponsor, or Industry Outreach).<br/>"
        "• Outlines the agreed budget cap, delivery milestones, expected timeline, and scope summary.<br/>"
        "• Provides clickable links to download attached project specification documents (e.g., <code>project_client_spec.pdf</code>).",
        styles['Body']
    ))

    # 3.5 Finance Oversight
    story.append(Paragraph("3.5 Finance & Payroll Oversight (<code>/dashboard/finance</code>)", styles['H2']))
    story.append(Paragraph(
        "Provides executive financial transparency without granting ledger modification rights (which belong exclusively to Finance Head in Module 5):<br/>"
        "• <b>Total Project Budgets:</b> Cumulative allocated capital across all approved projects.<br/>"
        "• <b>Disbursed Expenditures:</b> Total funds actually disbursed for software infrastructure, servers, and resources.<br/>"
        "• <b>Stipends Disbursed:</b> Total monthly student stipend payout calculated across all active Nova, Orbit, and Spark members.<br/>"
        "• <b>Pending Invoices & Uncollected Revenue:</b> Total count and rupee sum of unbilled or unpaid client milestones.<br/>"
        "• <b>Payroll Breakdown by Track:</b> Visual comparison of stipend allocations: Nova Payout vs. Orbit Payout vs. Spark Payout.",
        styles['Body']
    ))

    # 3.6 System Audit Log
    story.append(Paragraph("3.6 System Audit Log & Security Trail (<code>/dashboard/audit</code>)", styles['H2']))
    story.append(Paragraph(
        "A real-time, tamper-evident security stream recording every consequential event across the ERP:<br/>"
        "• Tracks proposal approvals, rejections, faculty assignments, project kickoffs, user logins, and permission alterations.<br/>"
        "• Each entry records: Timestamp, Actor Name, Role Badge, Event Action, and Detailed Context (e.g., <i>'Proposal Rajagiri ERP (ID: 1) accepted by Developer. Note: Architecture approved'</i>).<br/>"
        "• Filterable by event severity: All, Success / Approvals (green badge), Warnings / Rejections (amber badge), and Info (blue badge).",
        styles['Body']
    ))
    story.append(Spacer(1, 6))

    # Chapter 4: Core Analytical Algorithms & Formulas
    story.append(Paragraph("4. Mathematical Formulas & Calculation Logic", styles['H1']))
    story.append(Paragraph(
        "The Director Controller executes dynamic calculation algorithms on every request, ensuring zero stale data:",
        styles['Body']
    ))

    calc_table_data = [
        [Paragraph("Metric", styles['TableHeader']), 
         Paragraph("Formula / Implementation Logic", styles['TableHeader']), 
         Paragraph("Source Tables & Conditions", styles['TableHeader'])],
        
        [Paragraph("<b>Project Progress Percentage</b>", styles['TableCellBold']),
         Paragraph("<code>if status IN ('closed','completed') -> 100%</code><br/>"
                   "<code>else: Progress = round((completed_tasks / total_tasks) * 100)</code><br/>"
                   "Where completed tasks match status <code>'completed'</code> or <code>'done'</code>.", styles['TableCell']),
         Paragraph("Tables: <code>modules</code>, <code>tasks</code><br/>Condition: <code>tasks.module_id IN (modules.id WHERE project_id = ?)</code>", styles['TableCell'])],

        [Paragraph("<b>Student Stipend Payroll</b>", styles['TableCellBold']),
         Paragraph("<code>Stipends = (Count(Nova) × 5000) + (Count(Orbit) × 3000) + (Count(Spark) × 1500)</code><br/>"
                   "If explicit disbursements exist in <code>stipends</code> table, takes <code>SUM(stipends.amount WHERE status = 'disbursed')</code>.", styles['TableCell']),
         Paragraph("Table: <code>student_profiles</code><br/>Condition: <code>designation = 'nova'|'orbit'|'spark'</code>", styles['TableCell'])],

        [Paragraph("<b>Delivery Velocity Heuristic</b>", styles['TableCellBold']),
         Paragraph("• <b>On Track:</b> <code>floor(active_projects * 0.75)</code><br/>"
                   "• <b>At Risk:</b> <code>1</code> if active_projects > 1 else <code>0</code><br/>"
                   "• <b>Delayed:</b> <code>0</code> (flagged by exception monitoring)", styles['TableCell']),
         Paragraph("Table: <code>projects</code><br/>Condition: <code>status IN ('in_progress','active','accepted')</code>", styles['TableCell'])],

        [Paragraph("<b>Pending Invoice Exposure</b>", styles['TableCellBold']),
         Paragraph("<code>Count = COUNT(*)</code><br/>"
                   "<code>Amount = SUM(COALESCE(amount, amount_before_gst, 0))</code>", styles['TableCell']),
         Paragraph("Table: <code>invoices</code><br/>Condition: <code>status IN ('pending', 'unpaid')</code>", styles['TableCell'])],
    ]
    t_calc = Table(calc_table_data, colWidths=[95, 230, 194])
    t_calc.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1E3A8A")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor("#FFFFFF"), colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_calc)
    story.append(Spacer(1, 6))

    # Chapter 5: API Specification
    story.append(Paragraph("5. Complete Director REST API Specification", styles['H1']))
    story.append(Paragraph(
        "All endpoints require an <code>Authorization: Bearer &lt;token&gt;</code> header validated by <code>JwtMiddleware</code>:",
        styles['Body']
    ))

    api_full_data = [
        [Paragraph("Method & Route", styles['TableHeader']), 
         Paragraph("Function Name", styles['TableHeader']), 
         Paragraph("Request Params", styles['TableHeader']), 
         Paragraph("Response Schema Summary", styles['TableHeader']), 
         Paragraph("HTTP Status", styles['TableHeader'])],
        
        [Paragraph("<code>GET /api/director/overview</code>", styles['TableCellCode']),
         Paragraph("<code>getOverview</code>", styles['TableCell']),
         Paragraph("None", styles['TableCell']),
         Paragraph("<code>{ total_projects, active_projects, student_counts: {nova, orbit, spark}, finance_summary }</code>", styles['TableCellCode']),
         Paragraph("200 OK", styles['TableCellBold'])],

        [Paragraph("<code>GET /api/director/projects</code>", styles['TableCellCode']),
         Paragraph("<code>getProjects</code>", styles['TableCell']),
         Paragraph("<code>per_page</code> (default 20)", styles['TableCell']),
         Paragraph("<code>{ data: [{ id, title, facultyName, assignedStudents: [], progress, budget, status }], pagination }</code>", styles['TableCellCode']),
         Paragraph("200 OK", styles['TableCellBold'])],

        [Paragraph("<code>GET /api/director/proposals</code>", styles['TableCellCode']),
         Paragraph("<code>getProposals</code>", styles['TableCell']),
         Paragraph("<code>per_page</code> (default 20)", styles['TableCell']),
         Paragraph("<code>{ data: [{ id, title, clientName, budget, timeline, deliverables, driveLink, status }], pagination }</code>", styles['TableCellCode']),
         Paragraph("200 OK", styles['TableCellBold'])],

        [Paragraph("<code>GET /api/director/finance</code>", styles['TableCellCode']),
         Paragraph("<code>getFinanceSummary</code>", styles['TableCell']),
         Paragraph("None", styles['TableCell']),
         Paragraph("<code>{ totalBudget, totalSpent, stipendsDisbursed, pendingInvoices, payrollByTrack }</code>", styles['TableCellCode']),
         Paragraph("200 OK", styles['TableCellBold'])],

        [Paragraph("<code>GET /api/director/students</code>", styles['TableCellCode']),
         Paragraph("<code>getStudents</code>", styles['TableCell']),
         Paragraph("<code>track=All|Nova|Orbit|Spark</code>", styles['TableCell']),
         Paragraph("<code>{ data: [{ id, name, email, track, gpa, attendance, assignedProjects: [] }], pagination }</code>", styles['TableCellCode']),
         Paragraph("200 OK", styles['TableCellBold'])],

        [Paragraph("<code>GET /api/director/students/{id}</code>", styles['TableCellCode']),
         Paragraph("<code>getStudentDetail</code>", styles['TableCell']),
         Paragraph("<code>id</code> in URL", styles['TableCell']),
         Paragraph("<code>{ id, name, track, mentor, projects: [], tasks: [{title, status, priority, due}], stats }</code>", styles['TableCellCode']),
         Paragraph("200 OK / 404", styles['TableCellBold'])],

        [Paragraph("<code>GET /api/director/client-requirements</code>", styles['TableCellCode']),
         Paragraph("<code>getClientRequirements</code>", styles['TableCell']),
         Paragraph("None", styles['TableCell']),
         Paragraph("<code>{ data: [{ id, projectId, title, clientName, clientContact, budget, timeline, documents }] }</code>", styles['TableCellCode']),
         Paragraph("200 OK", styles['TableCellBold'])],

        [Paragraph("<code>GET /api/director/audit-logs</code>", styles['TableCellCode']),
         Paragraph("<code>getAuditLogs</code>", styles['TableCell']),
         Paragraph("<code>per_page</code> (default 20)", styles['TableCell']),
         Paragraph("<code>{ data: [{ id, timestamp, user, role, event, details, type }], pagination }</code>", styles['TableCellCode']),
         Paragraph("200 OK", styles['TableCellBold'])],

        [Paragraph("<code>POST /api/director/proposals/{id}/status</code>", styles['TableCellCode']),
         Paragraph("<code>updateProposalStatus</code>", styles['TableCell']),
         Paragraph("Any body", styles['TableCell']),
         Paragraph("<code>{ error: 'Forbidden: Director has read-only access to project proposals' }</code>", styles['TableCellCode']),
         Paragraph("<b>403 Forbidden</b>", styles['TableCellBold'])],

        [Paragraph("<code>POST /api/director/projects/{id}/start</code>", styles['TableCellCode']),
         Paragraph("<code>startProject</code>", styles['TableCell']),
         Paragraph("Any body", styles['TableCell']),
         Paragraph("<code>{ error: 'Forbidden: Director has read-only access to start projects' }</code>", styles['TableCellCode']),
         Paragraph("<b>403 Forbidden</b>", styles['TableCellBold'])],

        [Paragraph("<code>POST /api/director/projects/{id}/assign-faculty</code>", styles['TableCellCode']),
         Paragraph("<code>assignFaculty</code>", styles['TableCell']),
         Paragraph("Any body", styles['TableCell']),
         Paragraph("<code>{ error: 'Forbidden: Director has read-only access to assign faculty' }</code>", styles['TableCellCode']),
         Paragraph("<b>403 Forbidden</b>", styles['TableCellBold'])],
    ]
    t_api = Table(api_full_data, colWidths=[90, 85, 80, 204, 60])
    t_api.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1E3A8A")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor("#FFFFFF"), colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_api)
    story.append(Spacer(1, 6))

    # Chapter 6: Step-by-Step User Workflow & Scenarios
    story.append(Paragraph("6. Step-by-Step User Workflow & Typical Operational Scenarios", styles['H1']))
    story.append(Paragraph(
        "<b>Scenario A — Executive Monday Morning Briefing:</b><br/>"
        "1. Login as Director (<code>director@rajagiri.edu</code> / <code>director123</code>). The system lands directly on <code>/dashboard</code>.<br/>"
        "2. Review the Active Projects Health radar: verify whether any project progress bar is stagnant or falling behind schedule.<br/>"
        "3. Check the Delivery Velocity chart: if any project is tagged 'At Risk', note the project ID.<br/>"
        "4. Navigate to <code>Projects & Proposals</code>: locate the project to see the assigned Lead Faculty and student developers.<br/>"
        "5. Review client intake deliverables in <code>Client Requirements</code> to verify if milestones match client expectations.<br/>"
        "<br/>"
        "<b>Scenario B — Reviewing Incoming Proposals:</b><br/>"
        "1. On the Overview screen, inspect the 'Proposals Requiring Review' widget.<br/>"
        "2. Click 'View Details' on an unreviewed proposal. Read the project description, client budget, and suggested timeline.<br/>"
        "3. Since the Director operates in read-only governance, the modal provides an informational overview. The Director contacts the Lead Developer or Coordinator during the weekly academic board meeting to recommend proceeding with the proposal.<br/>"
        "<br/>"
        "<b>Scenario C — Financial & Stipend Health Verification:</b><br/>"
        "1. Click <code>Finance Oversight</code> in the left sidebar.<br/>"
        "2. Check Disbursed Expenditures against Total Project Budgets: ensure incubation burn rate remains within approved limits.<br/>"
        "3. Review the Payroll by Track widget: ensure all active Nova, Orbit, and Spark students are properly categorized and that monthly stipend obligations are balanced against college grant funds.",
        styles['Body']
    ))

    doc.build(story, canvasmaker=get_canvas_builder("Director Module (Module 2) Technical Specification"))
    print(f"Director PDF generated successfully: {output_path}")

def build_developer_pdf(output_path):
    styles = get_styles()
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=LEFT_MARGIN,
        rightMargin=RIGHT_MARGIN,
        topMargin=TOP_MARGIN,
        bottomMargin=BOTTOM_MARGIN
    )
    story = []
    
    # Title Block
    meta = {
        "Module Name": "Developer Module",
        "Role Code": "developer",
        "Primary Landing": "/dashboard or /developer",
        "Access Level": "Full Project Write Access, Proposal Triage & Sprint Kickoff",
        "Security Model": "Authorized Mutating RBAC with Audit Trail Emission",
        "Platform": "RLabz ERP v2.4 Enterprise"
    }
    story.extend(make_header_block(
        "RLabz ERP — Developer Module Specification & Engineering Manual",
        "Technical Operations, Proposal Triage, Faculty Assignment & Sprint Kickoff Guide",
        meta, styles, banner_color="#0D9488"
    ))
    
    # Chapter 1: Executive Mission & Engineering Philosophy
    story.append(Paragraph("1. Engineering Mission, Operational Purpose & Scope", styles['H1']))
    story.append(Paragraph(
        "The <b>Developer Module</b> represents the active engineering and technical operations engine of the RLabz ERP. "
        "While the Director Module is structured for non-operational governance and executive monitoring, the Developer Module "
        "empowers Lead Developers, Technical Project Managers, and System Architects with the <b>active write permissions</b> "
        "required to execute the entire software incubation lifecycle. Developers evaluate technical feasibility, triage and "
        "decide on incoming project proposals, bind faculty academic mentors to approved projects, activate development sprints, "
        "author new project specifications, and manage source code through GitHub integrations.",
        styles['Body']
    ))
    story.append(Paragraph(
        "<b>Operational Accountability & Non-Repudiation:</b> Because Developers wield significant authority over project states "
        "and faculty assignments, every mutating operation in the Developer Module is automatically timestamped, attributed to "
        "the authenticated user's ID, and appended to the immutable <code>audit_logs</code> table. This ensures complete transparency "
        "and institutional accountability across the software cell.",
        styles['Body']
    ))
    story.append(make_callout(
        "Operational Authority: Complete Project Lifecycle Control",
        "• Evaluate and Triage: Review incoming proposals and execute <code>POST /status</code> (Accepted or Rejected).<br/>"
        "• Faculty Assignment: Bind and reassign faculty leads via <code>POST /assign-faculty</code> with conflict checking.<br/>"
        "• Sprint Inauguration: Transition accepted projects to <code>'in_progress'</code> via <code>POST /start</code>.<br/>"
        "• Full Creation: Access <code>ProjectCreate.js</code> to author new software specifications from scratch.<br/>"
        "• Code Integration: Inspect repositories, branches, and pull requests via GitHub integration.",
        styles, kind="success"
    ))
    story.append(Spacer(1, 4))

    # Chapter 2: System Architecture & File Manifest
    story.append(Paragraph("2. System Architecture & File Manifest", styles['H1']))
    story.append(Paragraph(
        "The Developer Module is structured as an autonomous operational domain within the ERP repository:",
        styles['Body']
    ))
    
    file_manifest_data = [
        [Paragraph("Component / Layer", styles['TableHeader']), 
         Paragraph("File Path in Codebase", styles['TableHeader']), 
         Paragraph("Technical Role & Description", styles['TableHeader'])],
        
        [Paragraph("<b>Backend Module Manifest</b>", styles['TableCellBold']),
         Paragraph("<code>backend/Modules/Developer/module.json</code>", styles['TableCellCode']),
         Paragraph("Declares the module alias <code>'developer'</code> in the Laravel modular architecture.", styles['TableCell'])],

        [Paragraph("<b>Backend API Routes</b>", styles['TableCellBold']),
         Paragraph("<code>backend/Modules/Developer/Routes/api.php</code>", styles['TableCellCode']),
         Paragraph("Registers routes under <code>/api/developer</code>, including write actions for proposal status, project start, and faculty assignment.", styles['TableCell'])],

        [Paragraph("<b>Backend Controller</b>", styles['TableCellBold']),
         Paragraph("<code>backend/Modules/Developer/Controllers/DeveloperController.php</code>", styles['TableCellCode']),
         Paragraph("1,018 lines of controller code. Contains write logic, role validations (<code>canWriteProjects</code>), audit logging (<code>logAudit</code>), and database queries.", styles['TableCell'])],

        [Paragraph("<b>Frontend Layout</b>", styles['TableCellBold']),
         Paragraph("<code>frontend/src/modules/developer/DeveloperLayout.js</code>", styles['TableCellCode']),
         Paragraph("Sets topbar to 'DEVELOPER DASHBOARD' and injects a dedicated 'Developer Operations' sidebar navigation block.", styles['TableCell'])],

        [Paragraph("<b>Frontend Router</b>", styles['TableCellBold']),
         Paragraph("<code>frontend/src/modules/developer/routes.js</code>", styles['TableCellCode']),
         Paragraph("Configures developer client routes (<code>/developer</code>, <code>/developer/projects</code>, <code>/developer/projects/create</code>, etc.).", styles['TableCell'])],

        [Paragraph("<b>Central Service Layer</b>", styles['TableCellBold']),
         Paragraph("<code>frontend/src/modules/developer/services/DeveloperService.js</code>", styles['TableCellCode']),
         Paragraph("State management service with methods <code>updateProposalStatusAsync</code>, <code>startProjectAsync</code>, and <code>assignFacultyAsync</code>.", styles['TableCell'])],

        [Paragraph("<b>Core Views</b>", styles['TableCellBold']),
         Paragraph("<code>frontend/src/modules/developer/views/*.js</code>", styles['TableCellCode']),
         Paragraph("7 interactive operational views: <code>DeveloperHome.js</code>, <code>DeveloperProjects.js</code>, <code>DeveloperStudents.js</code>, <code>DeveloperStudentDetail.js</code>, <code>DeveloperClients.js</code>, <code>DeveloperFinance.js</code>, <code>DeveloperAuditLog.js</code>.", styles['TableCell'])],
    ]
    t_manifest = Table(file_manifest_data, colWidths=[90, 180, 249])
    t_manifest.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0D9488")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor("#FFFFFF"), colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_manifest)
    story.append(Spacer(1, 6))

    # Chapter 3: Screen-by-Screen Detailed Functional Walkthrough
    story.append(Paragraph("3. Detailed Functional Walkthrough of Developer Screens", styles['H1']))
    story.append(Paragraph(
        "Below is an exhaustive breakdown of every operational screen and write action available to the Developer:",
        styles['Body']
    ))

    # 3.1 Developer Dashboard
    story.append(Paragraph("3.1 Developer Operations Dashboard (<code>/developer</code> or <code>/dashboard</code>)", styles['H2']))
    story.append(Paragraph(
        "The developer landing view focuses on team velocity, proposal queues, and immediate technical decision items:<br/>"
        "• <b>KPI Indicator Grid:</b> Total Projects, Active Projects, Proposals Requiring Decision, and Student Talent Counts.<br/>"
        "• <b>Proposals Requiring Developer Decision Widget:</b> A prioritized queue of pending proposals. The Developer can click <b>'Review & Assign'</b> to immediately open the triage modal.<br/>"
        "• <b>Live Triage Modal:</b> The Developer selects an eligible lead faculty member from a radio list, enters optional review instructions or acceptance criteria in the notes field, and clicks <b>'Accept & Assign Faculty'</b> (or <b>'Reject Proposal'</b>).<br/>"
        "• <b>Active Health Radar:</b> Real-time monitoring of project completion percentages to catch engineering bottlenecks early.",
        styles['Body']
    ))

    # 3.2 Projects & Proposals (Write Actions)
    story.append(Paragraph("3.2 Projects & Proposals Management (<code>/developer/projects</code>)", styles['H2']))
    story.append(Paragraph(
        "This is the core operational workhorse screen for software project administration:<br/>"
        "• <b>Active Projects Table:</b> Displays project ID, title, client, lead faculty, student chips with track designations, progress bar, budget, and status.<br/>"
        "• <b>Reassign Faculty Action:</b> Unlike the Director (where this button is disabled), the Developer has an active <b>'Reassign Faculty'</b> button. Clicking it opens a modal listing all faculty members in the Department of Computer Applications. The modal displays each faculty member's currently assigned active projects to prevent overloading. The Developer selects a faculty member and clicks <b>'Save Assignment'</b>, which executes <code>POST /api/developer/projects/{id}/assign-faculty</code> and logs the action.<br/>"
        "• <b>Start Project Action:</b> When a project is in the <code>'accepted'</code> state, a prominent <b>'Start Project'</b> button is displayed. Clicking it triggers <code>POST /api/developer/projects/{id}/start</code>, transitioning the project status to <code>'in_progress'</code> and activating the sprint lifecycle.<br/>"
        "• <b>Create Project Navigation:</b> Direct link to <code>/developer/projects/create</code> allowing developers to initialize new projects directly.",
        styles['Body']
    ))

    # 3.3 Create Project Wizard
    story.append(Paragraph("3.3 Project Creation Wizard (<code>/developer/projects/create</code>)", styles['H2']))
    story.append(Paragraph(
        "Enables the Developer to author new software incubation projects from the ground up:<br/>"
        "• Captures Project Title, Client Name, Client Contact Email, Contact Phone, and Source Type (Faculty Sponsor, Department, Industry Outreach, External).<br/>"
        "• Sets Total Budget, Expected Timeline (in months), Deliverables Breakdown, and Google Drive Architecture Folder Link.<br/>"
        "• Binds the initial Lead Faculty member directly at creation time.",
        styles['Body']
    ))

    # 3.4 Student Track Roster & Sprint Balancing
    story.append(Paragraph("3.4 Student Talent Roster & Sprint Balancing (<code>/developer/students</code>)", styles['H2']))
    story.append(Paragraph(
        "Developers use the student roster to evaluate team capacity and assemble multidisciplinary project squads:<br/>"
        "• <b>Nova Developers:</b> Filtered to find senior students capable of leading module development, code reviews, and API design.<br/>"
        "• <b>Orbit Developers:</b> Evaluated for feature development workload and backend task assignments.<br/>"
        "• <b>Spark Developers:</b> Selected for apprentice roles, QA testing, and documentation tasks.<br/>"
        "• <b>Student Detail Dossier (<code>/developer/students/:id</code>):</b> Inspects a student's active sprint tasks, priority ratings, and upcoming due dates. This ensures no individual student is overloaded across multiple concurrent projects.",
        styles['Body']
    ))

    # 3.5 Client Requirements Engineering
    story.append(Paragraph("3.5 Client Requirements Engineering (<code>/developer/clients</code>)", styles['H2']))
    story.append(Paragraph(
        "Allows developers to review the scope baseline and functional specifications submitted during project intake:<br/>"
        "• In-depth review of functional requirements, system constraints, and client deliverables.<br/>"
        "• Used by developers to decompose high-level project goals into agile <code>modules</code> and executable <code>tasks</code> in Module 7.",
        styles['Body']
    ))

    # 3.6 Finance Oversight (Read-Only)
    story.append(Paragraph("3.6 Finance & Payroll Oversight (<code>/developer/finance</code>)", styles['H2']))
    story.append(Paragraph(
        "Provides read-only visibility into financial boundaries:<br/>"
        "• Tracks budget utilization (Spent vs Allocated) to ensure technical architecture does not exceed client budget caps.<br/>"
        "• Checks stipend disbursements to verify student team compensation.",
        styles['Body']
    ))

    # 3.7 Audit Log & DevOps Integration
    story.append(Paragraph("3.7 System Audit Trail & GitHub Integration", styles['H2']))
    story.append(Paragraph(
        "• <b>System Audit Log (<code>/developer/audit</code>):</b> Displays a complete audit stream. Developers can verify that their proposal decisions, status changes, and faculty bindings have been safely committed.<br/>"
        "• <b>GitHub Integration (<code>/developer/github</code>):</b> Full direct access to git repositories, commits, branch protections, pull requests, and CI/CD pipelines.",
        styles['Body']
    ))
    story.append(Spacer(1, 6))

    # Chapter 4: Project State Machine & Controller Mutations
    story.append(Paragraph("4. Project State Machine & Controller Mutation Logic", styles['H1']))
    story.append(Paragraph(
        "The Developer Controller enforces a strict finite state machine for project lifecycles:",
        styles['Body']
    ))

    fsm_table_data = [
        [Paragraph("Mutation Action", styles['TableHeader']), 
         Paragraph("Controller Method", styles['TableHeader']), 
         Paragraph("Prerequisite Validation", styles['TableHeader']), 
         Paragraph("Database Mutations Executed", styles['TableHeader']), 
         Paragraph("Audit Event Emitted", styles['TableHeader'])],
        
        [Paragraph("<b>Accept Proposal</b>", styles['TableCellBold']),
         Paragraph("<code>updateProposalStatus</code>", styles['TableCell']),
         Paragraph("• <code>status == 'proposed'</code><br/>• Request <code>status == 'accepted'</code><br/>• Optional <code>faculty_id</code> valid in <code>users</code>", styles['TableCell']),
         Paragraph("1. <code>UPDATE projects SET status='accepted'</code><br/>2. If faculty selected, <code>UPDATE projects SET faculty_id=?</code><br/>3. Delete old and <code>INSERT INTO project_faculty</code>", styles['TableCell']),
         Paragraph("<code>'Proposal Accepted'</code> (includes project title, ID, faculty name, notes)", styles['TableCell'])],

        [Paragraph("<b>Reject Proposal</b>", styles['TableCellBold']),
         Paragraph("<code>updateProposalStatus</code>", styles['TableCell']),
         Paragraph("• <code>status == 'proposed'</code><br/>• Request <code>status == 'rejected'</code>", styles['TableCell']),
         Paragraph("1. <code>UPDATE projects SET status='rejected'</code>", styles['TableCell']),
         Paragraph("<code>'Proposal Rejected'</code> (includes project title, ID, rejection notes)", styles['TableCell'])],

        [Paragraph("<b>Start Project (Sprint Kickoff)</b>", styles['TableCellBold']),
         Paragraph("<code>startProject</code>", styles['TableCell']),
         Paragraph("• <code>canWriteProjects()</code> -> <code>auth_user.role == 'developer'</code><br/>• <code>projects.status == 'accepted'</code>", styles['TableCell']),
         Paragraph("1. <code>UPDATE projects SET status='in_progress'</code>", styles['TableCell']),
         Paragraph("<code>'Project Started'</code> (records transition to in_progress)", styles['TableCell'])],

        [Paragraph("<b>Assign / Reassign Faculty</b>", styles['TableCellBold']),
         Paragraph("<code>assignFaculty</code>", styles['TableCell']),
         Paragraph("• <code>projects.status IN ('accepted','in_progress')</code><br/>• <code>users.role IN ('faculty','director','coordinator')</code>", styles['TableCell']),
         Paragraph("1. <code>UPDATE projects SET faculty_id=?</code><br/>2. <code>DELETE FROM project_faculty WHERE project_id=?</code><br/>3. <code>INSERT INTO project_faculty (project_id, faculty_id, assigned_date)</code>", styles['TableCell']),
         Paragraph("<code>'Faculty Assigned'</code> (records assigned professor name, faculty ID, project ID)", styles['TableCell'])],
    ]
    t_fsm = Table(fsm_table_data, colWidths=[80, 95, 110, 140, 94])
    t_fsm.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0D9488")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor("#FFFFFF"), colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_fsm)
    story.append(Spacer(1, 6))

    # Chapter 5: API Specification
    story.append(Paragraph("5. Complete Developer REST API Specification", styles['H1']))
    story.append(Paragraph(
        "All endpoints require JWT Bearer authorization under the prefix <code>/api/developer</code>:",
        styles['Body']
    ))

    api_dev_full = [
        [Paragraph("Method & Route", styles['TableHeader']), 
         Paragraph("Function Name", styles['TableHeader']), 
         Paragraph("Input Payload / URL Params", styles['TableHeader']), 
         Paragraph("Backend Execution & DB Effects", styles['TableHeader']), 
         Paragraph("Audit Log", styles['TableHeader'])],
        
        [Paragraph("<code>GET /overview</code>", styles['TableCellCode']),
         Paragraph("<code>getOverview</code>", styles['TableCell']),
         Paragraph("None", styles['TableCell']),
         Paragraph("Aggregates project counts, active project health, proposals list, and student talent distribution.", styles['TableCell']),
         Paragraph("No", styles['TableCell'])],

        [Paragraph("<code>GET /projects</code>", styles['TableCellCode']),
         Paragraph("<code>getProjects</code>", styles['TableCell']),
         Paragraph("<code>per_page</code> (default 20)", styles['TableCell']),
         Paragraph("Returns active/completed projects with bulk pre-fetched faculty, student chips, and task progress.", styles['TableCell']),
         Paragraph("No", styles['TableCell'])],

        [Paragraph("<code>GET /proposals</code>", styles['TableCellCode']),
         Paragraph("<code>getProposals</code>", styles['TableCell']),
         Paragraph("<code>per_page</code> (default 20)", styles['TableCell']),
         Paragraph("Returns proposed projects awaiting developer decision.", styles['TableCell']),
         Paragraph("No", styles['TableCell'])],

        [Paragraph("<code>POST /proposals/{id}/status</code>", styles['TableCellCode']),
         Paragraph("<code>updateProposalStatus</code>", styles['TableCell']),
         Paragraph("<code>{ status: 'accepted'|'rejected', faculty_id: int|null, notes: string }</code>", styles['TableCellCode']),
         Paragraph("Validates proposal status; updates <code>projects.status</code>; binds faculty in <code>project_faculty</code>.", styles['TableCell']),
         Paragraph("<b>Yes</b>", styles['TableCellBold'])],

        [Paragraph("<code>POST /projects/{id}/start</code>", styles['TableCellCode']),
         Paragraph("<code>startProject</code>", styles['TableCell']),
         Paragraph("<code>id</code> in URL", styles['TableCell']),
         Paragraph("Verifies developer role; checks status is accepted; sets <code>status = 'in_progress'</code>.", styles['TableCell']),
         Paragraph("<b>Yes</b>", styles['TableCellBold'])],

        [Paragraph("<code>POST /projects/{id}/assign-faculty</code>", styles['TableCellCode']),
         Paragraph("<code>assignFaculty</code>", styles['TableCell']),
         Paragraph("<code>{ faculty_id: int }</code>", styles['TableCellCode']),
         Paragraph("Validates faculty user role; updates <code>projects.faculty_id</code> and <code>project_faculty</code> row.", styles['TableCell']),
         Paragraph("<b>Yes</b>", styles['TableCellBold'])],

        [Paragraph("<code>GET /students</code>", styles['TableCellCode']),
         Paragraph("<code>getStudents</code>", styles['TableCell']),
         Paragraph("<code>track=All|Nova|Orbit|Spark</code>", styles['TableCell']),
         Paragraph("Lists student engineers with task counts and project allocations.", styles['TableCell']),
         Paragraph("No", styles['TableCell'])],

        [Paragraph("<code>GET /students/{id}</code>", styles['TableCellCode']),
         Paragraph("<code>getStudentDetail</code>", styles['TableCell']),
         Paragraph("<code>id</code> in URL", styles['TableCell']),
         Paragraph("Detailed student engineering dossier: sprint tasks, status breakdown, GitHub, and mentor lead.", styles['TableCell']),
         Paragraph("No", styles['TableCell'])],

        [Paragraph("<code>GET /client-requirements</code>", styles['TableCellCode']),
         Paragraph("<code>getClientRequirements</code>", styles['TableCell']),
         Paragraph("None", styles['TableCell']),
         Paragraph("Returns client specs, scope documents, and deliverables for technical backlog planning.", styles['TableCell']),
         Paragraph("No", styles['TableCell'])],

        [Paragraph("<code>GET /finance</code>", styles['TableCellCode']),
         Paragraph("<code>getFinanceSummary</code>", styles['TableCell']),
         Paragraph("None", styles['TableCell']),
         Paragraph("Read-only financial summary (budget vs spent, stipend totals).", styles['TableCell']),
         Paragraph("No", styles['TableCell'])],

        [Paragraph("<code>GET /audit-logs</code>", styles['TableCellCode']),
         Paragraph("<code>getAuditLogs</code>", styles['TableCell']),
         Paragraph("<code>per_page</code> (default 20)", styles['TableCell']),
         Paragraph("Paginated security audit log stream.", styles['TableCell']),
         Paragraph("No", styles['TableCell'])],
    ]
    t_api_dev = Table(api_dev_full, colWidths=[95, 90, 115, 169, 50])
    t_api_dev.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0D9488")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor("#FFFFFF"), colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_api_dev)
    story.append(Spacer(1, 6))

    # Chapter 6: Step-by-Step Developer Operations Guide
    story.append(Paragraph("6. Step-by-Step Developer Operations Guide & Scenarios", styles['H1']))
    story.append(Paragraph(
        "<b>Scenario A — Triaging a New Project Proposal:</b><br/>"
        "1. Login as Developer (<code>developer@rajagiri.edu</code> / <code>developer123</code>). Lands on <code>/developer</code>.<br/>"
        "2. Review the 'Proposals Requiring Developer Decision' list. Click 'Review & Assign' on a proposal.<br/>"
        "3. Review technical deliverables and expected timeline. Evaluate which faculty member has the required domain expertise (e.g., AI/ML vs Web Cloud Systems).<br/>"
        "4. Check each faculty member's current active project load in the radio selector.<br/>"
        "5. Select the chosen faculty lead, enter onboarding remarks (e.g., <i>'Approved for Phase 1 MVP sprint'</i>), and click 'Accept & Assign Faculty'.<br/>"
        "6. The proposal is instantly accepted, bound to the faculty lead, and an audit log is emitted.<br/>"
        "<br/>"
        "<b>Scenario B — Inaugurating an Accepted Project (Sprint Kickoff):</b><br/>"
        "1. Navigate to <code>Projects & Proposals</code> (<code>/developer/projects</code>).<br/>"
        "2. Locate the accepted project in the project table.<br/>"
        "3. Click the green <b>'Start Project'</b> button.<br/>"
        "4. The system validates developer permissions, updates the database status to <code>'in_progress'</code>, and logs 'Project Started'.<br/>"
        "<br/>"
        "<b>Scenario C — Rebalancing Faculty Mentorship:</b><br/>"
        "1. If an assigned faculty member goes on sabbatical or requires workload relief, open <code>Projects & Proposals</code>.<br/>"
        "2. Click <b>'Reassign Faculty'</b> on the target project.<br/>"
        "3. Select a new faculty lead from the modal and click 'Save Assignment'. The system updates <code>projects.faculty_id</code> and refreshes the binding in <code>project_faculty</code>.",
        styles['Body']
    ))

    doc.build(story, canvasmaker=get_canvas_builder("Developer Module Technical Specification"))
    print(f"Developer PDF generated successfully: {output_path}")

def build_comparative_master_pdf(output_path):
    styles = get_styles()
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=LEFT_MARGIN,
        rightMargin=RIGHT_MARGIN,
        topMargin=TOP_MARGIN,
        bottomMargin=BOTTOM_MARGIN
    )
    story = []
    
    # Title Block
    meta = {
        "Document Type": "Architectural Reference & Master Guide",
        "Modules Covered": "Director Module (Module 2) & Developer Module",
        "Platform": "RLabz ERP — Rajagiri Incubation Center",
        "Target Audience": "Executive Leadership, Technical Leads, Evaluators & Auditors",
        "Version": "ERP v2.4 Enterprise Master Edition"
    }
    story.extend(make_header_block(
        "RLabz ERP — Director vs. Developer Modules Master Reference",
        "Comprehensive Architecture, Functional Specifications, Governance Differences & Technical Guide",
        meta, styles, banner_color="#312E81"
    ))
    
    # Chapter 1: Introduction & Architectural Rationale
    story.append(Paragraph("1. System Architecture & The Separation of Duties (SoD)", styles['H1']))
    story.append(Paragraph(
        "The RLabz ERP platform is engineered around the formal enterprise governance principle of <b>Separation of Duties (SoD)</b>. "
        "In institutional software development and incubation cells like Rajagiri RLabz, there is an inherent institutional tension "
        "between <b>strategic executive oversight</b> (institutional alignment, budget burn monitoring, accreditation reporting, compliance) "
        "and <b>tactical engineering operations</b> (proposal technical triage, faculty mentor allocation, sprint inauguration, and repository governance).<br/>"
        "To guarantee institutional integrity, RLabz ERP divides these responsibilities between two complementary modules:",
        styles['Body']
    ))
    story.append(Paragraph(
        "• <b>Director Module (Executive Oversight):</b> Engineered for College Directors, Deans, and Executive Leadership. "
        "Provides total institutional transparency, real-time project health radar, student talent tracking across Nova/Orbit/Spark designations, "
        "and financial visibility, backed by <b>strictly enforced read-only governance</b> over operational project states.<br/>"
        "• <b>Developer Module (Engineering Operations):</b> Engineered for Lead Developers, Technical Project Leads, and System Architects. "
        "Provides an identical operational perspective combined with <b>authorized write capabilities</b> to accept/reject proposals, "
        "assign and reassign faculty leads, kick off development sprints, and author new software projects.",
        styles['Body']
    ))
    story.append(Spacer(1, 4))

    # Chapter 2: Comprehensive 14-Point Comparison Matrix
    story.append(Paragraph("2. Side-by-Side Capability & Permission Comparison Matrix", styles['H1']))
    story.append(Paragraph(
        "The matrix below contrasts the architectural, operational, and security attributes of both modules:",
        styles['Body']
    ))

    comp_full_data = [
        [Paragraph("Operational Dimension", styles['TableHeader']), 
         Paragraph("Director Module (Module 2)", styles['TableHeader']), 
         Paragraph("Developer Module", styles['TableHeader']), 
         Paragraph("Architectural & Governance Rationale", styles['TableHeader'])],
        
        [Paragraph("<b>Target User Persona</b>", styles['TableCellBold']),
         Paragraph("College Director, Deans, Academic Management", styles['TableCell']),
         Paragraph("Lead Software Engineer, Technical Project Lead", styles['TableCell']),
         Paragraph("Distinguishes macro institutional leadership from technical execution.", styles['TableCell'])],

        [Paragraph("<b>Default Login Credentials</b>", styles['TableCellBold']),
         Paragraph("<code>director@rajagiri.edu</code> / <code>director123</code>", styles['TableCellCode']),
         Paragraph("<code>developer@rajagiri.edu</code> / <code>developer123</code>", styles['TableCellCode']),
         Paragraph("Pre-seeded mock credentials for development and staging.", styles['TableCell'])],

        [Paragraph("<b>Primary Landing URL</b>", styles['TableCellBold']),
         Paragraph("<code>/dashboard</code> (or <code>/director</code>)", styles['TableCellCode']),
         Paragraph("<code>/developer</code> (or <code>/dashboard</code>)", styles['TableCellCode']),
         Paragraph("Guarded by <code>authGuard.js</code> with role-specific redirection.", styles['TableCell'])],

        [Paragraph("<b>Topbar Title Display</b>", styles['TableCellBold']),
         Paragraph("<b>DIRECTOR DASHBOARD</b>", styles['TableCellBold']),
         Paragraph("<b>DEVELOPER DASHBOARD</b>", styles['TableCellBold']),
         Paragraph("Enforces visual role context and interface branding.", styles['TableCell'])],

        [Paragraph("<b>Sidebar Portal Branding</b>", styles['TableCellBold']),
         Paragraph("<code>portal='director'</code>", styles['TableCellCode']),
         Paragraph("<code>portal='developer'</code> ('Developer Operations')", styles['TableCellCode']),
         Paragraph("Tailors navigation links to relevant role responsibilities.", styles['TableCell'])],

        [Paragraph("<b>Backend Controller File</b>", styles['TableCellBold']),
         Paragraph("<code>Modules/Director/Controllers/DirectorController.php</code> (840 lines)", styles['TableCellCode']),
         Paragraph("<code>Modules/Developer/Controllers/DeveloperController.php</code> (1018 lines)", styles['TableCellCode']),
         Paragraph("Isolated controller classes prevent code regressions.", styles['TableCell'])],

        [Paragraph("<b>Backend Route Prefix</b>", styles['TableCellBold']),
         Paragraph("<code>/api/director/*</code>", styles['TableCellCode']),
         Paragraph("<code>/api/developer/*</code>", styles['TableCellCode']),
         Paragraph("Discrete route groups enforce clean API separation.", styles['TableCell'])],

        [Paragraph("<b>Proposal Triage (Accept / Reject)</b>", styles['TableCellBold']),
         Paragraph("<b>Read-Only</b><br/>Can inspect proposal details; Accept/Reject buttons hidden or disabled.", styles['TableCell']),
         Paragraph("<b>Full Write Authority</b><br/>Executes <code>POST /api/developer/proposals/{id}/status</code> with audit notes.", styles['TableCellBold']),
         Paragraph("Directors evaluate strategic fit; Developers verify technical feasibility and capacity.", styles['TableCell'])],

        [Paragraph("<b>Faculty Lead Assignment</b>", styles['TableCellBold']),
         Paragraph("<b>Read-Only</b><br/>Can view assigned lead faculty; reassign modal is disabled.", styles['TableCell']),
         Paragraph("<b>Full Write Authority</b><br/>Executes <code>POST /api/developer/projects/{id}/assign-faculty</code>.", styles['TableCellBold']),
         Paragraph("Prevents managerial overriding of technical workload balancing.", styles['TableCell'])],

        [Paragraph("<b>Sprint Start Execution</b>", styles['TableCellBold']),
         Paragraph("<b>Forbidden (403)</b><br/>Cannot start projects.", styles['TableCell']),
         Paragraph("<b>Authorized Write</b><br/>Executes <code>POST /api/developer/projects/{id}/start</code> to transition status.", styles['TableCellBold']),
         Paragraph("Only engineering teams can verify sprint readiness before kickoff.", styles['TableCell'])],

        [Paragraph("<b>Project Creation Wizard</b>", styles['TableCellBold']),
         Paragraph("Read-only project catalog.", styles['TableCell']),
         Paragraph("Full access to <code>ProjectCreate.js</code> wizard.", styles['TableCellBold']),
         Paragraph("Developers define technical project parameters and milestones.", styles['TableCell'])],

        [Paragraph("<b>Student Talent Roster (Nova / Orbit / Spark)</b>", styles['TableCellBold']),
         Paragraph("Full visibility, multi-field search, track filtering, and detail dossier.", styles['TableCell']),
         Paragraph("Full visibility, multi-field search, track filtering, and detail dossier.", styles['TableCell']),
         Paragraph("Both personas need complete clarity into student talent capacity.", styles['TableCell'])],

        [Paragraph("<b>Finance Oversight</b>", styles['TableCellBold']),
         Paragraph("Read-only executive transparency (budget vs spent, stipend payroll, invoices).", styles['TableCell']),
         Paragraph("Read-only transparency (budget cap awareness, student compensation checks).", styles['TableCell']),
         Paragraph("Financial modifications are strictly isolated to Module 5 (Finance Head).", styles['TableCell'])],

        [Paragraph("<b>System Audit Trail</b>", styles['TableCellBold']),
         Paragraph("Monitors all system events, approvals, and rejections.", styles['TableCell']),
         Paragraph("Monitors system events; developer's actions automatically write to log.", styles['TableCell']),
         Paragraph("Full institutional compliance and non-repudiation.", styles['TableCell'])],
    ]

    t_comp = Table(comp_full_data, colWidths=[90, 130, 145, 154])
    t_comp.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#312E81")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor("#FFFFFF"), colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_comp)
    story.append(Spacer(1, 8))

    # Chapter 3: Database Schema & Entity Relationships
    story.append(Paragraph("3. Database Schema & Relational Entity Architecture", styles['H1']))
    story.append(Paragraph(
        "Both modules interface directly with MySQL (<code>rlabz_erp</code>). The table below outlines the core schema:",
        styles['Body']
    ))

    db_data = [
        [Paragraph("Table Name", styles['TableHeader']), 
         Paragraph("Key Columns & Types", styles['TableHeader']), 
         Paragraph("Role & Usage in Director & Developer Modules", styles['TableHeader'])],
        
        [Paragraph("<code>projects</code>", styles['TableCellCode']),
         Paragraph("<code>id (PK), title, client_name, budget, spent, status, faculty_id, expected_timeline, deliverables</code>", styles['TableCell']),
         Paragraph("Central entity. Status values: <code>'proposed', 'accepted', 'in_progress', 'completed', 'closed', 'rejected'</code>. Director reads all; Developer modifies status and faculty.", styles['TableCell'])],

        [Paragraph("<code>users</code>", styles['TableCellCode']),
         Paragraph("<code>id (PK), name, email, password, role ('director', 'developer', 'faculty', 'student', 'admin')</code>", styles['TableCell']),
         Paragraph("Central identity table. Used for authentication and role-based permissions.", styles['TableCell'])],

        [Paragraph("<code>student_profiles</code>", styles['TableCellCode']),
         Paragraph("<code>id (PK), student_id (FK), designation ('nova', 'orbit', 'spark'), course, semester, gpa, attendance</code>", styles['TableCell']),
         Paragraph("Stores talent designations. Nova = Tier 1 (₹5k), Orbit = Tier 2 (₹3k), Spark = Tier 3 (₹1.5k). Used for talent rosters and stipend payroll calculations.", styles['TableCell'])],

        [Paragraph("<code>project_faculty</code>", styles['TableCellCode']),
         Paragraph("<code>id (PK), project_id (FK), faculty_id (FK), assigned_date</code>", styles['TableCell']),
         Paragraph("Associates faculty leads with projects. Developer inserts/updates this table upon proposal acceptance or reassignment.", styles['TableCell'])],

        [Paragraph("<code>project_student</code>", styles['TableCellCode']),
         Paragraph("<code>id (PK), project_id (FK), student_id (FK), role</code>", styles['TableCell']),
         Paragraph("Associates student developers with active projects. Rendered as track chips in project tables.", styles['TableCell'])],

        [Paragraph("<code>tasks</code> & <code>modules</code>", styles['TableCellCode']),
         Paragraph("<code>id (PK), module_id (FK), project_id (FK), title, status ('completed', 'done', 'in_progress'), assigned_to</code>", styles['TableCell']),
         Paragraph("Used to dynamically compute project progress percentage: <code>(completed_tasks / total_tasks) * 100</code>.", styles['TableCell'])],

        [Paragraph("<code>audit_logs</code>", styles['TableCellCode']),
         Paragraph("<code>id (PK), user_id (FK), action, description, created_at</code>", styles['TableCell']),
         Paragraph("Tamper-evident system activity log. Developer actions write here; Director and Developer audit views read from here.", styles['TableCell'])],

        [Paragraph("<code>stipends</code> & <code>invoices</code>", styles['TableCellCode']),
         Paragraph("<code>id (PK), project_id (FK), amount, status</code>", styles['TableCell']),
         Paragraph("Aggregated by <code>getFinanceSummary()</code> to calculate disbursed expenditures and pending receivables.", styles['TableCell'])],
    ]

    t_db = Table(db_data, colWidths=[95, 185, 239])
    t_db.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#312E81")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor("#FFFFFF"), colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_db)
    story.append(Spacer(1, 8))

    # Chapter 4: End-to-End Operational Lifecycle Walkthrough
    story.append(Paragraph("4. End-to-End Project Proposal & Kickoff Lifecycle", styles['H1']))
    story.append(Paragraph(
        "The sequence below outlines how both modules collaborate during a project's lifecycle:",
        styles['Body']
    ))
    story.append(Paragraph(
        "<b>Phase 1: Proposal Intake & Submission</b><br/>"
        "A client or academic sponsor submits a project proposal. The record is inserted into <code>projects</code> with <code>status = 'proposed'</code>.<br/>"
        "• The <b>Director</b> sees the proposal in the 'Proposals Requiring Review' widget on <code>/dashboard</code>. The Director inspects budget feasibility, deliverables, and timeline in read-only mode.<br/>"
        "• The <b>Developer</b> sees the proposal in the 'Proposals Requiring Developer Decision' widget on <code>/developer</code>.<br/>"
        "<br/>"
        "<b>Phase 2: Technical Triage & Acceptance</b><br/>"
        "The Developer evaluates technical feasibility, hardware/software stack requirements, and student talent capacity.<br/>"
        "• The Developer clicks <b>Review & Assign</b>, chooses an eligible lead faculty member from the radio list, inputs engineering kickoff notes, and clicks <b>Accept & Assign Faculty</b>.<br/>"
        "• Backend: <code>DeveloperController@updateProposalStatus</code> updates status to <code>accepted</code>, binds faculty, inserts into <code>project_faculty</code>, and logs 'Proposal Accepted' into <code>audit_logs</code>.<br/>"
        "<br/>"
        "<b>Phase 3: Sprint Activation (Start Project)</b><br/>"
        "Once accepted, the project enters the staged queue.<br/>"
        "• The Developer clicks <b>Start Project</b>.<br/>"
        "• Backend: <code>DeveloperController@startProject</code> verifies <code>canWriteProjects()</code>, updates status to <code>in_progress</code>, and logs 'Project Started' into <code>audit_logs</code>.<br/>"
        "<br/>"
        "<b>Phase 4: Ongoing Monitoring & Progress Synchronization</b><br/>"
        "As development tasks are completed in Module 7 (Project Management):<br/>"
        "• The task completion formula automatically increments project progress percentage in real time.<br/>"
        "• The <b>Director</b> monitors progress radar, delivery velocity, and budget spend against milestones.<br/>"
        "• The <b>Developer</b> manages technical blockers, reassigns faculty if required, and coordinates student track talent.",
        styles['Body']
    ))
    story.append(Spacer(1, 6))

    # Chapter 5: Security Architecture & Route Protection
    story.append(Paragraph("5. Route Protection, RBAC & Security Matrix", styles['H1']))
    story.append(Paragraph(
        "The security architecture employs layered defenses across client and server:",
        styles['Body']
    ))
    story.append(Paragraph(
        "1. <b>Client-Side Guard (<code>authGuard.js</code>):</b> Validates JWT token existence. Restricts routes based on <code>meta.requiredAnyPermissions</code>. Explicitly blocks the Admin role from entering director or developer dashboards (forcing redirection to <code>/admin</code>).<br/>"
        "2. <b>Server-Side Middleware (<code>JwtMiddleware</code>):</b> Validates Bearer token signature, expiration, and claims. Injects authenticated user payload (<code>auth_user</code>) into the request.<br/>"
        "3. <b>Controller Role Verification (<code>canWriteProjects</code>):</b> Ensures that only requests with <code>auth_user.role === 'developer'</code> can execute state changes.<br/>"
        "4. <b>Explicit 403 Hardening:</b> In <code>DirectorController.php</code>, mutating endpoints explicitly return HTTP 403 Forbidden with descriptive error messages, guaranteeing that even if a Director account is compromised, project states cannot be altered through API tampering.",
        styles['Body']
    ))
    story.append(Spacer(1, 6))

    # Chapter 6: Explaining to Stakeholders (FAQ & Presentation Guide)
    story.append(Paragraph("6. Stakeholder Explanation Guide & FAQ", styles['H1']))
    story.append(Paragraph(
        "When explaining or demonstrating these modules to professors, directors, or evaluation panels, use the following key talking points:<br/>"
        "• <b>Q: Why do both Director and Developer have similar dashboard screens?</b><br/>"
        "<i>Answer:</i> Both roles require macro visibility over institutional project health, talent distribution, and financial burn rate. However, their <b>operational authority</b> is completely segregated: Directors have strategic read-only governance, while Developers possess technical write execution authority.<br/>"
        "• <b>Q: Can a Director reassign faculty if a professor is on leave?</b><br/>"
        "<i>Answer:</i> No. To maintain peer-reviewed engineering workload balance, only the Lead Developer can reassign faculty members through the operational project portal. The Director can recommend changes during executive reviews.<br/>"
        "• <b>Q: How is project progress computed?</b><br/>"
        "<i>Answer:</i> Project progress is dynamically calculated from real child module tasks: <code>round((completed_tasks / total_tasks) * 100)</code>. It is never manually estimated, ensuring total transparency.<br/>"
        "• <b>Q: How does student track tiering work?</b><br/>"
        "<i>Answer:</i> Students are classified into Nova (lead architects, ₹5,000 stipend), Orbit (core developers, ₹3,000 stipend), and Spark (junior developers, ₹1,500 stipend). Both modules provide live roster filtering and individual task dossiers.",
        styles['Body']
    ))

    doc.build(story, canvasmaker=get_canvas_builder("Director vs Developer Modules Master Specification"))
    print(f"Master Comparative PDF generated successfully: {output_path}")

if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(__file__), "documentation", "pdf")
    os.makedirs(out_dir, exist_ok=True)
    
    dir_pdf = os.path.join(out_dir, "RLabz_ERP_Director_Module_Documentation.pdf")
    dev_pdf = os.path.join(out_dir, "RLabz_ERP_Developer_Module_Documentation.pdf")
    master_pdf = os.path.join(out_dir, "RLabz_ERP_Director_and_Developer_Modules_Comprehensive_Guide.pdf")
    
    build_director_pdf(dir_pdf)
    build_developer_pdf(dev_pdf)
    build_comparative_master_pdf(master_pdf)
    print("All 3 comprehensive documentation PDFs generated successfully!")
