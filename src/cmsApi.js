// CMS Provider Data Catalog — Nursing Home "Provider Information" dataset.
// Dataset ID is stable across monthly refreshes; distribution index is always 0.
// No API key required. Docs: https://data.cms.gov/provider-data/docs
const DATASET_ID = '4pq5-n9py'
const BASE_URL = `https://data.cms.gov/provider-data/api/1/datastore/query/${DATASET_ID}/0`

function buildQueryUrl(ccn) {
  const params = new URLSearchParams()
  params.set('conditions[0][property]', 'cms_certification_number_ccn')
  params.set('conditions[0][value]', ccn)
  params.set('conditions[0][operator]', '=')
  params.set('limit', '1')
  return `${BASE_URL}?${params.toString()}`
}

export class FacilityNotFoundError extends Error {
  constructor(ccn) {
    super(`No facility found for CCN ${ccn}.`)
    this.name = 'FacilityNotFoundError'
    this.ccn = ccn
  }
}

export class CmsApiError extends Error {
  constructor(message) {
    super(message)
    this.name = 'CmsApiError'
  }
}

// Normalizes a raw CMS record into the fields the app actually uses.
// Numeric-looking strings are coerced; blank/footnoted values pass through as null.
function normalizeRecord(record) {
  const num = (v) => {
    if (v === null || v === undefined || v === '') return null
    const n = Number(v)
    return Number.isNaN(n) ? null : n
  }
  const star = (v) => {
    const n = num(v)
    return n === null ? null : n
  }

  return {
    ccn: record.cms_certification_number_ccn,
    legalName: record.provider_name,
    address: record.provider_address,
    city: record.citytown,
    state: record.state,
    zip: record.zip_code,
    fullLocation: [record.provider_address, record.citytown, record.state, record.zip_code]
      .filter(Boolean)
      .join(', '),
    certifiedBeds: num(record.number_of_certified_beds),
    averageResidentsPerDay: num(record.average_number_of_residents_per_day),
    overallRating: star(record.overall_rating),
    healthInspectionRating: star(record.health_inspection_rating),
    staffingRating: star(record.staffing_rating),
    qualityRating: star(record.qm_rating),
    ownershipType: record.ownership_type,
    providerType: record.provider_type,
    processingDate: record.processing_date,
  }
}

/**
 * Fetches a single facility's public CMS data by CCN.
 * Throws FacilityNotFoundError if no match, CmsApiError on network/parse failure.
 */
export async function fetchFacilityByCcn(ccn) {
  const trimmed = (ccn || '').trim()
  if (!trimmed) {
    throw new CmsApiError('Enter a CCN to look up a facility.')
  }

  let response
  try {
    response = await fetch(buildQueryUrl(trimmed))
  } catch (err) {
    throw new CmsApiError('Could not reach the CMS Provider Data Catalog. Check your connection and try again.')
  }

  if (!response.ok) {
    throw new CmsApiError(`CMS API returned an error (status ${response.status}).`)
  }

  let json
  try {
    json = await response.json()
  } catch (err) {
    throw new CmsApiError('Received an unreadable response from the CMS API.')
  }

  const results = json?.results
  if (!Array.isArray(results) || results.length === 0) {
    throw new FacilityNotFoundError(trimmed)
  }

  return normalizeRecord(results[0])
}

export function careCompareUrl(ccn) {
  return `https://www.medicare.gov/care-compare/details/nursing-home/${ccn}`
}
