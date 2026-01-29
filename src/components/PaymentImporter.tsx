import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'
import { Upload, FileSpreadsheet, FileText, Download, AlertCircle, CheckCircle2, X } from 'lucide-react'
import { parseExcelFile, parseCSVFile, generatePaymentTemplate, generateCSVTemplate, PaymentImportRow } from '@/lib/paymentImportUtils'
import { useToast } from '@/contexts/ToastContext'

interface PaymentImporterProps {
    onImportComplete: (data: PaymentImportRow[]) => void
    onCancel: () => void
}

export function PaymentImporter({ onImportComplete, onCancel }: PaymentImporterProps) {
    const { toast } = useToast()
    const [importing, setImporting] = useState(false)
    const [validationErrors, setValidationErrors] = useState<string[]>([])
    const [importedData, setImportedData] = useState<PaymentImportRow[]>([])
    const [fileName, setFileName] = useState<string>('')

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return

        const file = acceptedFiles[0]
        setFileName(file.name)
        setImporting(true)
        setValidationErrors([])
        setImportedData([])

        try {
            let result

            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                result = await parseExcelFile(file)
            } else if (file.name.endsWith('.csv')) {
                result = await parseCSVFile(file)
            } else {
                setValidationErrors(['Format de fichier non supporté. Utilisez Excel (.xlsx) ou CSV (.csv)'])
                setImporting(false)
                return
            }

            if (!result.valid) {
                setValidationErrors(result.errors)
                toast('Erreurs détectées dans le fichier', 'error')
            } else {
                setImportedData(result.data)
                toast(`${result.data.length} paiement(s) prêt(s) à être importé(s)`, 'success')
            }
        } catch (error) {
            setValidationErrors(['Erreur lors de la lecture du fichier'])
            toast('Erreur lors de l\'import', 'error')
        } finally {
            setImporting(false)
        }
    }, [toast])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'text/csv': ['.csv']
        },
        multiple: false,
        disabled: importing
    })

    const handleConfirmImport = () => {
        if (importedData.length > 0) {
            onImportComplete(importedData)
        }
    }

    const handleDownloadTemplate = (format: 'excel' | 'csv') => {
        if (format === 'excel') {
            generatePaymentTemplate()
            toast('Template Excel téléchargé', 'success')
        } else {
            generateCSVTemplate()
            toast('Template CSV téléchargé', 'success')
        }
    }

    return (
        <Card className="border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-2xl">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                            <Upload className="w-6 h-6 text-purple-600" />
                            Import de Paiements
                        </CardTitle>
                        <CardDescription>
                            Importez vos paiements depuis un fichier Excel ou CSV
                        </CardDescription>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                        className="text-slate-500 hover:text-slate-700"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Download Templates */}
                <div className="flex flex-wrap gap-3">
                    <Button
                        variant="outline"
                        onClick={() => handleDownloadTemplate('excel')}
                        className="gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Télécharger Template Excel
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleDownloadTemplate('csv')}
                        className="gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Télécharger Template CSV
                    </Button>
                </div>

                {/* Dropzone */}
                <div
                    {...getRootProps()}
                    className={`
                        border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
                        ${isDragActive
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-slate-300 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-600'
                        }
                        ${importing ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-4">
                        {importing ? (
                            <>
                                <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                                <p className="text-slate-600 dark:text-slate-400">Analyse du fichier...</p>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                    {isDragActive ? (
                                        <Upload className="w-8 h-8 text-purple-600" />
                                    ) : (
                                        <FileSpreadsheet className="w-8 h-8 text-purple-600" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-lg font-semibold text-slate-900 dark:text-white">
                                        {isDragActive ? 'Déposez le fichier ici' : 'Glissez-déposez un fichier'}
                                    </p>
                                    <p className="text-sm text-slate-500 mt-1">
                                        ou cliquez pour sélectionner (Excel, CSV)
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* File Name */}
                {fileName && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <FileText className="w-4 h-4" />
                        <span>{fileName}</span>
                    </div>
                )}

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                    <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800 dark:text-red-200">
                            <p className="font-semibold mb-2">Erreurs détectées - Import bloqué :</p>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                {validationErrors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Success Preview */}
                {importedData.length > 0 && validationErrors.length === 0 && (
                    <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800 dark:text-green-200">
                            <p className="font-semibold mb-2">
                                ✅ {importedData.length} paiement(s) validé(s)
                            </p>
                            <div className="mt-3 max-h-48 overflow-y-auto">
                                <table className="w-full text-xs">
                                    <thead className="bg-green-100 dark:bg-green-900/30">
                                        <tr>
                                            <th className="p-2 text-left">Email</th>
                                            <th className="p-2 text-left">Prestation</th>
                                            <th className="p-2 text-right">Montant</th>
                                            <th className="p-2 text-center">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {importedData.map((row, index) => (
                                            <tr key={index} className="border-t border-green-200 dark:border-green-800">
                                                <td className="p-2">{row.email}</td>
                                                <td className="p-2">{row.prestation}</td>
                                                <td className="p-2 text-right">{row.montant.toLocaleString()}</td>
                                                <td className="p-2 text-center">{row.date_prestation}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={handleConfirmImport}
                        disabled={importedData.length === 0 || validationErrors.length > 0}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Confirmer l'Import ({importedData.length})
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
