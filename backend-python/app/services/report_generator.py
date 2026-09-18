import os
from datetime import datetime
import pymupdf
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.graphics.shapes import Drawing, String
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.legends import Legend

from app.database import SessionLocalApp
from app.models.report import Report
from app.models.invoice import Invoice
from app.models.service_order import ServiceOrder
from app.core.config import settings

def generate_monthly_report_task(report_id: int, tenant_id: int, reference_month: str):
    db = SessionLocalApp()
    try:
        report = db.query(Report).filter(Report.id == report_id).first()
        if not report:
            return
            
        # Parse reference_month (format "YYYY-MM")
        year_str, month_str = reference_month.split('-')
        year = int(year_str)
        month = int(month_str)
        
        # --- FETCH INVOICES ---
        all_invoices = db.query(Invoice).filter(Invoice.tenant_id == tenant_id).all()
        month_invoices = []
        for inv in all_invoices:
            date_to_check = inv.issue_date or inv.created_at
            if type(date_to_check) is str:
                try:
                    dt = datetime.fromisoformat(date_to_check.replace(' ', 'T'))
                    if dt.year == year and dt.month == month:
                        month_invoices.append(inv)
                except:
                    pass
            elif type(date_to_check) is datetime:
                if date_to_check.year == year and date_to_check.month == month:
                    month_invoices.append(inv)
                    
        month_invoices.sort(key=lambda x: x.created_at if type(x.created_at) is datetime else datetime.min)
        
        # --- FETCH PENDING OS ---
        all_os = db.query(ServiceOrder).filter(ServiceOrder.tenant_id == tenant_id).all()
        pending_os = [o for o in all_os if o.status in ("PENDING", "PENDENTE")]
        
        reports_dir = os.path.join(settings.UPLOAD_DIR, "reports")
        if not os.path.exists(reports_dir):
            os.makedirs(reports_dir)
            
        base_pdf_name = f"report_base_{tenant_id}_{reference_month}_{report_id}.pdf"
        base_pdf_path = os.path.join(reports_dir, base_pdf_name)
        
        # --- GENERATE PDF BASE ---
        doc = SimpleDocTemplate(
            base_pdf_path, 
            pagesize=A4,
            rightMargin=40, leftMargin=40,
            topMargin=40, bottomMargin=40
        )
        elements = []
        styles = getSampleStyleSheet()
        
        # Custom Styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor("#1e1b4b"),
            spaceAfter=5
        )
        subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=styles['Normal'],
            fontSize=12,
            textColor=colors.HexColor("#64748b"),
            spaceAfter=20
        )
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor("#334155"),
            spaceBefore=20,
            spaceAfter=10
        )
        normal_style = styles['Normal']
        
        # HEADER
        elements.append(Paragraph(f"<b>Antigravity SaaS</b> - Relatório Gerencial", title_style))
        elements.append(Paragraph(f"Referência: <b>{month_str}/{year_str}</b> | Gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M')}", subtitle_style))
        elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#e2e8f0"), spaceAfter=20))
        
        # 1. SUMMARY & CHART
        status_sums = {}
        for inv in month_invoices:
            st = inv.status or "INDEFINIDO"
            val = inv.total_value or 0
            status_sums[st] = status_sums.get(st, 0) + val
            
        total_invoices_value = sum(status_sums.values())
        total_processed = sum([i.total_value for i in month_invoices if i.status in ("PROCESSED", "PROCESSADO", "EMITIDA", "BILLED") and i.total_value])
        
        summary_table = Table([
            [Paragraph("<b>Volume Total Bruto:</b>", normal_style), Paragraph(f"<font color='#1e293b'><b>R$ {total_invoices_value:,.2f}</b></font>", normal_style)],
            [Paragraph("<b>Faturamento Confirmado:</b>", normal_style), Paragraph(f"<font color='#16a34a'><b>R$ {total_processed:,.2f}</b></font>", normal_style)],
            [Paragraph("<b>Total de Notas:</b>", normal_style), Paragraph(f"{len(month_invoices)} notas processadas", normal_style)]
        ], colWidths=[150, 250])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
            ('PADDING', (0,0), (-1,-1), 8),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#e2e8f0")),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        
        elements.append(Paragraph("Resumo Financeiro", heading_style))
        elements.append(summary_table)
        elements.append(Spacer(1, 20))
        
        if total_invoices_value > 0:
            d = Drawing(400, 180)
            
            # Pie Chart
            pc = Pie()
            pc.x = 20
            pc.y = 20
            pc.width = 140
            pc.height = 140
            
            # Colors palette for the pie chart
            palette = [
                colors.HexColor("#10b981"), # Green
                colors.HexColor("#f59e0b"), # Yellow
                colors.HexColor("#ef4444"), # Red
                colors.HexColor("#3b82f6"), # Blue
                colors.HexColor("#8b5cf6")  # Purple
            ]
            
            data = []
            labels = []
            colors_list = []
            for i, (k, v) in enumerate(status_sums.items()):
                if v > 0:
                    data.append(v)
                    labels.append(f"{k} (R$ {v:,.2f})")
                    colors_list.append(palette[i % len(palette)])
                    
            pc.data = data
            pc.labels = [] # Hide internal labels
            
            # Apply colors
            for i, color in enumerate(colors_list):
                pc.slices[i].fillColor = color
                pc.slices[i].strokeColor = colors.white
                pc.slices[i].strokeWidth = 1
                
            d.add(pc)
            
            # Legend
            legend = Legend()
            legend.x = 200
            legend.y = 140
            legend.dx = 10
            legend.dy = 10
            legend.fontName = 'Helvetica'
            legend.fontSize = 10
            legend.boxAnchor = 'nw'
            legend.columnMaximum = 10
            legend.strokeWidth = 0
            legend.strokeColor = colors.transparent
            legend.colorNamePairs = [(colors_list[i], labels[i]) for i in range(len(data))]
            d.add(legend)
            
            elements.append(d)
            elements.append(Spacer(1, 20))
        
        # 2. TABLE: Invoices
        elements.append(Paragraph("Detalhamento de Notas Fiscais", heading_style))
        table_data = [["ID", "Documento", "Emissor", "Status", "Valor"]]
        for inv in month_invoices:
            val = f"R$ {inv.total_value:,.2f}" if inv.total_value else "-"
            # Truncate issuer
            issuer = inv.issuer_name or inv.issuer_cnpj or "-"
            if len(issuer) > 20: issuer = issuer[:17] + "..."
            table_data.append([str(inv.id), inv.document_type, issuer, inv.status, val])
            
        if len(table_data) > 1:
            t = Table(table_data, colWidths=[30, 80, 150, 90, 90])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#4f46e5")),
                ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0,0), (-1,0), 8),
                ('TOPPADDING', (0,0), (-1,0), 8),
                ('BACKGROUND', (0,1), (-1,-1), colors.HexColor("#f8fafc")),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
                ('FONTSIZE', (0,1), (-1,-1), 9)
            ]))
            elements.append(t)
        else:
            elements.append(Paragraph("Nenhuma nota fiscal registrada neste período.", normal_style))
            
        elements.append(Spacer(1, 20))
        
        # 3. TABLE: Pending OS
        elements.append(Paragraph("Ações Necessárias: OS Pendentes de Faturamento", heading_style))
        if pending_os:
            os_table_data = [["ID", "Descrição do Serviço", "Data", "Valor"]]
            for os_obj in pending_os:
                date_str = "-"
                if type(os_obj.execution_date) is str:
                    date_str = os_obj.execution_date[:10]
                elif type(os_obj.execution_date) is datetime:
                    date_str = os_obj.execution_date.strftime("%Y-%m-%d")
                    
                val = f"R$ {os_obj.value:,.2f}" if os_obj.value else "-"
                desc = os_obj.description[:45] + "..." if os_obj.description and len(os_obj.description) > 45 else os_obj.description
                os_table_data.append([str(os_obj.id), desc or "-", date_str, val])
                
            t_os = Table(os_table_data, colWidths=[40, 240, 80, 80])
            t_os.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#dc2626")),
                ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0,0), (-1,0), 8),
                ('TOPPADDING', (0,0), (-1,0), 8),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#fef2f2")]),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#fca5a5")),
                ('FONTSIZE', (0,1), (-1,-1), 9)
            ]))
            elements.append(t_os)
            elements.append(Spacer(1, 10))
            elements.append(Paragraph(f"<font color='#dc2626'><b>Atenção:</b> Existem {len(pending_os)} OS pendentes que impactam o faturamento.</font>", normal_style))
        else:
            elements.append(Paragraph("Excelente! Nenhuma Ordem de Serviço atrasada ou pendente.", normal_style))
            
        doc.build(elements)
        
        # --- MERGE PDFS ---
        final_pdf_name = f"fechamento_{tenant_id}_{reference_month}_{report_id}.pdf"
        final_pdf_path = os.path.join(reports_dir, final_pdf_name)
        
        merged_doc = pymupdf.open(base_pdf_path)
        
        for inv in month_invoices:
            if inv.file_path and inv.file_path.lower().endswith(".pdf"):
                if os.path.isabs(inv.file_path):
                    inv_full_path = inv.file_path
                else:
                    fp = inv.file_path.replace("uploads\\", "").replace("uploads/", "")
                    inv_full_path = os.path.join(settings.UPLOAD_DIR, fp)
                
                inv_full_path = os.path.normpath(inv_full_path)
                
                if os.path.exists(inv_full_path):
                    try:
                        inv_pdf = pymupdf.open(inv_full_path)
                        merged_doc.insert_pdf(inv_pdf)
                        inv_pdf.close()
                    except Exception as e:
                        print(f"Failed to merge PDF {inv_full_path}: {e}")
                        
        merged_doc.save(final_pdf_path)
        merged_doc.close()
        
        try:
            os.remove(base_pdf_path)
        except:
            pass
            
        report.status = "COMPLETED"
        report.file_path = f"uploads/reports/{final_pdf_name}"
        db.commit()
        
    except Exception as e:
        print(f"Error generating report: {e}")
        try:
            report = db.query(Report).filter(Report.id == report_id).first()
            report.status = "ERROR"
            db.commit()
        except:
            pass
    finally:
        db.close()
