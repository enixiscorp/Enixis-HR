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
    static async getBase64Image(url: string): Promise<string | null> {
        try {
            const response = await fetch(url)
            const blob = await response.blob()
            return new Promise((resolve) => {
                const reader = new FileReader()
                reader.onloadend = () => resolve(reader.result as string)
                reader.onerror = () => resolve(null)
                reader.readAsDataURL(blob)
            })
        } catch (e) {
            console.error('Error fetching image as base64:', e)
            return null
        }
    }

    static async generatePDF(
        title: string,
        data: PaymentReport[],
        settings: any = null
    ) {
        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()
        const logoUrl = settings?.logo_url

        // Draw elegant page border
        doc.setDrawColor(6, 182, 212) // Cyan-500
        doc.setLineWidth(0.5)
        doc.rect(5, 5, pageWidth - 10, pageHeight - 10)

        // Secondary internal border for premium feel
        doc.setDrawColor(59, 130, 246) // Blue-500
        doc.setLineWidth(0.1)
        doc.rect(7, 7, pageWidth - 14, pageHeight - 14)

        // Add Logo if available
        if (logoUrl) {
            const base64Logo = await this.getBase64Image(logoUrl)
            if (base64Logo) {
                try {
                    doc.addImage(base64Logo, 'PNG', 12, 12, 40, 15)
                } catch (e) {
                    doc.setFontSize(22)
                    doc.setTextColor(6, 182, 212) // Cyan-500
                    doc.setFont('helvetica', 'bold')
                    doc.text(settings?.startup_name || 'HERIX', 12, 22)
                }
            } else {
                doc.setFontSize(22)
                doc.setTextColor(6, 182, 212)
                doc.setFont('helvetica', 'bold')
                doc.text(settings?.startup_name || 'HERIX', 12, 22)
            }
        } else {
            doc.setFontSize(22)
            doc.setTextColor(6, 182, 212)
            doc.setFont('helvetica', 'bold')
            doc.text(settings?.startup_name || 'HERIX', 12, 22)
        }

        // Title with underline decoration
        doc.setFontSize(18)
        doc.setTextColor(30, 41, 59) // Slate-800
        doc.setFont('helvetica', 'bold')
        doc.text(title, pageWidth / 2, 40, { align: 'center' })

        doc.setDrawColor(6, 182, 212)
        doc.setLineWidth(1)
        doc.line(pageWidth / 2 - 25, 45, pageWidth / 2 + 25, 45)

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 116, 139) // Slate-500
        doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 15, 20, { align: 'right' })

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
                theme: 'grid',
                headStyles: {
                    fillColor: [6, 182, 212], // Cyan-500
                    textColor: [255, 255, 255],
                    fontSize: 10,
                    fontStyle: 'bold',
                    halign: 'center'
                },
                bodyStyles: {
                    fontSize: 9,
                    textColor: [30, 41, 59]
                },
                alternateRowStyles: {
                    fillColor: [245, 247, 250]
                },
                margin: { left: 12, right: 12 }
            })

        const finalY = (doc as any).lastAutoTable.finalY + 20
        const location = settings?.location || 'Lomé'

        doc.setFontSize(11)
        doc.setTextColor(30, 41, 59)
        doc.setFont('helvetica', 'bold')
        doc.text(`Fait à ${location}, le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 15, finalY, { align: 'right' })
        doc.setFontSize(10)
        doc.text('La Direction', pageWidth - 15, finalY + 10, { align: 'right' })

        doc.save(`${title.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.pdf`)
    }

    static generateExcel(title: string, data: PaymentReport[]) {
        try {
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
        } catch (err) {
            console.error('Error generating Excel:', err)
            alert('Erreur lors de la génération du fichier Excel.')
        }
    }

    static generateCSV(title: string, data: PaymentReport[]) {
        try {
            const worksheet = XLSX.utils.json_to_sheet(data.map(item => ({
                'Date': item.date,
                'Collaborateur': item.collaboratorName,
                'Période': item.period,
                'Montant (€)': item.amount,
                'Statut': item.status
            })))

            const csv = XLSX.utils.sheet_to_csv(worksheet)
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
            const link = document.createElement("a")
            const url = URL.createObjectURL(blob)
            link.setAttribute("href", url)
            link.setAttribute("download", `${title.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.csv`)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (err) {
            console.error('Error generating CSV:', err)
            alert('Erreur lors de la génération du fichier CSV.')
        }
    }

    static async generatePaySlip(
        collaborator: { name: string; role: string; email: string },
        period: string,
        payments: any[],
        settings: any = null
    ) {
        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()
        const total = payments.reduce((sum, p) => sum + p.amount, 0)
        const logoUrl = settings?.logo_url

        // Draw elegant page border
        doc.setDrawColor(124, 58, 237) // Purple-600
        doc.setLineWidth(0.5)
        doc.rect(5, 5, pageWidth - 10, pageHeight - 10)

        doc.setDrawColor(139, 92, 246) // Purple-500
        doc.setLineWidth(0.1)
        doc.rect(7, 7, pageWidth - 14, pageHeight - 14)

        // Header
        if (logoUrl) {
            const base64Logo = await this.getBase64Image(logoUrl)
            if (base64Logo) {
                try {
                    doc.addImage(base64Logo, 'PNG', 12, 12, 40, 15)
                } catch (e) {
                    doc.setFontSize(22).setTextColor(124, 58, 237).setFont('helvetica', 'bold').text(settings?.startup_name || 'HERIX', 12, 22)
                }
            } else {
                doc.setFontSize(22).setTextColor(124, 58, 237).setFont('helvetica', 'bold').text(settings?.startup_name || 'HERIX', 12, 22)
            }
        } else {
            doc.setFontSize(22).setTextColor(124, 58, 237).setFont('helvetica', 'bold').text(settings?.startup_name || 'HERIX', 12, 22)
        }

        doc.setFontSize(16).setTextColor(30, 41, 59).setFont('helvetica', 'bold').text('BULLETIN DE PAIEMENT', pageWidth / 2, 22, { align: 'center' })

        // Info Box with better styling
        doc.setFillColor(248, 250, 252)
        doc.roundedRect(12, 35, 186, 35, 3, 3, 'F')
        doc.setDrawColor(226, 232, 240)
        doc.roundedRect(12, 35, 186, 35, 3, 3, 'D')

        doc.setFontSize(10).setTextColor(71, 85, 105).setFont('helvetica', 'normal')
        doc.text(`Collaborateur:`, 20, 45)
        doc.setFont('helvetica', 'bold').setTextColor(30, 41, 59).text(collaborator.name, 50, 45)

        doc.setFont('helvetica', 'normal').setTextColor(71, 85, 105).text(`Email:`, 20, 53)
        doc.setFont('helvetica', 'bold').setTextColor(30, 41, 59).text(collaborator.email, 50, 53)

        doc.setFont('helvetica', 'normal').setTextColor(71, 85, 105).text(`Poste:`, 20, 61)
        doc.setFont('helvetica', 'bold').setTextColor(30, 41, 59).text(collaborator.role, 50, 61)

        doc.setFont('helvetica', 'normal').setTextColor(71, 85, 105).text(`Période:`, 115, 45)
        doc.setFont('helvetica', 'bold').setTextColor(30, 41, 59).text(period, 150, 45)

        doc.setFont('helvetica', 'normal').setTextColor(71, 85, 105).text(`Émission:`, 115, 53)
        doc.setFont('helvetica', 'bold').setTextColor(30, 41, 59).text(new Date().toLocaleDateString('fr-FR'), 150, 53)

        // Table
        const tableColumn = ["Date", "Description", "Montant"]
        const tableRows = payments.map(p => [
            p.payment_date || p.date,
            p.description || 'Prestation',
            `${p.amount.toLocaleString()} CFA`
        ])

            ; (doc as any).autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 80,
                theme: 'grid',
                headStyles: {
                    fillColor: [124, 58, 237], // Purple-600
                    halign: 'center'
                },
                columnStyles: { 2: { halign: 'right' } },
                margin: { left: 12, right: 12 }
            })

        // Total
        const finalY = (doc as any).lastAutoTable.finalY + 15
        doc.setFillColor(124, 58, 237)
        doc.roundedRect(120, finalY - 10, 78, 15, 2, 2, 'F')
        doc.setFontSize(11).setFont('helvetica', 'bold').setTextColor(255, 255, 255)
        doc.text(`TOTAL NET:`, 125, finalY)
        doc.text(`${total.toLocaleString()} CFA`, 190, finalY, { align: 'right' })

        // Footer Signatures
        const footerY = pageHeight - 40
        const location = settings?.location || 'Lomé'

        doc.setFontSize(10).setTextColor(30, 41, 59).setFont('helvetica', 'bold')
        doc.text(`Fait à ${location}, le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 20, footerY, { align: 'right' })
        doc.text('Le Responsable RH', pageWidth - 20, footerY + 10, { align: 'right' })

        doc.text('Signature du Collaborateur', 20, footerY + 10)
        doc.setFontSize(8).setFont('helvetica', 'italic').setTextColor(148, 163, 184)
        doc.text('(Précédé de la mention "Lu et approuvé")', 20, footerY + 18)

        // Footer
        // Note
        doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(100, 116, 139)
        doc.text('Ce document est un bulletin de paie électronique généré par HERIX. Il sert de preuve de paiement officielle.', pageWidth / 2, pageHeight - 15, { align: 'center' })

        doc.save(`Bulletin_Paie_${collaborator.name.replace(/\s+/g, '_')}_${period.replace(/\s+/g, '_')}.pdf`)
    }
}
