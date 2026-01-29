import * as XLSX from 'xlsx'
import { parse, format, isValid } from 'date-fns'

export interface PaymentImportRow {
    email: string
    prestation: string
    montant: number
    date_prestation: string
    statut?: 'paid' | 'pending' | 'refused'
}

export interface ImportValidationResult {
    valid: boolean
    data: PaymentImportRow[]
    errors: string[]
}

/**
 * Helper to parse dates in various formats (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, etc.)
 */
function parseFlexibleDate(dateInput: any): string | null {
    if (!dateInput) return null

    // If it's already a JS Date object (common when cellDates: true in XLSX)
    if (dateInput instanceof Date) {
        return isValid(dateInput) ? format(dateInput, 'yyyy-MM-dd') : null
    }

    const dateStr = String(dateInput).trim()
    if (!dateStr) return null

    // Common formats to try
    const formats = [
        'yyyy-MM-dd',
        'dd/MM/yyyy',
        'MM/dd/yyyy',
        'dd-MM-yyyy',
        'dd.MM.yyyy',
        'yyyy/MM/dd'
    ]

    for (const fmt of formats) {
        try {
            const parsedDate = parse(dateStr, fmt, new Date())
            if (isValid(parsedDate)) {
                return format(parsedDate, 'yyyy-MM-dd')
            }
        } catch (e) {
            // Continue to next format
        }
    }

    // Fallback: raw browser parsing for other ISO-like strings
    const fallbackDate = new Date(dateStr)
    if (isValid(fallbackDate)) {
        return format(fallbackDate, 'yyyy-MM-dd')
    }

    return null
}

/**
 * Generate a template Excel file for payment import
 */
export function generatePaymentTemplate(): void {
    const templateData = [
        {
            email: 'exemple@enixis.com',
            prestation: 'Création de Site Web',
            montant: 50000,
            date_prestation: '2026-01-15',
            statut: 'paid'
        },
        {
            email: 'exemple2@enixis.com',
            prestation: 'Formation IA',
            montant: 25000,
            date_prestation: '2026-01-20',
            statut: 'paid'
        }
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Paiements')

    // Set column widths
    worksheet['!cols'] = [
        { wch: 25 }, // email
        { wch: 30 }, // prestation
        { wch: 15 }, // montant
        { wch: 15 }, // date_prestation
        { wch: 12 }  // statut
    ]

    XLSX.writeFile(workbook, 'template_paiements_enixis.xlsx')
}

/**
 * Parse Excel file and validate data
 */
export async function parseExcelFile(file: File): Promise<ImportValidationResult> {
    return new Promise((resolve) => {
        const reader = new FileReader()

        reader.onload = (e) => {
            try {
                const data = e.target?.result
                // cellDates: true helps XLSX convert date-formatted cells to JS Dates
                const workbook = XLSX.read(data, { type: 'binary', cellDates: true })
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
                const jsonData = XLSX.utils.sheet_to_json(firstSheet) as any[]

                const result = validateImportData(jsonData)
                resolve(result)
            } catch (error) {
                resolve({
                    valid: false,
                    data: [],
                    errors: ['Erreur lors de la lecture du fichier Excel']
                })
            }
        }

        reader.onerror = () => {
            resolve({
                valid: false,
                data: [],
                errors: ['Erreur lors de la lecture du fichier']
            })
        }

        reader.readAsBinaryString(file)
    })
}

/**
 * Parse CSV file and validate data
 */
export async function parseCSVFile(file: File): Promise<ImportValidationResult> {
    const Papa = (await import('papaparse')).default

    return new Promise((resolve) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const result = validateImportData(results.data as any[])
                resolve(result)
            },
            error: () => {
                resolve({
                    valid: false,
                    data: [],
                    errors: ['Erreur lors de la lecture du fichier CSV']
                })
            }
        })
    })
}

/**
 * Validate imported data
 */
function validateImportData(rawData: any[]): ImportValidationResult {
    const errors: string[] = []
    const validData: PaymentImportRow[] = []

    if (!rawData || rawData.length === 0) {
        return {
            valid: false,
            data: [],
            errors: ['Le fichier est vide ou mal formaté']
        }
    }

    rawData.forEach((row, index) => {
        const lineNumber = index + 2 // +2 because index starts at 0 and we have a header

        // Validate required fields
        if (!row.email || typeof row.email !== 'string') {
            errors.push(`Ligne ${lineNumber}: Email manquant ou invalide`)
            return
        }

        if (!row.prestation || typeof row.prestation !== 'string') {
            errors.push(`Ligne ${lineNumber}: Prestation manquante`)
            return
        }

        if (!row.montant || isNaN(Number(row.montant))) {
            errors.push(`Ligne ${lineNumber}: Montant manquant ou invalide`)
            return
        }

        if (!row.date_prestation) {
            errors.push(`Ligne ${lineNumber}: Date de prestation manquante`)
            return
        }

        // Parse date flexibly
        const normalizedDate = parseFlexibleDate(row.date_prestation)
        if (!normalizedDate) {
            errors.push(`Ligne ${lineNumber}: Date invalide ("${row.date_prestation}"). Utilisez un format standard (JJ/MM/AAAA ou AAAA-MM-JJ)`)
            return
        }

        // Validate status if provided
        const validStatuses = ['paid', 'pending', 'refused']
        const status = row.statut?.toLowerCase() || 'paid'
        if (!validStatuses.includes(status)) {
            errors.push(`Ligne ${lineNumber}: Statut invalide (attendu: paid, pending, ou refused)`)
            return
        }

        validData.push({
            email: row.email.trim().toLowerCase(),
            prestation: row.prestation.trim(),
            montant: Number(row.montant),
            date_prestation: normalizedDate,
            statut: status as 'paid' | 'pending' | 'refused'
        })
    })

    return {
        valid: errors.length === 0,
        data: validData,
        errors
    }
}

/**
 * Generate CSV template
 */
export function generateCSVTemplate(): void {
    const csvContent = `email,prestation,montant,date_prestation,statut
exemple@enixis.com,Création de Site Web,50000,2026-01-15,paid
exemple2@enixis.com,Formation IA,25000,2026-01-20,paid`

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', 'template_paiements_enixis.csv')
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}
