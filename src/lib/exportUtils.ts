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

export const generatePaymentPDF = async (payment: any, profile: any, logoUrl: string | null) => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    // Header
    if (logoUrl) {
        try {
            // In a real browser environment, we'd need to load the image first
            // For now, we'll try to add it. If it fails (CORS or other), we skip.
            doc.addImage(logoUrl, 'PNG', 15, 10, 30, 30)
        } catch (e) {
            console.warn('Could not add logo to PDF:', e)
        }
    }

    doc.setFontSize(22)
    doc.setTextColor(75, 85, 99)
    doc.text('PREUVE DE PAIEMENT', pageWidth / 2, 25, { align: 'center' })

    doc.setFontSize(10)
    doc.text('Enixis Corp - Plateforme de Gestion RH', pageWidth / 2, 32, { align: 'center' })

    // Divider
    doc.setDrawColor(229, 231, 235)
    doc.line(15, 45, pageWidth - 15, 45)

    // Details Grid
    doc.setFontSize(12)
    doc.setTextColor(0)
    doc.text('DÉTAILS DU COLLABORATEUR', 15, 55)

    doc.setFontSize(10)
    doc.text(`Nom: ${profile?.first_name} ${profile?.last_name}`, 15, 62)
    doc.text(`Adresse: ${profile?.address || 'Non spécifiée'}`, 15, 67)
    doc.text(`Rôle: ${profile?.role}`, 15, 72)

    doc.setFontSize(12)
    doc.text('DÉTAILS DU PAIEMENT', pageWidth / 2, 55)

    doc.setFontSize(10)
    doc.text(`Référence: #${payment.id.substring(0, 8)}`, pageWidth / 2, 62)
    doc.text(`Date: ${format(new Date(payment.payment_date), 'dd MMMM yyyy', { locale: fr })}`, pageWidth / 2, 67)
    doc.text(`Type: ${payment.payment_type}`, pageWidth / 2, 72)
    doc.text(`Statut: ${payment.status === 'paid' ? 'Payé' : 'En attente'}`, pageWidth / 2, 77)

    // Table
    doc.autoTable({
        startY: 90,
        head: [['Description', 'Période', 'Montant']],
        body: [
            [
                `Prestation de service - ${payment.payment_type}`,
                format(new Date(payment.payment_date), 'MMMM yyyy', { locale: fr }),
                `${payment.amount} ${payment.currency || 'XOF'}`
            ]
        ],
        theme: 'striped',
        headStyles: { fillStyle: [124, 58, 237] } // Purple
    })

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 120
    doc.setFontSize(10)
    doc.text('Fait à Bruxelles, le ' + format(new Date(), 'dd/MM/yyyy'), 15, finalY + 20)

    doc.setFontSize(8)
    doc.setTextColor(156, 163, 175)
    doc.text('Ce document est une preuve de paiement générée automatiquement par Enixis HR.', 15, doc.internal.pageSize.getHeight() - 10)

    doc.save(`Paiement_Enixis_${payment.id.substring(0, 8)}.pdf`)
}

export const generatePaymentExcel = (payment: any, profile: any) => {
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
    XLSX.writeFile(wb, `Paiement_Enixis_${payment.id.substring(0, 8)}.xlsx`)
}

export const generateAbsencePDF = async (request: any, profile: any, settings: any) => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Header
    if (settings?.logo_url) {
        try {
            doc.addImage(settings.logo_url, 'PNG', 15, 10, 30, 30)
        } catch (e) {
            console.warn('Could not add logo to PDF:', e)
        }
    }

    doc.setFontSize(22)
    doc.setTextColor(75, 85, 99)
    doc.text('CONFIRMATION DE DEMANDE', pageWidth / 2, 25, { align: 'center' })

    doc.setFontSize(10)
    doc.text('Enixis Corp - Plateforme de Gestion RH', pageWidth / 2, 32, { align: 'center' })

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

    // "Cachet" Logic
    const stampText = request.status === 'approved' ? 'APPROUVÉ' : 'REFUSÉ'
    const stampColor = request.status === 'approved' ? [34, 197, 94] : [239, 68, 68] // Green or Red

    doc.setGState(new (doc as any).GState({ opacity: 0.15 }))
    doc.setTextColor(stampColor[0], stampColor[1], stampColor[2])
    doc.setDrawColor(stampColor[0], stampColor[1], stampColor[2])
    doc.setLineWidth(2)

    // Position the stamp at the bottom right
    const stampX = pageWidth - 60
    const stampY = pageHeight - 60

    doc.setFontSize(40)
    doc.setFont('helvetica', 'bold')
    doc.text(stampText, stampX, stampY, { angle: -15 })

    // Drawing a rectangle manually rotated is complex in jsPDF without internal calls, 
    // so we'll just keep the text with the angle which looks like a stamp.

    doc.setGState(new (doc as any).GState({ opacity: 1 }))

    // Footer
    doc.setFontSize(10)
    doc.setTextColor(0)
    doc.text('Fait à Bruxelles, le ' + format(new Date(), 'dd/MM/yyyy'), 15, pageHeight - 30)

    doc.setFontSize(8)
    doc.setTextColor(156, 163, 175)
    doc.text('Ce document est une confirmation officielle générée par Enixis HR.', 15, pageHeight - 10)

    doc.save(`Confirmation_Absence_${request.id.substring(0, 8)}.pdf`)
}
