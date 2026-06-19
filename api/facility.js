export default async function handler(req, res) {
  const { ccn } = req.query
  if (!ccn) {
    return res.status(400).json({ error: 'CCN is required' })
  }

  const params = new URLSearchParams()
  params.set('conditions[0][property]', 'cms_certification_number_ccn')
  params.set('conditions[0][value]', ccn)
  params.set('conditions[0][operator]', '=')
  params.set('limit', '1')

  const url = `https://data.cms.gov/provider-data/api/1/datastore/query/4pq5-n9py/0?${params.toString()}`

  try {
    const response = await fetch(url)
    const data = await response.json()
    res.setHeader('Access-Control-Allow-Origin', '*')
    return res.status(200).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
