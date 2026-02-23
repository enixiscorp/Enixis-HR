import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// Extend jsPDF with autotable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: any
    }
}

const getBase64Image = async (url: string): Promise<string | null> => {
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

export const generatePaymentPDF = async (payment: any, profile: any, settings: any = null) => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const logoUrl = settings?.logo_url

    // Draw elegant page border
    doc.setDrawColor(124, 58, 237) // Purple-600
    doc.setLineWidth(0.5)
    doc.rect(5, 5, pageWidth - 10, pageHeight - 10)

    doc.setDrawColor(139, 92, 246) // Purple-500
    doc.setLineWidth(0.1)
    doc.rect(7, 7, pageWidth - 14, pageHeight - 14)

    const companyName = settings?.startup_name || 'HERIX'

    if (logoUrl) {
        const base64Logo = await getBase64Image(logoUrl)
        if (base64Logo) {
            try {
                doc.addImage(base64Logo, 'PNG', 12, 12, 40, 15)
                doc.setFontSize(10).setTextColor(100, 116, 139).setFont('helvetica', 'bold').text(companyName, 12, 32)
            } catch (e) {
                doc.setFontSize(22).setTextColor(124, 58, 237).setFont('helvetica', 'bold').text(companyName, 12, 22)
            }
        } else {
            doc.setFontSize(22).setTextColor(124, 58, 237).setFont('helvetica', 'bold').text(companyName, 12, 22)
        }
    } else {
        doc.setFontSize(22).setTextColor(124, 58, 237).setFont('helvetica', 'bold').text(companyName, 12, 22)
    }

    doc.setFontSize(16).setTextColor(30, 41, 59).setFont('helvetica', 'bold').text('BULLETIN DE PAIEMENT', pageWidth / 2, 22, { align: 'center' })

    // Info Box with better styling
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(12, 35, 186, 35, 3, 3, 'F')
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(12, 35, 186, 35, 3, 3, 'D')

    doc.setFontSize(10).setTextColor(71, 85, 105).setFont('helvetica', 'normal')
    doc.text(`Collaborateur:`, 20, 45)
    doc.setFont('helvetica', 'bold').setTextColor(30, 41, 59).text(`${profile?.first_name} ${profile?.last_name}`, 50, 45)

    doc.setFont('helvetica', 'normal').setTextColor(71, 85, 105).text(`Email:`, 20, 53)
    doc.setFont('helvetica', 'bold').setTextColor(30, 41, 59).text(profile?.email || 'N/A', 50, 53)

    doc.setFont('helvetica', 'normal').setTextColor(71, 85, 105).text(`Poste:`, 20, 61)
    doc.setFont('helvetica', 'bold').setTextColor(30, 41, 59).text(profile?.role || 'Collaborateur', 50, 61)

    doc.setFont('helvetica', 'normal').setTextColor(71, 85, 105).text(`Référence:`, 115, 45)
    doc.setFont('helvetica', 'bold').setTextColor(30, 41, 59).text(`#${payment.id.substring(0, 8)}`, 150, 45)

    doc.setFont('helvetica', 'normal').setTextColor(71, 85, 105).text(`Émission:`, 115, 53)
    doc.setFont('helvetica', 'bold').setTextColor(30, 41, 59).text(new Date().toLocaleDateString('fr-FR'), 150, 53)

    doc.setFont('helvetica', 'bold')
    if (payment.status === 'paid') {
        doc.setTextColor(34, 197, 94)
    } else {
        doc.setTextColor(239, 68, 68)
    }
    doc.text(payment.status === 'paid' ? 'PAYÉ' : 'EN ATTENTE', 150, 61)

    // Table
    const tableColumn = ["Date", "Description", "Montant"]
    const tableRows = [
        [
            format(new Date(payment.payment_date), 'dd/MM/yyyy'),
            `Prestation de service - ${payment.payment_type}`,
            `${payment.amount.toLocaleString()} CFA`
        ]
    ]

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
    doc.text(`${payment.amount.toLocaleString()} CFA`, 190, finalY, { align: 'right' })

    // Footer Signatures
    const footerY = pageHeight - 40
    const location = settings?.location || 'Lomé'

    doc.setFontSize(10).setTextColor(30, 41, 59).setFont('helvetica', 'bold')
    doc.text(`Fait à ${location}, le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 20, footerY, { align: 'right' })
    doc.text('Le Responsable RH', pageWidth - 20, footerY + 10, { align: 'right' })

    doc.text('Signature du Collaborateur', 20, footerY + 10)
    doc.setFontSize(8).setFont('helvetica', 'italic').setTextColor(148, 163, 184)
    doc.text('(Précédé de la mention "Lu et approuvé")', 20, footerY + 18)

    // Note
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(100, 116, 139)
    doc.text('Ce document est un bulletin de paie électronique généré par HERIX. Il sert de preuve de paiement officielle.', pageWidth / 2, pageHeight - 15, { align: 'center' })

    try {
        doc.save(`Bulletin_Paie_${profile?.last_name}_${payment.id.substring(0, 8)}.pdf`)
    } catch (e) {
        console.error('Error saving PDF:', e)
        alert('Erreur lors de la génération du PDF.')
    }
}

export const generatePaymentExcel = (payment: any, profile: any) => {
    try {
        const data = [{
            ID: payment.id,
            Collaborateur: `${profile?.first_name} ${profile?.last_name}`,
            Role: profile?.role,
            Montant: payment.amount,
            Date: payment.payment_date,
            Type: payment.payment_type,
            Statut: payment.status
        }]

        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Paiement')
        XLSX.writeFile(wb, `Paiement_HERIX_${payment.id.substring(0, 8)}.xlsx`)
    } catch (err) {
        console.error('Error generating Excel:', err)
        alert('Erreur lors de la génération du fichier Excel.')
    }
}

export const generateAbsencePDF = async (request: any, profile: any, settings: any) => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Draw elegant page border
    doc.setDrawColor(6, 182, 212) // Cyan-500
    doc.setLineWidth(0.5)
    doc.rect(5, 5, pageWidth - 10, pageHeight - 10)

    doc.setDrawColor(59, 130, 246) // Blue-500
    doc.setLineWidth(0.1)
    doc.rect(7, 7, pageWidth - 14, pageHeight - 14)

    const companyName = settings?.startup_name || 'HERIX'

    // Header
    if (settings?.logo_url) {
        const base64Logo = await getBase64Image(settings.logo_url)
        if (base64Logo) {
            try {
                doc.addImage(base64Logo, 'PNG', 12, 12, 30, 12)
                doc.setFontSize(8).setTextColor(100, 116, 139).setFont('helvetica', 'bold').text(companyName, 12, 28)
            } catch (e) {
                console.warn('Could not add logo to PDF:', e)
            }
        }
    } else {
        doc.setFontSize(14).setTextColor(59, 130, 246).setFont('helvetica', 'bold').text(companyName, 12, 22)
    }

    doc.setFontSize(20).setTextColor(30, 41, 59).setFont('helvetica', 'bold')
    doc.text('CONFIRMATION DE DEMANDE', pageWidth / 2, 22, { align: 'center' })

    doc.setFontSize(9).setTextColor(100, 116, 139).setFont('helvetica', 'normal')
    doc.text('HERIX - Plateforme de Gestion RH & Préposés aux Bénéficiaires', pageWidth / 2, 28, { align: 'center' })

    // Divider
    doc.setDrawColor(229, 231, 235)
    doc.line(15, 45, pageWidth - 15, 45)

    // Details Grid
    doc.setFontSize(12)
    doc.setTextColor(0)
    doc.text('DÉTAILS DU COLLABORATEUR', 15, 55)

    doc.setFontSize(10)
    doc.text(`Nom: ${profile?.first_name} ${profile?.last_name}`, 15, 62)
    doc.text(`Rôle: ${profile?.role}`, 15, 67)

    doc.setFontSize(12)
    doc.text('DÉTAILS DE LA DEMANDE', pageWidth / 2, 55)

    doc.setFontSize(10)
    doc.text(`Référence: #${request.id.substring(0, 8)}`, pageWidth / 2, 62)
    doc.text(`Date demandée: ${format(new Date(request.date), 'dd MMMM yyyy', { locale: fr })}`, pageWidth / 2, 67)

    const absenceLabels: Record<string, string> = {
        'repos': 'Repos',
        'sick_leave': 'Arrêt Maladie',
        'on_leave': 'Congé'
    }
    doc.text(`Type: ${absenceLabels[request.type] || request.type}`, pageWidth / 2, 72)
    doc.text(`Statut: ${request.status === 'approved' ? 'Accepté' : 'Refusé'}`, pageWidth / 2, 77)

    // Reason sections
    doc.setDrawColor(243, 244, 246)
    doc.setFillColor(249, 250, 251)
    doc.roundedRect(15, 85, pageWidth - 30, 25, 3, 3, 'FD')

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Raison du collaborateur:', 20, 92)
    doc.setFont('helvetica', 'normal')
    doc.text(request.reason || 'Aucune raison fournie', 20, 98, { maxWidth: pageWidth - 40 })

    if (request.status !== 'pending') {
        doc.roundedRect(15, 115, pageWidth - 30, 25, 3, 3, 'FD')
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text('Note de validation (Admin):', 20, 122)
        doc.setFont('helvetica', 'normal')
        doc.text(request.admin_notes || 'Validé sans commentaire particulier', 20, 128, { maxWidth: pageWidth - 40 })
    }

    // Footer
    const footerY = pageHeight - 40
    const location = settings?.location || 'Lomé'

    doc.setFontSize(10).setTextColor(30, 41, 59).setFont('helvetica', 'bold')
    doc.text(`Fait à ${location}, le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 20, footerY, { align: 'right' })
    doc.text('La Direction des Ressources Humaines', pageWidth - 20, footerY + 10, { align: 'right' })

    doc.setFontSize(8).setTextColor(156, 163, 175).setFont('helvetica', 'normal')
    doc.text('Ce document est une confirmation officielle générée par HERIX.', pageWidth / 2, pageHeight - 15, { align: 'center' })

    try {
        doc.save(`Confirmation_Absence_${request.id.substring(0, 8)}.pdf`)
    } catch (e) {
        console.error('Error saving PDF:', e)
        alert('Erreur lors de la génération du PDF d\'absence.')
    }
}
