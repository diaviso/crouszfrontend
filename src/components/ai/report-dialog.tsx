'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useGroupReport, useProjectReport, ReportData, ReportSection, ReportItem } from '@/hooks/use-reports';
import {
  FileText,
  Loader2,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Clock,
  Download,
  FileDown,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface ReportDialogProps {
  type: 'group' | 'project';
  id: string;
  name: string;
}

function StatusBadge({ status }: { status?: string }) {
  if (status === 'good') return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />Bon</Badge>;
  if (status === 'warning') return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><AlertTriangle className="h-3 w-3 mr-1" />Attention</Badge>;
  if (status === 'danger') return <Badge className="bg-red-500/10 text-red-500 border-red-500/20"><XCircle className="h-3 w-3 mr-1" />Critique</Badge>;
  return null;
}

function ReportSectionView({ section }: { section: ReportSection }) {
  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          {section.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{section.content}</p>

        {/* Metrics grid */}
        {section.metrics && Object.keys(section.metrics).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(section.metrics).map(([key, value]) => (
              <div key={key} className="bg-muted/40 rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground">{key}</p>
                <p className="text-lg font-bold text-primary">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Items list */}
        {section.items && section.items.length > 0 && (
          <div className="space-y-2">
            {section.items.map((item: ReportItem, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.value}</p>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReportContent({ report }: { report: ReportData }) {
  const handleExportWord = async () => {
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel, BorderStyle, AlignmentType } = await import('docx');
    const { saveAs } = await import('file-saver');

    const children: any[] = [];

    // Title
    children.push(new Paragraph({
      children: [new TextRun({ text: report.title, bold: true, size: 32, font: 'Calibri' })],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    }));

    // Date
    children.push(new Paragraph({
      children: [new TextRun({ text: `Généré le : ${new Date(report.generatedAt).toLocaleString('fr-FR')}`, italics: true, size: 20, color: '666666', font: 'Calibri' })],
      spacing: { after: 300 },
    }));

    // Summary
    children.push(new Paragraph({
      children: [new TextRun({ text: 'Résumé', bold: true, size: 24, font: 'Calibri' })],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
    }));
    children.push(new Paragraph({
      children: [new TextRun({ text: report.summary, size: 22, font: 'Calibri' })],
      spacing: { after: 300 },
    }));

    // Sections
    for (const section of report.sections) {
      children.push(new Paragraph({
        children: [new TextRun({ text: section.title, bold: true, size: 26, font: 'Calibri' })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 100 },
      }));

      children.push(new Paragraph({
        children: [new TextRun({ text: section.content, size: 22, font: 'Calibri' })],
        spacing: { after: 200 },
      }));

      // Metrics as table
      if (section.metrics && Object.keys(section.metrics).length > 0) {
        const rows = Object.entries(section.metrics).map(([key, value]) =>
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: key, bold: true, size: 20, font: 'Calibri' })] })],
                width: { size: 50, type: WidthType.PERCENTAGE },
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: String(value), size: 20, font: 'Calibri' })], alignment: AlignmentType.CENTER })],
                width: { size: 50, type: WidthType.PERCENTAGE },
              }),
            ],
          })
        );
        children.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }));
        children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
      }

      // Items as bullet list
      if (section.items && section.items.length > 0) {
        for (const item of section.items) {
          const statusLabel = item.status === 'good' ? ' ✅' : item.status === 'warning' ? ' ⚠️' : item.status === 'danger' ? ' ❌' : '';
          children.push(new Paragraph({
            children: [
              new TextRun({ text: `${item.label}`, bold: true, size: 20, font: 'Calibri' }),
              new TextRun({ text: ` — ${item.value}${statusLabel}`, size: 20, font: 'Calibri' }),
            ],
            bullet: { level: 0 },
            spacing: { after: 60 },
          }));
        }
        children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
      }
    }

    const doc = new Document({
      sections: [{ children }],
      creator: 'CrouszAI',
      title: report.title,
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `rapport-${report.type}-${new Date().toISOString().slice(0, 10)}.docx`);
  };

  const handleExportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 20;

    const addPageIfNeeded = (requiredSpace: number) => {
      if (y + requiredSpace > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        y = 20;
      }
    };

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(report.title, margin, y);
    y += 10;

    // Date
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(120, 120, 120);
    doc.text(`Genere le : ${new Date(report.generatedAt).toLocaleString('fr-FR')}`, margin, y);
    y += 10;
    doc.setTextColor(0, 0, 0);

    // Summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resume', margin, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryLines = doc.splitTextToSize(report.summary, pageWidth - margin * 2);
    addPageIfNeeded(summaryLines.length * 5);
    doc.text(summaryLines, margin, y);
    y += summaryLines.length * 5 + 8;

    // Sections
    for (const section of report.sections) {
      addPageIfNeeded(20);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text(section.title, margin, y);
      y += 7;
      doc.setTextColor(0, 0, 0);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const contentLines = doc.splitTextToSize(section.content, pageWidth - margin * 2);
      addPageIfNeeded(contentLines.length * 5);
      doc.text(contentLines, margin, y);
      y += contentLines.length * 5 + 4;

      // Metrics as table
      if (section.metrics && Object.keys(section.metrics).length > 0) {
        const metricsData = Object.entries(section.metrics).map(([key, value]) => [key, String(value)]);
        addPageIfNeeded(metricsData.length * 8 + 10);
        autoTable(doc, {
          startY: y,
          head: [['Metrique', 'Valeur']],
          body: metricsData,
          margin: { left: margin, right: margin },
          styles: { fontSize: 9, font: 'helvetica' },
          headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          theme: 'grid',
        });
        y = (doc as any).lastAutoTable.finalY + 6;
      }

      // Items as table
      if (section.items && section.items.length > 0) {
        const itemsData = section.items.map((item) => {
          const statusLabel = item.status === 'good' ? 'Bon' : item.status === 'warning' ? 'Attention' : item.status === 'danger' ? 'Critique' : '';
          return [item.label, String(item.value), statusLabel];
        });
        addPageIfNeeded(itemsData.length * 8 + 10);
        autoTable(doc, {
          startY: y,
          head: [['Element', 'Detail', 'Statut']],
          body: itemsData,
          margin: { left: margin, right: margin },
          styles: { fontSize: 9, font: 'helvetica' },
          headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          theme: 'grid',
          columnStyles: {
            2: {
              cellWidth: 25,
              halign: 'center',
            },
          },
          didParseCell: (data: any) => {
            if (data.section === 'body' && data.column.index === 2) {
              if (data.cell.raw === 'Bon') data.cell.styles.textColor = [34, 197, 94];
              else if (data.cell.raw === 'Attention') data.cell.styles.textColor = [234, 179, 8];
              else if (data.cell.raw === 'Critique') data.cell.styles.textColor = [239, 68, 68];
            }
          },
        });
        y = (doc as any).lastAutoTable.finalY + 6;
      }

      y += 4;
    }

    doc.save(`rapport-${report.type}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gradient">{report.title}</h2>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Généré le {new Date(report.generatedAt).toLocaleString('fr-FR')}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 rounded-xl">
              <Download className="h-4 w-4" />
              Exporter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportWord} className="gap-2 cursor-pointer">
              <FileDown className="h-4 w-4 text-blue-500" />
              Exporter en Word (.docx)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF} className="gap-2 cursor-pointer">
              <FileText className="h-4 w-4 text-red-500" />
              Exporter en PDF (.pdf)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Summary */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <div className="flex items-start gap-2">
          <TrendingUp className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm">{report.summary}</p>
        </div>
      </div>

      <Separator />

      {/* Sections */}
      <div className="space-y-4">
        {report.sections.map((section, idx) => (
          <ReportSectionView key={idx} section={section} />
        ))}
      </div>
    </div>
  );
}

export function ReportDialog({ type, id, name }: ReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { t } = useTranslation();

  const groupReport = useGroupReport(id, open && type === 'group' && generating);
  const projectReport = useProjectReport(id, open && type === 'project' && generating);

  const report = type === 'group' ? groupReport : projectReport;
  const isLoading = report.isLoading || report.isFetching;

  const handleGenerate = () => {
    setGenerating(true);
    report.refetch();
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-xl">
          <FileText className="h-4 w-4" />
          {t('reports.generate') || 'Générer un rapport'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            {t('reports.title') || 'Rapport d\'activité'} — {name}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="p-6 pt-4 max-h-[70vh]">
          {!generating && !report.data ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="h-10 w-10 text-primary/40" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {t('reports.readyTitle') || 'Prêt à générer le rapport'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                {t('reports.readyDesc') || 'L\'IA va analyser les données du groupe, la productivité des membres, l\'avancement des projets et générer des recommandations.'}
              </p>
              <Button onClick={handleGenerate} className="gap-2 rounded-xl">
                <BarChart3 className="h-4 w-4" />
                {t('reports.generateNow') || 'Générer le rapport'}
              </Button>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {t('reports.generating') || 'Génération en cours...'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('reports.generatingDesc') || 'L\'IA analyse les données et prépare votre rapport. Cela peut prendre quelques secondes.'}
              </p>
            </div>
          ) : report.data ? (
            <ReportContent report={report.data} />
          ) : report.error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <XCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Erreur</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('reports.error') || 'Impossible de générer le rapport. Veuillez réessayer.'}
              </p>
              <Button onClick={handleGenerate} variant="outline" className="gap-2 rounded-xl">
                Réessayer
              </Button>
            </div>
          ) : null}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
