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

    // Header
    if (logoUrl) {
        try {
            doc.addImage(logoUrl, 'PNG', 10, 10, 40, 15)
        } catch (e) {
            doc.setFontSize(18).text('ENIXIS CORP', 10, 20)
        }
    } else {
        doc.setFontSize(18).text('ENIXIS CORP', 10, 20)
    }

    doc.setFontSize(14).text('BULLETIN DE PAIEMENT', 105, 20, { align: 'center' })

    // Info Box
    doc.setFontSize(10)
    doc.rect(10, 35, 190, 30)
    doc.text(`Collaborateur: ${profile?.first_name} ${profile?.last_name}`, 15, 45)
    doc.text(`Email: ${profile?.email || 'N/A'}`, 15, 52)
    doc.text(`Poste: ${profile?.role || 'Collaborateur'}`, 15, 59)

    doc.text(`Référence: #${payment.id.substring(0, 8)}`, 120, 45)
    doc.text(`Date d'émission: ${new Date().toLocaleDateString('fr-FR')}`, 120, 52)
    doc.text(`Statut: ${payment.status === 'paid' ? 'PAYÉ' : 'EN ATTENTE'}`, 120, 59)

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
            startY: 75,
            theme: 'grid',
            headStyles: { fillColor: [124, 58, 237] },
            columnStyles: { 2: { halign: 'right' } }
        })

    // Total
    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(`TOTAL NET À PAYER:`, 130, finalY)
    doc.text(`${payment.amount.toLocaleString()} CFA`, 195, finalY, { align: 'right' })

    // Footer
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('Ce document sert de preuve de paiement pour les prestations effectuées.', 105, 280, { align: 'center' })

    doc.save(`Bulletin_Paie_${profile?.last_name}_${payment.id.substring(0, 8)}.pdf`)
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
