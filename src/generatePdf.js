import jsPDF from 'jspdf'
import { careCompareUrl } from './cmsApi.js'

const STAR_BLANK = '—'

function starText(value) {
  if (value === null || value === undefined) return STAR_BLANK
  return `${value} / 5`
}

function fmt(value, fallback = STAR_BLANK) {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

/**
 * Generates the Facility Assessment Snapshot PDF and triggers a browser download.
 * `facility` is the normalized CMS record; `manual` is the operator-entered fields.
 */
export function generateSnapshotPdf({ facility, manual }) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const marginX = 54
  let y = 56

  const inkColor = [28, 42, 46]
  const clinicalColor = [47, 93, 85]
  const railColor = [184, 168, 138]
  const steelColor = [90, 107, 112]

  doc.setFillColor(...clinicalColor)
  doc.rect(0, 0, pageWidth, 86, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('MEDELITE', marginX, 34)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setCharSpace(0.6)
  doc.text('FACILITY ASSESSMENT SNAPSHOT', marginX, 48)
  doc.setCharSpace(0)

  const stateLabel = facility.state ? facility.state.toUpperCase() : ''
  if (stateLabel) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    const stateWidth = doc.getTextWidth(stateLabel)
    doc.text(stateLabel, pageWidth - marginX - stateWidth, 56)
  }

  y = 116

  const displayName = manual.facilityNameOverride?.trim() || facility.legalName || 'Unnamed facility'
  doc.setTextColor(...inkColor)
  doc.setFont('times', 'bold')
  doc.setFontSize(20)
  doc.text(displayName, marginX, y)
  y += 18

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...steelColor)
  doc.text(`CCN ${facility.ccn}`, marginX, y)
  y += 28

  const rows = [
    ['Location', facility.fullLocation || STAR_BLANK],
    ['EMR', fmt(manual.emr)],
    ['Census Capacity', facility.certifiedBeds !== null ? `${facility.certifiedBeds} certified beds` : STAR_BLANK],
    ['Current Census', fmt(manual.currentCensus)],
    ['Type of Patient', fmt(manual.typeOfPatient)],
    ['Previous Coverage from Medelite', fmt(manual.previousCoverage)],
    ['Previous Provider Performance', fmt(manual.previousPerformance)],
    ['Medical Coverage', fmt(manual.medicalCoverage)],
  ]

  doc.setDrawColor(...railColor)
  doc.setLineWidth(0.75)

  const labelX = marginX
  const valueX = marginX + 190
  const rowHeight = 22

  rows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...steelColor)
    doc.text(label.toUpperCase(), labelX, y)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10.5)
    doc.setTextColor(...inkColor)
    const wrapped = doc.splitTextToSize(value, pageWidth - valueX - marginX)
    doc.text(wrapped, valueX, y)

    const linesUsed = Array.isArray(wrapped) ? wrapped.length : 1
    y += rowHeight * Math.max(1, linesUsed * 0.85)
    doc.setDrawColor(...railColor)
    doc.line(marginX, y - rowHeight * 0.35, pageWidth - marginX, y - rowHeight * 0.35)
  })

  y += 14

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...clinicalColor)
  doc.text('CMS FIVE-STAR RATINGS', marginX, y)
  y += 8
  doc.setDrawColor(...clinicalColor)
  doc.setLineWidth(1.2)
  doc.line(marginX, y, marginX + 170, y)
  y += 22

  const starCols = [
    ['Overall', facility.overallRating],
    ['Health Inspection', facility.healthInspectionRating],
    ['Staffing', facility.staffingRating],
    ['Quality of Resident Care', facility.qualityRating],
  ]

  const colWidth = (pageWidth - marginX * 2) / starCols.length
  starCols.forEach(([label, value], i) => {
    const cx = marginX + colWidth * i
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...steelColor)
    const wrappedLabel = doc.splitTextToSize(label.toUpperCase(), colWidth - 10)
    doc.text(wrappedLabel, cx, y)

    doc.setFont('times', 'bold')
    doc.setFontSize(20)
    doc.setTextColor(...inkColor)
    doc.text(starText(value), cx, y + 28)
  })

  y += 56

  doc.setDrawColor(...railColor)
  doc.setLineWidth(0.75)
  doc.line(marginX, y, pageWidth - marginX, y)
  y += 26

  if (manual.hospitalizationMetrics && Object.keys(manual.hospitalizationMetrics).length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...clinicalColor)
    doc.text('HOSPITALIZATION & ED VISIT METRICS', marginX, y)
    y += 22

    const hm = manual.hospitalizationMetrics
    const metricRows = [
      ['Short-Stay Hospitalization', hm.strHospitalization],
      ['STR National Avg.', hm.strNationalAvg],
      ['STR State Avg.', hm.strStateAvg],
      ['Short-Stay ED Visit', hm.strEdVisit],
      ['STR ED National Avg.', hm.strEdNationalAvg],
      ['STR ED State Avg.', hm.strEdStateAvg],
      ['Long-Stay Hospitalization', hm.ltHospitalization],
      ['LT National Avg.', hm.ltNationalAvg],
      ['LT State Avg.', hm.ltStateAvg],
      ['Long-Stay ED Visit', hm.ltEdVisit],
      ['LT ED National Avg.', hm.ltEdNationalAvg],
      ['LT ED State Avg.', hm.ltEdStateAvg],
    ]

    metricRows.forEach(([label, value]) => {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...steelColor)
      doc.text(label, labelX, y)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(...inkColor)
      doc.text(fmt(value), valueX, y)
      y += 16
    })
    y += 10
  }

  const footerY = doc.internal.pageSize.getHeight() - 50
  doc.setDrawColor(...railColor)
  doc.line(marginX, footerY - 14, pageWidth - marginX, footerY - 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...steelColor)
  doc.text('Full inspection history and ratings detail:', marginX, footerY)

  const url = careCompareUrl(facility.ccn)
  doc.setTextColor(...clinicalColor)
  doc.textWithLink('Medicare Care Compare \u2192', marginX, footerY + 13, { url })

  doc.setTextColor(...steelColor)
  doc.setFontSize(7.5)
  doc.text(
    `Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} \u00b7 Source: CMS Provider Data Catalog`,
    marginX,
    footerY + 28
  )

  const safeName = displayName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
  doc.save(`facility-assessment-${safeName}-${facility.ccn}.pdf`)
}
