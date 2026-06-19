import { useState, useCallback } from 'react'
import { fetchFacilityByCcn, careCompareUrl, FacilityNotFoundError, CmsApiError } from './cmsApi.js'
import { generateSnapshotPdf } from './generatePdf.js'
import StarRating from './components/StarRating.jsx'
import FieldRow from './components/FieldRow.jsx'

const EXAMPLE_CCN = '686123'

const initialManual = {
  facilityNameOverride: '',
  emr: '',
  currentCensus: '',
  typeOfPatient: '',
  previousCoverage: '',
  previousPerformance: '',
  medicalCoverage: '',
}

export default function App() {
  const [ccnInput, setCcnInput] = useState('')
  const [facility, setFacility] = useState(null)
  const [manual, setManual] = useState(initialManual)
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleLookup = useCallback(
    async (e) => {
      e.preventDefault()
      if (!ccnInput.trim()) return
      setStatus('loading')
      setErrorMessage('')
      try {
        const data = await fetchFacilityByCcn(ccnInput.trim())
        setFacility(data)
        setManual(initialManual)
        setStatus('success')
      } catch (err) {
        setFacility(null)
        if (err instanceof FacilityNotFoundError) {
          setErrorMessage(`No facility on file for CCN ${err.ccn}. Double-check the number and try again.`)
        } else if (err instanceof CmsApiError) {
          setErrorMessage(err.message)
        } else {
          setErrorMessage('Something unexpected happened while reaching the CMS catalog.')
        }
        setStatus('error')
      }
    },
    [ccnInput]
  )

  const handleManualChange = (field) => (e) => {
    setManual((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleDownload = () => {
    if (!facility) return
    generateSnapshotPdf({ facility, manual })
  }

  return (
    <div className="min-h-screen pb-24">
      <TopBar />

      <main className="max-w-5xl mx-auto px-6 pt-10">
        <Intake ccnInput={ccnInput} setCcnInput={setCcnInput} onSubmit={handleLookup} status={status} />

        {status === 'error' && (
          <div className="mt-6 border border-flag/40 bg-flag/5 text-flag px-5 py-4 rounded-sm font-body text-sm">
            {errorMessage}
          </div>
        )}

        {facility && (
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8">
            <FacilityPanel facility={facility} manual={manual} onManualChange={handleManualChange} />
            <SidePanel facility={facility} onDownload={handleDownload} />
          </div>
        )}

        {!facility && status !== 'loading' && status !== 'error' && (
          <EmptyState exampleCcn={EXAMPLE_CCN} onTryExample={() => setCcnInput(EXAMPLE_CCN)} />
        )}
      </main>
    </div>
  )
}

function TopBar() {
  return (
    <header className="border-b border-rail/60 bg-chart/60">
      <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-xl font-bold text-clinicalDark tracking-tight">
            INFINITE <span className="font-normal text-steel text-base">— Managed by MEDELITE</span>
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-steel">
            Facility Assessment Snapshot
          </span>
          <span className="font-mono text-[10px] text-steel/60 hidden sm:inline">
            CMS Provider Data Catalog · live
          </span>
        </div>
      </div>
    </header>
  )
}

function Intake({ ccnInput, setCcnInput, onSubmit, status }) {
  return (
    <section>
      <h1 className="font-display text-3xl text-ink font-semibold leading-tight">
        Pull a facility, build the chart.
      </h1>
      <p className="font-body text-steel mt-2 max-w-xl text-[15px]">
        Enter a CMS Certification Number to fetch public ratings and location data, then layer in
        what Medelite knows internally before exporting the snapshot.
      </p>

      <form onSubmit={onSubmit} className="mt-6 flex items-stretch gap-3 max-w-md">
        <div className="flex-1">
          <label htmlFor="ccn" className="block font-mono text-[11px] uppercase tracking-[0.14em] text-steel mb-1.5">
            CCN
          </label>
          <input
            id="ccn"
            type="text"
            inputMode="numeric"
            value={ccnInput}
            onChange={(e) => setCcnInput(e.target.value)}
            placeholder="e.g. 105447"
            className="focus-ring w-full bg-white border border-rail rounded-sm px-3.5 py-2.5 font-mono text-[15px] text-ink placeholder:text-steel/50"
          />
        </div>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="focus-ring self-end bg-clinical hover:bg-clinicalDark disabled:opacity-60 text-white font-body font-medium text-sm px-5 py-2.5 rounded-sm transition-colors"
        >
          {status === 'loading' ? 'Looking up…' : 'Look up facility'}
        </button>
      </form>
    </section>
  )
}

function EmptyState({ exampleCcn, onTryExample }) {
  return (
    <div className="mt-14 border border-dashed border-rail rounded-sm px-8 py-12 text-center max-w-xl mx-auto">
      <p className="font-body text-steel text-sm">
        No facility loaded yet. Try the validation case CMS provides for new integrations —
      </p>
      <button
        onClick={onTryExample}
        className="focus-ring mt-3 font-mono text-sm text-clinical underline underline-offset-2 hover:text-clinicalDark"
      >
        load CCN {exampleCcn}
      </button>
    </div>
  )
}

function FacilityPanel({ facility, manual, onManualChange }) {
  return (
    <div className="bg-white border border-rail/70 rounded-sm">
      <div className="px-7 pt-7 pb-5 border-b border-rail/50">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-steel">CMS record · CCN {facility.ccn}</p>
        <input
          type="text"
          value={manual.facilityNameOverride}
          onChange={onManualChange('facilityNameOverride')}
          placeholder={facility.legalName || 'Facility name'}
          className="focus-ring mt-1.5 w-full font-display text-2xl font-semibold text-ink bg-transparent border-0 px-0 placeholder:text-ink/70"
        />
        <p className="text-xs text-steel mt-1">
          {manual.facilityNameOverride.trim()
            ? 'Using your custom name on the exported report.'
            : 'Legal name from CMS. Type above to override on the report.'}
        </p>
      </div>

      <dl className="px-7 divide-y divide-rail/40">
        <FieldRow label="Location" value={facility.fullLocation} readOnly />
        <FieldRow
          label="EMR"
          value={manual.emr}
          onChange={onManualChange('emr')}
          placeholder="PCC, MatrixCare, …"
        />
        <FieldRow
          label="Census Capacity"
          value={facility.certifiedBeds !== null ? `${facility.certifiedBeds} certified beds` : '—'}
          readOnly
        />
        <FieldRow
          label="Current Census"
          value={manual.currentCensus}
          onChange={onManualChange('currentCensus')}
          placeholder="e.g. 112"
        />
        <FieldRow
          label="Type of Patient"
          value={manual.typeOfPatient}
          onChange={onManualChange('typeOfPatient')}
          placeholder="Long-term & Short-term"
        />
        <FieldRow
          label="Previous Coverage from Medelite"
          value={manual.previousCoverage}
          onChange={onManualChange('previousCoverage')}
          type="select"
          options={['', 'Yes', 'No']}
        />
        <FieldRow
          label="Previous Provider Performance"
          value={manual.previousPerformance}
          onChange={onManualChange('previousPerformance')}
          placeholder="About 30 patients/day"
        />
        <FieldRow
          label="Medical Coverage"
          value={manual.medicalCoverage}
          onChange={onManualChange('medicalCoverage')}
          placeholder="Optometry, PCP, Podiatry"
        />
      </dl>
    </div>
  )
}

function SidePanel({ facility, onDownload }) {
  return (
    <div className="space-y-6">
      <div className="bg-clinicalDark text-white rounded-sm px-6 py-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/60 mb-4">
          CMS five-star ratings
        </p>
        <div className="grid grid-cols-2 gap-5">
          <StarRating label="Overall" value={facility.overallRating} />
          <StarRating label="Health Inspection" value={facility.healthInspectionRating} />
          <StarRating label="Staffing" value={facility.staffingRating} />
          <StarRating label="Quality of Care" value={facility.qualityRating} />
        </div>
      </div>

      <a
        href={careCompareUrl(facility.ccn)}
        target="_blank"
        rel="noreferrer"
        className="focus-ring block border border-rail/70 bg-chart/40 rounded-sm px-5 py-3.5 text-sm font-body text-clinicalDark hover:bg-chart transition-colors"
      >
        View on Medicare Care Compare ↗
      </a>

      <button
        onClick={onDownload}
        className="focus-ring w-full bg-flag hover:bg-[#9c4624] text-white font-body font-medium text-sm px-5 py-3.5 rounded-sm transition-colors"
      >
        Download PDF
      </button>

      <p className="font-mono text-[10.5px] text-steel leading-relaxed">
        Source: CMS Provider Data Catalog, Provider Information dataset. Processing date{' '}
        {facility.processingDate || 'unavailable'}.
      </p>
    </div>
  )
}
