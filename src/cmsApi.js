// Route through our own Vercel serverless proxy to avoid CORS issues with data.cms.gov
function buildQueryUrl(ccn) {
  return `/api/facility?ccn=${encodeURIComponent(ccn)}`
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
    response = await fetch(buildQueryUrl(trimmed), {
      method: 'GET',
      mode: 'cors',
      headers: { 'Accept': 'application/json' },
    })
  } catch (err) {
    throw new CmsApiError(`Could not reach the CMS Provider Data Catalog. (${err.message})`)
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
