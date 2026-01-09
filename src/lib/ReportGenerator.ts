import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'


interface PaymentReport {
    collaboratorName: string
    period: string
    amount: number
    status: string
    date: string
}

export class ReportGenerator {
    static async generatePDF(
        title: string,
        data: PaymentReport[],
        logoUrl: string | null = null
    ) {
        const doc = new jsPDF()

        // Add Logo if available
        if (logoUrl) {
            try {
                // We'll try to add the logo if it's a valid image URL
                // Note: jsPDF needs the image data, so we might need to fetch it first
                // For now, let's just add the text of the company if logo fetch fails
                doc.addImage(logoUrl, 'PNG', 10, 10, 50, 20)
            } catch (e) {
                doc.setFontSize(20)
                doc.setTextColor(30, 41, 59)
                doc.text('ENIXIS CORP', 10, 20)
            }
        } else {
            doc.setFontSize(20)
            doc.setTextColor(30, 41, 59)
            doc.text('ENIXIS CORP', 10, 20)
        }

        doc.setFontSize(16)
        doc.text(title, 10, 40)

        doc.setFontSize(10)
        doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR')}`, 10, 50)

        const tableColumn = ["Date", "Collaborateur", "Période", "Montant", "Statut"]
        const tableRows = data.map(item => [
            item.date,
            item.collaboratorName,
            item.period,
            `${item.amount.toFixed(2)} €`,
            item.status
        ])

            ; (doc as any).autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 60,
                theme: 'striped',
                headStyles: { fillColor: [124, 58, 237] }, // Purple-600
            })

        doc.save(`${title.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.pdf`)
    }

    static generateExcel(title: string, data: PaymentReport[]) {
        const worksheet = XLSX.utils.json_to_sheet(data.map(item => ({
            'Date': item.date,
            'Collaborateur': item.collaboratorName,
            'Période': item.period,
            'Montant (€)': item.amount,
            'Statut': item.status
        })))

        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Rapport")

        XLSX.writeFile(workbook, `${title.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.xlsx`)
    }
}
