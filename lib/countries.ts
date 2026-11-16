/**
 * Every country, with its international dialling code, for the phone field.
 *
 * Length rules are exact for the markets Marrelay actually works in and the
 * other common ones; everywhere else falls back to the E.164 range, which is
 * still far tighter than accepting anything. A real country always has to be
 * chosen, so a number can no longer be submitted against a vague "Other".
 */
export type Country = { code: string; name: string; dial: string; min: number; max: number }

/** [ISO code, name, dialling code] */
const LIST: [string, string, string][] = [
  ['CA', 'Canada', '+1'], ['US', 'United States', '+1'], ['GB', 'United Kingdom', '+44'],
  ['IN', 'India', '+91'], ['AU', 'Australia', '+61'], ['NZ', 'New Zealand', '+64'],
  ['IE', 'Ireland', '+353'], ['AE', 'United Arab Emirates', '+971'], ['SG', 'Singapore', '+65'],
  ['AF', 'Afghanistan', '+93'], ['AL', 'Albania', '+355'], ['DZ', 'Algeria', '+213'],
  ['AD', 'Andorra', '+376'], ['AO', 'Angola', '+244'], ['AG', 'Antigua and Barbuda', '+1'],
  ['AR', 'Argentina', '+54'], ['AM', 'Armenia', '+374'], ['AW', 'Aruba', '+297'],
  ['AT', 'Austria', '+43'], ['AZ', 'Azerbaijan', '+994'], ['BS', 'Bahamas', '+1'],
  ['BH', 'Bahrain', '+973'], ['BD', 'Bangladesh', '+880'], ['BB', 'Barbados', '+1'],
  ['BY', 'Belarus', '+375'], ['BE', 'Belgium', '+32'], ['BZ', 'Belize', '+501'],
  ['BJ', 'Benin', '+229'], ['BM', 'Bermuda', '+1'], ['BT', 'Bhutan', '+975'],
  ['BO', 'Bolivia', '+591'], ['BA', 'Bosnia and Herzegovina', '+387'], ['BW', 'Botswana', '+267'],
  ['BR', 'Brazil', '+55'], ['BN', 'Brunei', '+673'], ['BG', 'Bulgaria', '+359'],
  ['BF', 'Burkina Faso', '+226'], ['BI', 'Burundi', '+257'], ['KH', 'Cambodia', '+855'],
  ['CM', 'Cameroon', '+237'], ['CV', 'Cape Verde', '+238'], ['KY', 'Cayman Islands', '+1'],
  ['CF', 'Central African Republic', '+236'], ['TD', 'Chad', '+235'], ['CL', 'Chile', '+56'],
  ['CN', 'China', '+86'], ['CO', 'Colombia', '+57'], ['KM', 'Comoros', '+269'],
  ['CG', 'Congo', '+242'], ['CD', 'Congo (DRC)', '+243'], ['CR', 'Costa Rica', '+506'],
  ['CI', "Côte d'Ivoire", '+225'], ['HR', 'Croatia', '+385'], ['CU', 'Cuba', '+53'],
  ['CY', 'Cyprus', '+357'], ['CZ', 'Czechia', '+420'], ['DK', 'Denmark', '+45'],
  ['DJ', 'Djibouti', '+253'], ['DM', 'Dominica', '+1'], ['DO', 'Dominican Republic', '+1'],
  ['EC', 'Ecuador', '+593'], ['EG', 'Egypt', '+20'], ['SV', 'El Salvador', '+503'],
  ['GQ', 'Equatorial Guinea', '+240'], ['ER', 'Eritrea', '+291'], ['EE', 'Estonia', '+372'],
  ['SZ', 'Eswatini', '+268'], ['ET', 'Ethiopia', '+251'], ['FJ', 'Fiji', '+679'],
  ['FI', 'Finland', '+358'], ['FR', 'France', '+33'], ['GA', 'Gabon', '+241'],
  ['GM', 'Gambia', '+220'], ['GE', 'Georgia', '+995'], ['DE', 'Germany', '+49'],
  ['GH', 'Ghana', '+233'], ['GI', 'Gibraltar', '+350'], ['GR', 'Greece', '+30'],
  ['GL', 'Greenland', '+299'], ['GD', 'Grenada', '+1'], ['GT', 'Guatemala', '+502'],
  ['GN', 'Guinea', '+224'], ['GW', 'Guinea-Bissau', '+245'], ['GY', 'Guyana', '+592'],
  ['HT', 'Haiti', '+509'], ['HN', 'Honduras', '+504'], ['HK', 'Hong Kong', '+852'],
  ['HU', 'Hungary', '+36'], ['IS', 'Iceland', '+354'], ['ID', 'Indonesia', '+62'],
  ['IR', 'Iran', '+98'], ['IQ', 'Iraq', '+964'], ['IL', 'Israel', '+972'],
  ['IT', 'Italy', '+39'], ['JM', 'Jamaica', '+1'], ['JP', 'Japan', '+81'],
  ['JO', 'Jordan', '+962'], ['KZ', 'Kazakhstan', '+7'], ['KE', 'Kenya', '+254'],
  ['KW', 'Kuwait', '+965'], ['KG', 'Kyrgyzstan', '+996'], ['LA', 'Laos', '+856'],
  ['LV', 'Latvia', '+371'], ['LB', 'Lebanon', '+961'], ['LS', 'Lesotho', '+266'],
  ['LR', 'Liberia', '+231'], ['LY', 'Libya', '+218'], ['LI', 'Liechtenstein', '+423'],
  ['LT', 'Lithuania', '+370'], ['LU', 'Luxembourg', '+352'], ['MO', 'Macau', '+853'],
  ['MG', 'Madagascar', '+261'], ['MW', 'Malawi', '+265'], ['MY', 'Malaysia', '+60'],
  ['MV', 'Maldives', '+960'], ['ML', 'Mali', '+223'], ['MT', 'Malta', '+356'],
  ['MR', 'Mauritania', '+222'], ['MU', 'Mauritius', '+230'], ['MX', 'Mexico', '+52'],
  ['MD', 'Moldova', '+373'], ['MC', 'Monaco', '+377'], ['MN', 'Mongolia', '+976'],
  ['ME', 'Montenegro', '+382'], ['MA', 'Morocco', '+212'], ['MZ', 'Mozambique', '+258'],
  ['MM', 'Myanmar', '+95'], ['NA', 'Namibia', '+264'], ['NP', 'Nepal', '+977'],
  ['NL', 'Netherlands', '+31'], ['NI', 'Nicaragua', '+505'], ['NE', 'Niger', '+227'],
  ['NG', 'Nigeria', '+234'], ['MK', 'North Macedonia', '+389'], ['NO', 'Norway', '+47'],
  ['OM', 'Oman', '+968'], ['PK', 'Pakistan', '+92'], ['PS', 'Palestine', '+970'],
  ['PA', 'Panama', '+507'], ['PG', 'Papua New Guinea', '+675'], ['PY', 'Paraguay', '+595'],
  ['PE', 'Peru', '+51'], ['PH', 'Philippines', '+63'], ['PL', 'Poland', '+48'],
  ['PT', 'Portugal', '+351'], ['PR', 'Puerto Rico', '+1'], ['QA', 'Qatar', '+974'],
  ['RO', 'Romania', '+40'], ['RU', 'Russia', '+7'], ['RW', 'Rwanda', '+250'],
  ['KN', 'Saint Kitts and Nevis', '+1'], ['LC', 'Saint Lucia', '+1'],
  ['VC', 'Saint Vincent and the Grenadines', '+1'], ['WS', 'Samoa', '+685'],
  ['SM', 'San Marino', '+378'], ['SA', 'Saudi Arabia', '+966'], ['SN', 'Senegal', '+221'],
  ['RS', 'Serbia', '+381'], ['SC', 'Seychelles', '+248'], ['SL', 'Sierra Leone', '+232'],
  ['SK', 'Slovakia', '+421'], ['SI', 'Slovenia', '+386'], ['SB', 'Solomon Islands', '+677'],
  ['SO', 'Somalia', '+252'], ['ZA', 'South Africa', '+27'], ['KR', 'South Korea', '+82'],
  ['SS', 'South Sudan', '+211'], ['ES', 'Spain', '+34'], ['LK', 'Sri Lanka', '+94'],
  ['SD', 'Sudan', '+249'], ['SR', 'Suriname', '+597'], ['SE', 'Sweden', '+46'],
  ['CH', 'Switzerland', '+41'], ['SY', 'Syria', '+963'], ['TW', 'Taiwan', '+886'],
  ['TJ', 'Tajikistan', '+992'], ['TZ', 'Tanzania', '+255'], ['TH', 'Thailand', '+66'],
  ['TL', 'Timor-Leste', '+670'], ['TG', 'Togo', '+228'], ['TO', 'Tonga', '+676'],
  ['TT', 'Trinidad and Tobago', '+1'], ['TN', 'Tunisia', '+216'], ['TR', 'Türkiye', '+90'],
  ['TM', 'Turkmenistan', '+993'], ['TC', 'Turks and Caicos Islands', '+1'],
  ['UG', 'Uganda', '+256'], ['UA', 'Ukraine', '+380'], ['UY', 'Uruguay', '+598'],
  ['UZ', 'Uzbekistan', '+998'], ['VU', 'Vanuatu', '+678'], ['VE', 'Venezuela', '+58'],
  ['VN', 'Vietnam', '+84'], ['VG', 'British Virgin Islands', '+1'],
  ['VI', 'U.S. Virgin Islands', '+1'], ['YE', 'Yemen', '+967'], ['ZM', 'Zambia', '+260'],
  ['ZW', 'Zimbabwe', '+263'],
]

/** Exact national-number lengths where they are well defined. */
const RULES: Record<string, [number, number]> = {
  CA: [10, 10], US: [10, 10], AG: [10, 10], BS: [10, 10], BB: [10, 10], BM: [10, 10],
  KY: [10, 10], DM: [10, 10], DO: [10, 10], GD: [10, 10], JM: [10, 10], PR: [10, 10],
  KN: [10, 10], LC: [10, 10], VC: [10, 10], TT: [10, 10], TC: [10, 10], VG: [10, 10], VI: [10, 10],
  GB: [9, 10], IN: [10, 10], AU: [9, 9], NZ: [8, 10], IE: [7, 9], AE: [8, 9], SG: [8, 8],
  DE: [7, 11], FR: [9, 9], NL: [9, 9], ES: [9, 9], IT: [9, 11], BE: [8, 9], CH: [9, 9],
  AT: [10, 13], SE: [7, 13], NO: [8, 8], DK: [8, 8], FI: [9, 10], PT: [9, 9], PL: [9, 9],
  ZA: [9, 9], BR: [10, 11], MX: [10, 10], AR: [10, 11], CL: [9, 9], CO: [10, 10],
  JP: [9, 10], CN: [11, 11], KR: [9, 10], HK: [8, 8], TW: [9, 9], MY: [9, 10],
  PK: [10, 10], BD: [10, 10], LK: [9, 9], NP: [10, 10], PH: [10, 10], ID: [9, 12],
  TH: [9, 9], VN: [9, 10], NG: [10, 10], KE: [9, 9], GH: [9, 9], EG: [10, 10],
  SA: [9, 9], QA: [8, 8], KW: [8, 8], BH: [8, 8], OM: [8, 8], IL: [9, 9], TR: [10, 10],
  RU: [10, 10], UA: [9, 9], KZ: [10, 10],
}

export const COUNTRIES: Country[] = LIST.map(([code, name, dial]) => {
  const [min, max] = RULES[code] ?? [5, 15] // E.164 allows up to 15 digits in total
  return { code, name, dial, min, max }
})

/** Marrelay's markets first, then the rest alphabetically. */
const PRIORITY = ['CA', 'US', 'GB', 'IN', 'AU']
export const COUNTRIES_SORTED: Country[] = [
  ...PRIORITY.map((c) => COUNTRIES.find((x) => x.code === c)!).filter(Boolean),
  ...COUNTRIES.filter((c) => !PRIORITY.includes(c.code)).sort((a, b) => a.name.localeCompare(b.name)),
]

export const DEFAULT_COUNTRY = 'CA'
export const countryByCode = (code: string) => COUNTRIES.find((c) => c.code === code) || COUNTRIES[0]
