'use client'

import { useState, type CSSProperties } from 'react'
import { supabase } from '@/lib/supabase'
import Papa from 'papaparse'
import Link from 'next/link'

export default function RentOutLeaseOutPage() {

    const [showLocationOptions, setShowLocationOptions] = useState(true)
    const [showProvinceOptions, setshowProvinceOptions] = useState(true)
    const [showCantonOptions, setshowCantonOptions] = useState(false)
    const [showDistrictOptions, setshowDistrictOptions] = useState(false)
    const [showPropertyTypeOptions, setShowPropertyTypeOptions] = useState(true)
    const [showPropertyAreaOptions, setshowPropertyAreaOptions] = useState(true)
    const [showutilityOptions, setShowutilityOptions] = useState(true)
    const [showEnvironmentOptions, setshowEnvironmentOptions] = useState(true)
    const [showaccessibilityOptions, setShowaccessibilityOptions] = useState(true)
    const [showLegalStatusOptions, setshowLegalStatusOptions] = useState(true)
    const [csvFile, setCsvFile] = useState<File | null>(null)
    const [csvListings, setCsvListings] = useState<any[]>([])
    const [showBedroomOptions, setshowBedroomOptions] = useState(true)
    const [showBathroomOptions, setshowBathroomOptions] = useState(false)
    const [showParkingOptions, setShowParkingOptions] = useState(false)
    const [showYearBuiltOptions, setShowYearBuiltOptions] = useState(false)
    const [showConstructionAreaOptions, setShowConstructionAreaOptions] = useState(false)

const [showCsvStaging, setShowCsvStaging] = useState(false)
  
  const [propertyData, setPropertyData] = useState({
    province: '',
    canton: '',
    district: '',
    property_type: '',
    property_area: '',
    bedrooms: '',
    bathrooms: '',
    parking: '',
    year_built_range: '',
    construction_area: '',
    utility: [] as string[],
    legal_status: '',
    environment: '',
    accessibility: [] as string[],
    terrain: [] as string[],
    monthly_price: '',
    images: [] as {
        preview: string
        file: File
        uploadedUrl: string
        }[],
    whatsapp: '',
  })

  const provinces: Record<string, string[]> = {

        'San José': [
            'Central San José',
            'Escazú',
            'Desamparados',
            'Puriscal',
            'Tarrazú',
            'Aserrí',
            'Mora',
            'Goicoechea',
            'Santa Ana',
            'Alajuelita',
            'Vásquez de Coronado',
            'Acosta',
            'Tibás',
            'Moravia',
            'Montes de Oca',
            'Turrubares',
            'Dota',
            'Curridabat',
            'Pérez Zeledón',
            'León Cortés'
        ],

        Alajuela: [
            'Central Alajuela',
            'San Ramón',
            'Grecia',
            'San Mateo',
            'Atenas',
            'Naranjo',
            'Palmares',
            'Poás',
            'Orotina',
            'San Carlos',
            'Zarcero',
            'Valverde Vega',
            'Upala',
            'Los Chiles',
            'Guatuso',
            'Río Cuarto'
        ],

        Cartago: [
            'Central Cartago',
            'Paraíso',
            'La Unión',
            'Jiménez',
            'Turrialba',
            'Alvarado',
            'Oreamuno',
            'El Guarco'
        ],

        Heredia: [
            'Central Heredia',
            'Barva',
            'Santo Domingo',
            'Santa Bárbara',
            'San Rafael',
            'San Isidro',
            'Belén',
            'Flores',
            'San Pablo',
            'Sarapiquí'
        ],

        Guanacaste: [
            'Liberia',
            'Nicoya',
            'Santa Cruz',
            'Bagaces',
            'Carrillo',
            'Cañas',
            'Abangares',
            'Tilarán',
            'Nandayure',
            'La Cruz',
            'Hojancha'
        ],

        Puntarenas: [
            'Central Puntarenas',
            'Esparza',
            'Buenos Aires',
            'Montes de Oro',
            'Osa',
            'Quepos',
            'Golfito',
            'Coto Brus',
            'Parrita',
            'Corredores',
            'Garabito'
        ],

        Limón: [
            'Central Limón',
            'Pococí',
            'Siquirres',
            'Talamanca',
            'Matina',
            'Guácimo'
        ]

        }

  const districts: Record<string, string[]> = {

    // SAN JOSÉ
            'Central San José': [
            'Carmen',
            'Merced',
            'Hospital',
            'Catedral',
            'Zapote',
            'San Francisco de Dos Ríos',
            'Uruca',
            'Mata Redonda',
            'Pavas',
            'Hatillo',
            'San Sebastián'
            ],

            Escazú: [
            'Escazú Centro',
            'San Rafael',
            'San Antonio'
            ],

            Desamparados: [
            'Desamparados Centro',
            'San Miguel',
            'San Juan de Dios',
            'San Rafael Arriba',
            'San Antonio',
            'Frailes',
            'Patarrá',
            'San Cristóbal',
            'Rosario',
            'Damas',
            'San Rafael Abajo',
            'Gravilias',
            'Los Guido'
            ],

            Puriscal: [
            'Santiago',
            'Mercedes Sur',
            'Barbacoas',
            'Grifo Alto',
            'San Rafael',
            'Candelarita',
            'Desamparaditos'
            ],

            Tarrazú: [
            'San Marcos',
            'San Lorenzo',
            'San Carlos'
            ],

            Aserrí: [
            'Aserrí Centro',
            'Tarbaca',
            'Vuelta de Jorco',
            'San Gabriel',
            'Legua',
            'Monterrey',
            'Salitrillos'
            ],

            Mora: [
            'Colón',
            'Guayabo',
            'Tabarcia',
            'Piedras Negras',
            'Picagres'
            ],

            Goicoechea: [
            'Guadalupe',
            'San Francisco',
            'Calle Blancos',
            'Mata de Plátano',
            'Ipís',
            'Rancho Redondo',
            'Purral'
            ],

            'Santa Ana': [
            'Santa Ana Centro',
            'Salitral',
            'Pozos',
            'Uruca',
            'Piedades',
            'Brasil'
            ],

            Alajuelita: [
            'Alajuelita Centro',
            'San Josecito',
            'San Antonio',
            'Concepción',
            'San Felipe'
            ],

            'Tibás': [
            'San Juan',
            'Cinco Esquinas',
            'Anselmo Llorente',
            'León XIII',
            'Colima'
            ],

            Moravia: [
            'San Vicente',
            'San Jerónimo',
            'La Trinidad'
            ],

            'Montes de Oca': [
            'San Pedro',
            'Sabanilla',
            'Mercedes',
            'San Rafael'
            ],

            Curridabat: [
            'Curridabat Centro',
            'Granadilla',
            'Sánchez',
            'Tirrases'
            ],

            'Pérez Zeledón': [
            'San Isidro de El General',
            'Daniel Flores',
            'Rivas',
            'San Pedro',
            'Platanares',
            'Pejibaye',
            'Cajón'
            ],

            // CARTAGO

            'Central Cartago': [
            'Oriental',
            'Occidental',
            'Carmen',
            'San Nicolás',
            'Aguacaliente',
            'Guadalupe',
            'Corralillo',
            'Tierra Blanca',
            'Dulce Nombre',
            'Llano Grande',
            'Quebradilla'
            ],

            Paraíso: [
            'Paraíso Centro',
            'Santiago',
            'Orosi',
            'Cachí',
            'Llanos de Santa Lucía'
            ],

            'La Unión': [
            'Tres Ríos',
            'San Diego',
            'San Juan',
            'San Rafael',
            'Concepción',
            'Dulce Nombre',
            'San Ramón',
            'Río Azul'
            ],

            Jiménez: [
            'Juan Viñas',
            'Tucurrique',
            'Pejivalle'
            ],

            Turrialba: [
            'Turrialba Centro',
            'La Suiza',
            'Peralta',
            'Santa Cruz',
            'Santa Teresita',
            'Pavones',
            'Tuis',
            'Tayutic',
            'Santa Rosa',
            'Tres Equis',
            'La Isabel',
            'Chirripó'
            ],

            Alvarado: [
            'Pacayas',
            'Cervantes',
            'Capellades'
            ],

            Oreamuno: [
            'San Rafael',
            'Cot',
            'Potrero Cerrado',
            'Cipreses',
            'Santa Rosa'
            ],

            'El Guarco': [
            'El Tejar',
            'San Isidro',
            'Tobosi',
            'Patio de Agua'
            ],

        // ALAJUELA

            'Central Alajuela': [
            'Alajuela Centro',
            'San José',
            'Carrizal',
            'San Antonio',
            'Guácima',
            'San Isidro',
            'Sabanilla',
            'San Rafael',
            'Río Segundo',
            'Desamparados',
            'Turrúcares',
            'Tambor',
            'Garita',
            'Sarapiquí'
            ],

            'San Ramón': [
            'San Ramón Centro',
            'Santiago',
            'San Juan',
            'Piedades Norte',
            'Piedades Sur',
            'San Rafael',
            'San Isidro',
            'Ángeles',
            'Alfaro',
            'Volio',
            'Concepción',
            'Zapotal',
            'Peñas Blancas'
            ],

            Grecia: [
            'Grecia Centro',
            'San Isidro',
            'San José',
            'Tacares',
            'Puente de Piedra',
            'Bolívar'
            ],

            'San Mateo': [
            'San Mateo',
            'Desmonte',
            'Jesús María',
            'Labrador'
            ],

            Atenas: [
            'Atenas Centro',
            'Jesús',
            'Mercedes',
            'San Isidro',
            'Concepción',
            'San José'
            ],

            Naranjo: [
            'Naranjo Centro',
            'San Miguel',
            'San José',
            'Cirrí Sur',
            'San Jerónimo',
            'San Juan',
            'Rosario'
            ],

            Palmares: [
            'Palmares Centro',
            'Zaragoza',
            'Buenos Aires',
            'Santiago',
            'Candelaria'
            ],

            Poás: [
            'San Pedro',
            'San Juan',
            'San Rafael',
            'Carrillos',
            'Sabana Redonda'
            ],

            Orotina: [
            'Orotina Centro',
            'Mastate',
            'Hacienda Vieja',
            'Coyolar',
            'La Ceiba'
            ],

            'San Carlos': [
            'Quesada',
            'Florencia',
            'Buenavista',
            'Aguas Zarcas',
            'Venecia',
            'Pital',
            'Fortuna',
            'La Tigra',
            'La Palmera',
            'Venado',
            'Cutris',
            'Monterrey',
            'Pocosol'
            ],

            Zarcero: [
            'Zarcero',
            'Laguna',
            'Tapezco',
            'Guadalupe',
            'Palmira',
            'Zapote'
            ],

            'Valverde Vega': [
            'Sarchí Norte',
            'Sarchí Sur',
            'Toro Amarillo'
            ],

            Upala: [
            'Upala',
            'Aguas Claras',
            'San José',
            'Bijagua',
            'Delicias',
            'Dos Ríos'
            ],

            'Los Chiles': [
            'Los Chiles',
            'Caño Negro',
            'El Amparo',
            'San Jorge'
            ],

            Guatuso: [
            'San Rafael',
            'Buenavista',
            'Cote'
            ],

            'Río Cuarto': [
            'Río Cuarto',
            'Santa Rita',
            'Santa Isabel'
            ],

            // HEREDIA

            'Central Heredia': [
            'Heredia',
            'Mercedes',
            'San Francisco',
            'Ulloa',
            'Varablanca'
            ],

            Barva: [
            'Barva',
            'San Pedro',
            'San Pablo',
            'San Roque',
            'Santa Lucía',
            'San José de la Montaña'
            ],

            'Santo Domingo': [
            'Santo Domingo',
            'San Vicente',
            'San Miguel',
            'Paracito',
            'Santo Tomás',
            'Santa Rosa',
            'Tures',
            'Pará'
            ],

            'Santa Bárbara': [
            'Santa Bárbara',
            'San Pedro',
            'San Juan',
            'Jesús',
            'Santo Domingo',
            'Purabá'
            ],

            'San Rafael': [
            'San Rafael',
            'San Josecito',
            'Santiago',
            'Ángeles',
            'Concepción'
            ],

            'San Isidro': [
            'San Isidro',
            'San José',
            'Concepción',
            'San Francisco'
            ],

            Belén: [
            'San Antonio',
            'La Ribera',
            'La Asunción'
            ],

            Flores: [
            'San Joaquín',
            'Barrantes',
            'Llorente'
            ],

            'San Pablo': [
            'San Pablo',
            'Rincón de Sabanilla'
            ],

            Sarapiquí: [
            'Puerto Viejo',
            'La Virgen',
            'Horquetas',
            'Llanuras del Gaspar',
            'Cureña'
            ],    

            // GUANACASTE

            Liberia: [
            'Liberia',
            'Cañas Dulces',
            'Mayorga',
            'Nacascolo',
            'Curubandé'
            ],

            Nicoya: [
            'Nicoya',
            'Mansión',
            'San Antonio',
            'Quebrada Honda',
            'Sámara',
            'Nosara',
            'Belén de Nosarita'
            ],

            'Santa Cruz': [
            'Santa Cruz',
            'Bolsón',
            'Veintisiete de Abril',
            'Tempate',
            'Cartagena',
            'Cuajiniquil',
            'Diriá',
            'Cabo Velas',
            'Tamarindo'
            ],

            Bagaces: [
            'Bagaces',
            'Fortuna',
            'Mogote',
            'Río Naranjo'
            ],

            Carrillo: [
            'Filadelfia',
            'Palmira',
            'Sardinal',
            'Belén'
            ],

            'Cañas': [
            'Cañas',
            'Palmira',
            'San Miguel',
            'Bebedero',
            'Porozal'
            ],

            Abangares: [
            'Las Juntas',
            'Sierra',
            'San Juan',
            'Colorado'
            ],

            'Tilarán': [
            'Tilarán',
            'Quebrada Grande',
            'Tronadora',
            'Santa Rosa',
            'Líbano',
            'Tierras Morenas',
            'Arenal'
            ],

            Nandayure: [
            'Carmona',
            'Santa Rita',
            'Zapotal',
            'San Pablo',
            'Porvenir',
            'Bejuco'
            ],

            'La Cruz': [
            'La Cruz',
            'Santa Cecilia',
            'La Garita',
            'Santa Elena'
            ],

            Hojancha: [
            'Hojancha',
            'Monte Romo',
            'Puerto Carrillo',
            'Huacas'
            ],

            // LIMÓN

            'Central Limón': [
            'Limón',
            'Valle La Estrella',
            'Río Blanco',
            'Matama'
            ],

            Pococí: [
            'Guápiles',
            'Jiménez',
            'La Rita',
            'Roxana',
            'Cariari',
            'Colorado',
            'La Colonia'
            ],

            Siquirres: [
            'Siquirres',
            'Pacuarito',
            'Florida',
            'Germania',
            'El Cairo',
            'Alegría',
            'Reventazón'
            ],

            Talamanca: [
            'Bratsi',
            'Sixaola',
            'Cahuita',
            'Telire'
            ],

            Matina: [
            'Matina',
            'Batán',
            'Carrandí'
            ],

            Guácimo: [
            'Guácimo',
            'Mercedes',
            'Pocora',
            'Río Jiménez',
            'Duacarí'
            ]

  }

            const property_types = [
            'House',
            'Condo',
            'Land',
            'Farm',
            'Cabin',
            'Commercial Property'
            ]

            const residential_property_types = [
            'House',
            'Condo',
            'Cabin'
            ]

            const bedroom_options = [
            'Studio',
            '1 Bedroom',
            '2 Bedrooms',
            '3 Bedrooms',
            '4 Bedrooms',
            '5+ Bedrooms'
            ]

            const bathroom_options = [
            '1 Bathroom',
            '2 Bathrooms',
            '3 Bathrooms',
            '4 Bathrooms',
            '5+ Bathrooms'
            ]

            const parking_options = [
            'No Parking',
            '1 Vehicle',
            '2 Vehicles',
            '3 Vehicles',
            '4+ Vehicles'
            ]

            const year_built_options = [
            'Pre-1980',
            '1980s',
            '1990s',
            '2000s',
            '2010s',
            '2020+'
            ]

            const construction_area_options = [
            '<50m²',
            '50–100m²',
            '100–200m²',
            '200–400m²',
            '400–800m²',
            '800m²+'
            ]

            const show_residential_fields =
                residential_property_types.includes(
                    propertyData.property_type
                )

            const property_areas = [
            '<100m²',
            '100–500m²',
            '500–1,000m²',
            '1,000–5,000m²',
            '5,000m²–1 Hectare',
            '1–5 Hectares',
            '>5 Hectares'
            ]

                    function generateListingTitle(propertyData: any) {

                    const titleParts = []

                    if (propertyData.environment) {
                        titleParts.push(propertyData.environment)
                    }

                    if (
                        propertyData.property_type &&
                        propertyData.property_type
                    ) {
                        titleParts.push(propertyData.property_type)
                    }

                    if (propertyData.district) {
                        titleParts.push(`in ${propertyData.district}`)
                    }

                    if (propertyData.canton) {
                        titleParts.push(propertyData.canton)
                    }

                    return titleParts.join(' ')
                    }

                    function generateListingDescription(propertyData: any) {

                    const sentences = []

                    if (
                        propertyData.environment &&
                        propertyData.property_type
                    ) {

                        sentences.push(
                        `This ${propertyData.environment.toLowerCase()} ${propertyData.property_type.toLowerCase()} is located in ${propertyData.district || propertyData.canton || propertyData.province}.`
                        )

                    }

                    if (propertyData.property_area) {

                        sentences.push(
                        `The property falls within the ${propertyData.property_area} size range.`
                        )

                    }

                    if (propertyData.monthly_price) {

                        sentences.push(
                            `Monthly rental pricing is currently listed as ${propertyData.monthly_price}.`
                        )

                        }
                    
                        if (propertyData.bedrooms) {

                        sentences.push(
                            `The property includes ${propertyData.bedrooms.toLowerCase()}.`
                        )

                        }

                        if (propertyData.bathrooms) {

                        sentences.push(
                            `The property includes ${propertyData.bathrooms.toLowerCase()}.`
                        )

                        }

                        if (propertyData.parking) {

                        sentences.push(
                            `Parking capacity supports ${propertyData.parking.toLowerCase()}.`
                        )

                        }

                        if (propertyData.year_built_range) {

                        sentences.push(
                            `The structure dates to the ${propertyData.year_built_range}.`
                        )

                        }

                        if (propertyData.construction_area) {

                        sentences.push(
                            `Construction area falls within the ${propertyData.construction_area} range.`
                        )

                        }




                    if (
                        propertyData.utility &&
                        propertyData.utility.length > 0
                    ) {

                        sentences.push(
                        `Available utilities include ${propertyData.utility.join(', ')}.`
                        )

                    }

                    if (
                    propertyData.terrain &&
                    propertyData.terrain.length > 0
                    ) {

                    sentences.push(
                        `Terrain conditions are classified as ${propertyData.terrain.join(', ').toLowerCase()}.`
                    )

                    }

                    if (propertyData.legal_status) {

                        sentences.push(
                        `Legal status is currently listed as ${propertyData.legal_status.toLowerCase()}.`
                        )

                    }

                    return sentences.join(' ')
                    }

                    function formatColones(millions: number) {

                    return new Intl.NumberFormat(
                        'es-CR',
                        {
                        style: 'currency',
                        currency: 'CRC',
                        maximumFractionDigits: 0
                        }
                    ).format(millions * 1000000)

                    }

                    function convertToUSD(millions: number) {

                    const crcValue = millions * 1000000

                    const exchangeRate = 500

                    return Math.round(crcValue / exchangeRate)

                    }
    
            const utilities = [
            'Water',
            'Electricity',
            'Fiber Internet',
            'Cell Signal',
            'Septic',
            'Sewer',
            'Well Water',
            'Solar Power',
            'Municipal Water'
            ]

            const environments = [
            'Urban',
            'Suburban',
            'Rural',
            'Mountain',
            'Forest',
            'Jungle',
            'Riverfront',
            'Ocean View',
            'Beachfront',
            'Agricultural',
            'Eco Reserve',
            'Tourism Zone'
            ]

            const accessibilityOptions = [
            'Paved Road Access',
            'Gravel Road Access',
            '4x4 Recommended',
            'Walk-In Access Only',
            'River Crossing Required',
            'Year-Round Access',
            'Seasonal Access',
            'Gated Entry'
            ]

            const [showTerrainOptions, setShowTerrainOptions] = useState(true)

            const terrainOptions = [
            'Flat',
            'Mostly Flat',
            'Rolling Hills',
            'Steep Slope',
            'Mountainous',
            'Rocky',
            'Forested',
            'River Valley',
            'Cleared Land',
            'Jungle Terrain',
            'Build Ready',
            'Agricultural Terrain'
            ]

            const legal_statuses = [
            'Titled Property',
            'Concession Land',
            'Rights of Possession',
            'Corporation Owned',
            'Trust Owned',
            'Subdivision Ready',
            'Financing Available'
            ]
            
            const handleImageUpload = (
            event: React.ChangeEvent<HTMLInputElement>
            ) => {

            const files = event.target.files

            if (!files) return

            const imageObjects = Array.from(files).map(file => ({
                preview: URL.createObjectURL(file),
                file,
                uploadedUrl: ''
                }))

            setPropertyData({
                ...propertyData,
                images: [
                    ...propertyData.images,
                    ...imageObjects
                    ]
            })

            }

            function addWhatsAppDigit(digit: string) {
            if (propertyData.whatsapp.length >= 8) return
            setPropertyData({
                ...propertyData,
                whatsapp: propertyData.whatsapp + digit
            })
            }

            function deleteWhatsAppDigit() {
            setPropertyData({
                ...propertyData,
                whatsapp: propertyData.whatsapp.slice(0, -1)
            })
            }

            function formatWhatsAppNumber(number: string) {
                if (number.length <= 4) return number
                return `${number.slice(0, 4)}-${number.slice(4)}`
                }

                return (
                <main style={{
                    background: '#000',
                    minHeight: '100vh',
                    color: '#fff',
                    padding: '1rem'
                }}>

                    <div style={{
                maxWidth: '90rem',
                margin: '0 auto'
                }}>

    {/* HEADER */}
    
<div style={{
  marginBottom: '3rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '2rem',
  flexWrap: 'wrap'
}}>

  {/* LEFT HEADER CONTENT */}
  <div style={{
  marginBottom: '2rem'
}}>

  <Link
    href="/en/"
    style={{
      color: '#00ff99',
      textDecoration: 'none',
      fontWeight: 'bold',
      fontSize: '.95rem'
    }}
  >
    ← Back To Marketplace Home
  </Link>

</div>
  <div>

    <h1 style={{
      fontSize: '4rem',
      marginBottom: '.5rem'
    }}>
      Define Your Rental Property
    </h1>

    <p style={{
      color: '#888',
      fontSize: '1.1rem',
      maxWidth: '50rem',
      lineHeight: '1.7'
    }}>
      Progressively define the environmental,
      logistical, legal, and contextual characteristics
      of your property to create a structured rental marketplace entity.
    </p>

  </div>

  {/* RIGHT CSV TOOL */}
                    <div style={{
                        background: '#111',
                        border: '1px solid #222',
                        borderRadius: '1rem',
                        padding: '1rem',
                        minWidth: '18rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '.75rem'
                    }}>

                        <h2 style={{
                        fontSize: '1rem',
                        margin: 0
                        }}>
                        Bulk CSV Upload
                        </h2>

                        <label
                        style={{
                            background: '#1a1a1a',
                            border: '1px dashed #444',
                            borderRadius: '.75rem',
                            padding: '1rem',
                            cursor: 'pointer',
                            textAlign: 'center',
                            color: '#888',
                            fontSize: '.9rem'
                        }}
                        >

                        <input
                            type="file"
                            accept=".csv"
                            style={{
                            display: 'none'
                            }}
                            onChange={(e) => {

                            if (e.target.files?.[0]) {
                                setCsvFile(e.target.files[0])
                            }

                            }}
                        />

                        {csvFile
                            ? csvFile.name
                            : 'Upload CSV'}

                        </label>

                        <button
                                onClick={() => {

                                    if (!csvFile) {
                                    alert('Please select a CSV file first')
                                    return
                                    }

                                    Papa.parse(csvFile, {

                                    header: true,

                                    complete: async (results) => {

                                        const formattedData = results.data.map((row: any) => ({

                                        ...row,

                                        utility: row.utility
                                            ? [row.utility]
                                            : [],

                                        accessibility: row.accessibility
                                            ? [row.accessibility]
                                            : [],

                                        terrain: row.terrain
                                            ? [row.terrain]
                                            : [],

                                        title: generateListingTitle(row),

                                        description: generateListingDescription({

                                            ...row,

                                            utility: row.utility
                                            ? [row.utility]
                                            : [],

                                            terrain: row.terrain
                                            ? [row.terrain]
                                            : []

                                        }),

                                        images: propertyData.images.map(
                                            (img: any) => img.uploadedUrl
                                            )

                                        }))

                                        console.log(formattedData)

                                        setCsvListings(formattedData)

                                        setShowCsvStaging(true)

                                    }

                                    })

                                }}
                                style={{
                                    background: '#00ff99',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '999px',
                                    padding: '.85rem 1rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                                >
                                Import CSV
                                </button>

                    </div>

                    </div>


{/* MAIN GRID */}
                <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '2rem'
                }}>
                {/* LEFT SIDE */}
                <div style={{
                    background: '#111',
                    border: '.0625rem solid #222',
                    borderRadius: '1.5rem',
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2rem'
                }}>
                    {/* LOCATION */}
        <div>
    {/* HEADER */}
            <div style={{
                display:'flex',
                justifyContent:'space-between',
                alignItems:'center',
                marginBottom:'1rem'
            }}>
                <div></div>
                {propertyData.province && (
                <button
                    onClick={() =>
                    setShowLocationOptions(!showLocationOptions)
                    }
                    style={collapseButton}
                >
                    {showLocationOptions ? '−' : '+'}
                </button>
                )}
            </div>
                    {/* COLLAPSED SUMMARY */}
                    {propertyData.province && !showLocationOptions && (
                        <div style={summaryCard}>
                        <span>
                            {propertyData.province}
                            {propertyData.canton && ` → ${propertyData.canton}`}
                            {propertyData.district && ` → ${propertyData.district}`}
                        </span>
                        <button
                                onClick={() => {

                                    setPropertyData({
                                        ...propertyData,
                                        province:'',
                                        canton:'',
                                        district:''
                                    })

                                    setShowLocationOptions(true)

                                    setshowProvinceOptions(true)

                                    setshowCantonOptions(false)

                                    setshowDistrictOptions(false)

                                }}
                                style={resetButton}
                            >
                                ✕
                            </button>
                        </div>
                    )}


{/* LOCATION */}

<div>

    {showLocationOptions && (

    <div>

        {/* PROVINCES */}
        {showProvinceOptions && (

        <div>

            <h2 style={sectionHeading}>
                province
            </h2>

            <div style={buttonWrap}>

                {Object.keys(provinces).map((province) => (

                <button
                    key={province}
                    onClick={() => {

                    setPropertyData({
                        ...propertyData,
                        province,
                        canton:'',
                        district:''
                    })

                    setshowProvinceOptions(false)
                    setshowCantonOptions(true)
                    setshowDistrictOptions(false)

                    }}
                    style={
                    propertyData.province === province
                        ? activePill
                        : pill
                    }
                >
                    {province}
                </button>

                ))}

            </div>

        </div>

        )}

        {/* CANTONS */}
        {showCantonOptions &&
        propertyData.province && (

        <div style={{ marginTop:'2rem' }}>

            <h2 style={sectionHeading}>
                canton
            </h2>

            <div style={buttonWrap}>

                {provinces[propertyData.province].map((canton) => (

                <button
                    key={canton}
                    onClick={() => {

                    setPropertyData({
                        ...propertyData,
                        canton,
                        district:''
                    })

                    setshowProvinceOptions(false)
                    setshowCantonOptions(false)
                    setshowDistrictOptions(true)

                    }}
                    style={
                    propertyData.canton === canton
                        ? activePill
                        : pill
                    }
                >
                    {canton}
                </button>

                ))}

            </div>

        </div>

        )}

        {/* DISTRICTS */}
        {showDistrictOptions &&
        propertyData.canton &&
        districts[propertyData.canton] && (

        <div style={{ marginTop:'2rem' }}>

            <h2 style={sectionHeading}>
                district
            </h2>

            <div style={buttonWrap}>

                {districts[propertyData.canton].map((district) => (

                <button
                    key={district}
                    onClick={() => {

                    setPropertyData({
                        ...propertyData,
                        district
                    })

                    setshowProvinceOptions(false)
                    setshowCantonOptions(false)
                    setshowDistrictOptions(false)
                    setShowLocationOptions(false)

                    }}
                    style={
                    propertyData.district === district
                        ? activePill
                        : pill
                    }
                >
                    {district}
                </button>

                ))}

            </div>

        </div>

        )}

    </div>

    )}

</div>
</div>
{/* PROPERTY TYPE */}

                    <div>

                    {/* HEADER */}
                    <div style={{
                        display:'flex',
                        justifyContent:'space-between',
                        alignItems:'center',
                        marginBottom:'1rem'
                    }}>

                        <h2 style={sectionHeading}>
                        Property Type
                        </h2>

                        <button
                        onClick={() =>
                            setShowPropertyTypeOptions(!showPropertyTypeOptions)
                        }
                        style={collapseButton}
                        >
                        {showPropertyTypeOptions ? '−' : '+'}
                        </button>

                    </div>

                    {/* COLLAPSED SUMMARY */}
                    {!showPropertyTypeOptions && (

                        <div style={summaryCard}>

                        <span>
                            {propertyData.property_type || 'None Selected'}
                        </span>

                        <button
                            onClick={() => {

                            setPropertyData({
                                ...propertyData,
                                property_type:'',
                                bedrooms:'',
                                bathrooms:'',
                                parking:'',
                                year_built_range:'',
                                construction_area:''
                            })

                            setShowPropertyTypeOptions(true)

                            setShowBathroomOptions(true)
                            setShowBathroomOptions(false)
                            setShowParkingOptions(false)
                            setShowYearBuiltOptions(false)
                            setShowConstructionAreaOptions(false)

                            }}
                            style={resetButton}
                        >
                            ✕
                        </button>

                        </div>

                    )}

                    {/* EXPANDED OPTIONS */}
                    {showPropertyTypeOptions && (

                        <div style={pillWrap}>

                        {property_types.map((type) => (

                            <button
                            key={type}
                            onClick={() => {

                                setPropertyData({
                                ...propertyData,
                                property_type: type,
                                bedrooms:'',
                                bathrooms:'',
                                parking:'',
                                year_built_range:'',
                                construction_area:''
                                })

                                setShowPropertyTypeOptions(false)

                                if (residential_property_types.includes(type)) {
                                setShowBathroomOptions(true)
                                setShowBathroomOptions(false)
                                setShowParkingOptions(false)
                                setShowYearBuiltOptions(false)
                                setShowConstructionAreaOptions(false)
                                }

                            }}
                            style={
                                propertyData.property_type === type
                                ? activePill
                                : pill
                            }
                            >
                            {type}
                            </button>

                        ))}

                        </div>

                    )}

                    </div>

                    {/* RESIDENTIAL STRUCTURE ATTRIBUTES */}
                    {show_residential_fields && (

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2rem'
                    }}>

                        {/* BEDROOMS */}
                        {showBedroomOptions && (

                        <div>

                            <h2 style={sectionHeading}>
                            Bedrooms
                            </h2>

                            <div style={pillWrap}>

                            {bedroom_options.map((option) => (

                                <button
                                key={option}
                                onClick={() => {

                                    setPropertyData({
                                    ...propertyData,
                                    bedrooms: option
                                    })

                                    setshowBathroomOptions(false)
                                    setShowBathroomOptions(true)

                                }}
                                style={
                                    propertyData.bedrooms === option
                                    ? activePill
                                    : pill
                                }
                                >
                                {option}
                                </button>

                            ))}

                            </div>

                        </div>

                        )}

                        {/* BATHROOMS */}
                        {showBathroomOptions && (

                        <div>

                            <h2 style={sectionHeading}>
                            Bathrooms
                            </h2>

                            <div style={pillWrap}>

                            {bathroom_options.map((option) => (

                                <button
                                key={option}
                                onClick={() => {

                                    setPropertyData({
                                    ...propertyData,
                                    bathrooms: option
                                    })

                                    setShowBathroomOptions(false)
                                    setShowParkingOptions(true)

                                }}
                                style={
                                    propertyData.bathrooms === option
                                    ? activePill
                                    : pill
                                }
                                >
                                {option}
                                </button>

                            ))}

                            </div>

                        </div>

                        )}

                        {/* PARKING */}
                        {showParkingOptions && (

                        <div>

                            <h2 style={sectionHeading}>
                            Parking
                            </h2>

                            <div style={pillWrap}>

                            {parking_options.map((option) => (

                                <button
                                key={option}
                                onClick={() => {

                                    setPropertyData({
                                    ...propertyData,
                                    parking: option
                                    })

                                    setShowParkingOptions(false)
                                    setShowYearBuiltOptions(true)

                                }}
                                style={
                                    propertyData.parking === option
                                    ? activePill
                                    : pill
                                }
                                >
                                {option}
                                </button>

                            ))}

                            </div>

                        </div>

                        )}

                        {/* YEAR BUILT */}
                        {showYearBuiltOptions && (

                        <div>

                            <h2 style={sectionHeading}>
                            Year Built
                            </h2>

                            <div style={pillWrap}>

                            {year_built_options.map((option) => (

                                <button
                                key={option}
                                onClick={() => {

                                    setPropertyData({
                                    ...propertyData,
                                    year_built_range: option
                                    })

                                    setShowYearBuiltOptions(false)
                                    setShowConstructionAreaOptions(true)

                                }}
                                style={
                                    propertyData.year_built_range === option
                                    ? activePill
                                    : pill
                                }
                                >
                                {option}
                                </button>

                            ))}

                            </div>

                        </div>

                        )}

                        {/* CONSTRUCTION AREA */}
                        {showConstructionAreaOptions && (

                        <div>

                            <h2 style={sectionHeading}>
                            Construction Area
                            </h2>

                            <div style={pillWrap}>

                            {construction_area_options.map((option) => (

                                <button
                                key={option}
                                onClick={() => {

                                    setPropertyData({
                                    ...propertyData,
                                    construction_area: option
                                    })

                                    setShowConstructionAreaOptions(false)

                                }}
                                style={
                                    propertyData.construction_area === option
                                    ? activePill
                                    : pill
                                }
                                >
                                {option}
                                </button>

                            ))}

                            </div>

                        </div>

                        )}

                    </div>

                    )}
{/* PROPERTY AREA */}
                    <div>

                    {/* HEADER */}
                    <div style={{
                        display:'flex',
                        justifyContent:'space-between',
                        alignItems:'center',
                        marginBottom:'1rem'
                    }}>

                        <h2 style={sectionHeading}>
                        Property Area
                        </h2>

                        <button
                        onClick={() =>
                            setshowPropertyAreaOptions(!showPropertyAreaOptions)
                        }
                        style={collapseButton}
                        >
                        {showPropertyAreaOptions ? '−' : '+'}
                        </button>

                    </div>

                    {/* COLLAPSED SUMMARY */}
                    {!showPropertyAreaOptions && (

                        <div style={summaryCard}>

                        <span>
                            {propertyData.property_area || 'None Selected'}
                        </span>

                        <button
                            onClick={() => {

                            setPropertyData({
                                ...propertyData,
                                property_area:''
                            })

                            setshowPropertyAreaOptions(true)

                            }}
                            style={resetButton}
                        >
                            ✕
                        </button>

                        </div>

                    )}

                    {/* EXPANDED OPTIONS */}
                    {showPropertyAreaOptions && (

                        <div style={pillWrap}>

                        {property_areas.map((area) => (

                            <button
                            key={area}
                            onClick={() => {

                                setPropertyData({
                                ...propertyData,
                                property_area:
                                    propertyData.property_area === area
                                    ? ''
                                    : area
                                })

                                setShowLocationOptions(false)

                                setShowPropertyTypeOptions(false)

                            }}
                            style={
                                propertyData.property_area === area
                                ? activePill
                                : pill
                            }
                            >
                            {area}
                            </button>

                        ))}

                        </div>

                    )}

                    </div>

{/* UTILITIES */}
                    <div>

                    {/* HEADER */}
                    <div style={{
                        display:'flex',
                        justifyContent:'space-between',
                        alignItems:'center',
                        marginBottom:'1rem'
                    }}>

                        <h2 style={sectionHeading}>
                        Utilities
                        </h2>

                        <button
                        onClick={() =>
                            setShowutilityOptions(!showutilityOptions)
                        }
                        style={collapseButton}
                        >
                        {showutilityOptions ? '−' : '+'}
                        </button>

                    </div>

                    {/* COLLAPSED SUMMARY */}
                    {!showutilityOptions && (

                        <div style={summaryCard}>

                        <span>
                            {propertyData.utility.length > 0
                            ? propertyData.utility.join(', ')
                            : 'None Selected'}
                        </span>

                        <button
                            onClick={() => {

                            setPropertyData({
                                ...propertyData,
                                utility:[]
                            })

                            setShowutilityOptions(true)

                            }}
                            style={resetButton}
                        >
                            ✕
                        </button>

                        </div>

                    )}

                    {/* EXPANDED OPTIONS */}
                    {showutilityOptions && (

                        <div style={pillWrap}>

                        {utilities.map((utility) => (

                            <button
                            key={utility}
                            onClick={() => {

                                const alreadySelected =
                                propertyData.utility.includes(utility)

                                setPropertyData({
                                ...propertyData,
                                utility: alreadySelected
                                    ? propertyData.utility.filter(
                                        (item) => item !== utility
                                    )
                                    : [...propertyData.utility, utility]
                                })

                                setshowPropertyAreaOptions(false)

                            }}
                            style={
                                propertyData.utility.includes(utility)
                                ? activePill
                                : pill
                            }
                            >
                            {utility}
                            </button>

                        ))}

                        </div>

                    )}
                </div>

{/* environment */}
                    <div>

                    {/* HEADER */}
                    <div style={{
                        display:'flex',
                        justifyContent:'space-between',
                        alignItems:'center',
                        marginBottom:'1rem'
                    }}>

                        <h2 style={sectionHeading}>
                        environment
                        </h2>

                        <button
                        onClick={() =>
                            setshowEnvironmentOptions(!showEnvironmentOptions)
                        }
                        style={collapseButton}
                        >
                        {showEnvironmentOptions ? '−' : '+'}
                        </button>

                    </div>

                    {/* COLLAPSED SUMMARY */}
                    {!showEnvironmentOptions && (

                        <div style={summaryCard}>

                        <span>
                            {propertyData.environment || 'None Selected'}
                        </span>

                        <button
                            onClick={() => {

                            setPropertyData({
                                ...propertyData,
                                environment:''
                            })

                            setshowEnvironmentOptions(true)

                            }}
                            style={resetButton}
                        >
                            ✕
                        </button>

                        </div>

                    )}

                    {/* EXPANDED OPTIONS */}
                    {showEnvironmentOptions && (

                        <div style={pillWrap}>

                        {environments.map((environment) => (

                            <button
                            key={environment}
                            onClick={() => {

                                setPropertyData({
                                ...propertyData,
                                environment:
                                    propertyData.environment === environment
                                    ? ''
                                    : environment
                                })

                                setShowutilityOptions(false)

                            }}
                            style={
                                propertyData.environment === environment
                                ? activePill
                                : pill
                            }
                            >
                            {environment}
                            </button>

                        ))}

                        </div>

                    )}

                    </div>

{/* accessibility */}
                    <div>

                    {/* HEADER */}
                    <div style={{
                        display:'flex',
                        justifyContent:'space-between',
                        alignItems:'center',
                        marginBottom:'1rem'
                    }}>

                        <h2 style={sectionHeading}>
                        accessibility
                        </h2>

                        <button
                        onClick={() =>
                            setShowaccessibilityOptions(!showaccessibilityOptions)
                        }
                        style={collapseButton}
                        >
                        {showaccessibilityOptions ? '−' : '+'}
                        </button>

                    </div>

                    {/* COLLAPSED SUMMARY */}
                    {!showaccessibilityOptions && (

                        <div style={summaryCard}>

                        <span>
                            {propertyData.accessibility.length > 0
                            ? propertyData.accessibility.join(', ')
                            : 'None Selected'}
                        </span>

                        <button
                            onClick={() => {

                            setPropertyData({
                                ...propertyData,
                                accessibility:[]
                            })

                            setShowaccessibilityOptions(true)

                            }}
                            style={resetButton}
                        >
                            ✕
                        </button>

                        </div>

                    )}

                    {/* EXPANDED OPTIONS */}
                    {showaccessibilityOptions && (

                        <div style={pillWrap}>

                        {accessibilityOptions.map((accessibility) => (

                            <button
                            key={accessibility}
                            onClick={() => {

                                const alreadySelected =
                                propertyData.accessibility.includes(accessibility)

                                setPropertyData({
                                ...propertyData,
                                accessibility: alreadySelected
                                    ? propertyData.accessibility.filter(
                                        (item) => item !== accessibility
                                    )
                                    : [...propertyData.accessibility, accessibility]
                                })

                                setshowEnvironmentOptions(false)

                            }}
                            style={
                                propertyData.accessibility.includes(accessibility)
                                ? activePill
                                : pill
                            }
                            >
                            {accessibility}
                            </button>

                        ))}

                        </div>

                    )}

                    </div>

{/* TERRAIN */}
                    <div>

                    {/* HEADER */}
                    <div style={{
                        display:'flex',
                        justifyContent:'space-between',
                        alignItems:'center',
                        marginBottom:'1rem'
                    }}>

                        <h2 style={sectionHeading}>
                        Terrain
                        </h2>

                        <button
                        onClick={() =>
                            setShowTerrainOptions(!showTerrainOptions)
                        }
                        style={collapseButton}
                        >
                        {showTerrainOptions ? '−' : '+'}
                        </button>

                    </div>

                    {/* COLLAPSED SUMMARY */}
                    {!showTerrainOptions && (

                        <div style={summaryCard}>

                        <span>
                            {propertyData.terrain.length > 0
                            ? propertyData.terrain.join(', ')
                            : 'None Selected'}
                        </span>

                        <button
                            onClick={() => {

                            setPropertyData({
                                ...propertyData,
                                terrain:[]
                            })

                            setShowTerrainOptions(true)

                            }}
                            style={resetButton}
                        >
                            ✕
                        </button>

                        </div>

                    )}

                    {/* EXPANDED OPTIONS */}
                    {showTerrainOptions && (

                        <div style={pillWrap}>

                        {terrainOptions.map((terrain) => (

                            <button
                            key={terrain}
                            onClick={() => {

                                const alreadySelected =
                                propertyData.terrain.includes(terrain)

                                setPropertyData({
                                ...propertyData,
                                terrain: alreadySelected
                                    ? propertyData.terrain.filter(
                                        (item) => item !== terrain
                                    )
                                    : [...propertyData.terrain, terrain]
                                })

                                setShowaccessibilityOptions(false)

                            }}
                            style={
                                propertyData.terrain.includes(terrain)
                                ? activePill
                                : pill
                            }
                            >
                            {terrain}
                            </button>

                        ))}

                        </div>

                    )}

                    </div>

                    
{/* LEGAL STATUS */}
                    <div>

                    {/* HEADER */}
                    <div style={{
                        display:'flex',
                        justifyContent:'space-between',
                        alignItems:'center',
                        marginBottom:'1rem'
                    }}>

                        <h2 style={sectionHeading}>
                        Legal Status
                        </h2>

                        <button
                        onClick={() =>
                            setshowLegalStatusOptions(!showLegalStatusOptions)
                        }
                        style={collapseButton}
                        >
                        {showLegalStatusOptions ? '−' : '+'}
                        </button>

                    </div>

                    {/* COLLAPSED SUMMARY */}
                    {!showLegalStatusOptions && (

                        <div style={summaryCard}>

                        <span>
                            {propertyData.legal_status || 'None Selected'}
                        </span>

                        <button
                            onClick={() => {

                            setPropertyData({
                                ...propertyData,
                                legal_status:''
                            })

                            setshowLegalStatusOptions(true)

                            }}
                            style={resetButton}
                        >
                            ✕
                        </button>

                        </div>

                    )}

{/* EXPANDED OPTIONS */}
                    {showLegalStatusOptions && (

                        <div style={pillWrap}>

                        {legal_statuses.map((status) => (

                            <button
                            key={status}
                            onClick={() => {

                                setPropertyData({
                                ...propertyData,
                                legal_status:
                                    propertyData.legal_status === status
                                    ? ''
                                    : status
                                })

                                setShowTerrainOptions(false)
                                setshowLegalStatusOptions(false)

                            }}
                            style={
                                propertyData.legal_status === status
                                ? activePill
                                : pill
                            }
                            >
                            {status}
                            </button>

                        ))}

                        </div>

                    )}

                    </div>
                    

                    <div>

                    <h2 style={sectionHeading}>
                        Monthly Rent
                    </h2>

                    <div style={pillWrap}>

                        {[
                        '-₡100K / month',
                        '₡100K - ₡200K / month',
                        '₡200K - ₡300K / month',
                        '₡300K - ₡400K / month',
                        '₡400K+ / month'
                        ].map((price) => (

                        <button
                            key={price}
                            onClick={() => {

                            setPropertyData({
                                ...propertyData,
                                monthly_price:
                                propertyData.monthly_price === price
                                    ? ''
                                    : price
                            })

                            }}
                            style={
                            propertyData.monthly_price === price
                                ? activePill
                                : pill
                            }
                        >
                            {price}
                        </button>

                        ))}

                    </div>

                    </div>

{/* IMAGE UPLOADER */}
                    <div>

                    <h2 style={sectionHeading}>
                        Property Images
                    </h2>

                    <label
                    style={{
                        ...uploadBox,
                        display:'flex',
                        flexDirection:'column',
                        alignItems:'center',
                        justifyContent:'center',
                        width:'100%'
                    }}
                    >

                        <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        style={{ display:'none' }}
                        />

                        <div>
                        Tap or Click to Upload Images
                        </div>

                    </label>

                    {/* IMAGE PREVIEW GRID */}
                            {propertyData.images.length > 0 && (

                            <div style={imageGrid}>

                                {propertyData.images.map((image, imageIndex) => (

                                <div
                                    key={imageIndex}
                                    style={imageCard}
                                >

                                    <img
                                    src={image.preview}
                                    alt={`Upload ${imageIndex}`}
                                    style={previewImage}
                                    />

                                    <button
                                    onClick={() => {

                                        setPropertyData({
                                        ...propertyData,
                                        images: propertyData.images.filter(
                                            (_, i) => i !== imageIndex
                                        )
                                        })

                                    }}
                                    style={removeImageButton}
                                    >
                                    ✕
                                    </button>

                                </div>

                                ))}

                            </div>

                            )}

                    </div>

{/* WHATSAPP */}
                    <div style={{ marginTop:'4rem' }}>

                    <h2 style={sectionHeading}>
                        WhatsApp Number
                    </h2>

                    <div style={phoneDisplay}>
                        +506 {formatWhatsAppNumber(propertyData.whatsapp) || '____-____'}
                    </div>

                    <div style={phoneKeypad}>

                        {['1','2','3','4','5','6','7','8','9'].map((digit) => (

                        <button
                            key={digit}
                            onClick={() => addWhatsAppDigit(digit)}
                            style={phoneKey}
                        >
                            {digit}
                        </button>

                        ))}

                        <div></div>

                        <button
                        onClick={() => addWhatsAppDigit('0')}
                        style={phoneKey}
                        >
                        0
                        </button>

                        <button
                        onClick={deleteWhatsAppDigit}
                        style={phoneDeleteKey}
                        >
                        ⌫
                        </button>

                        

                    </div> {/* block close */}

{/* Create Rental Listing BUTTON */}
                          
                            <button
                            onClick={async () => {

                                const uploadedImageUrls = []

                                for (const image of propertyData.images) {

                                const fileName =
                                    `${Date.now()}-${image.file.name}`

                                const { error: uploadError } = await supabase
                                    .storage
                                    .from('listings-images')
                                    .upload(fileName, image.file)

                                if (uploadError) {

                                    console.error(
                                    JSON.stringify(uploadError, null, 2)
                                    )

                                    continue

                                }

                                const publicUrlResponse = supabase
                                    .storage
                                    .from('listings-images')
                                    .getPublicUrl(fileName)

                                    uploadedImageUrls.push(
                                    publicUrlResponse.data.publicUrl
                                    )

                                }

                                const response = await supabase
                                .from('rent_lease_listings')
                                .insert([

                                    {
                                    province: propertyData.province,
                                    canton: propertyData.canton,
                                    district: propertyData.district,

                                    property_type: propertyData.property_type || '',

                                        bedrooms: propertyData.bedrooms,
                                        bathrooms: propertyData.bathrooms,
                                        parking: propertyData.parking,
                                        year_built_range: propertyData.year_built_range,
                                        construction_area: propertyData.construction_area,

                                    utility: propertyData.utility || [],
                                    property_area: propertyData.property_area,                                  

                                    environment: propertyData.environment,
                                    accessibility: propertyData.accessibility,
                                    terrain: propertyData.terrain || [],

                                    legal_status: propertyData.legal_status,

                                    monthly_price: Number(
                                        propertyData.monthly_price
                                            .replace(/[^\d]/g, '')
                                        ),

                                    whatsapp: propertyData.whatsapp,

                                    title: generateListingTitle(propertyData),

                                    description:
                                        generateListingDescription(propertyData),

                                    images: uploadedImageUrls
                                    }
                                    
                                ])

                                if (response.error) {

                                    console.error(
                                        JSON.stringify(response.error, null, 2)
                                    )

                                    alert('SUPABASE ERROR')

                                    return

                                    }

                                console.log(response.data)

                                alert('Rental Listing Created Successfully')

                            }}
                            style={createListingButton}
                            >
                            Create Rental Listing
                            </button>

                </div> {/* MAIN GRID */}

                

        </div> {/* MAX WIDTH CONTAINER */}      
                                    
            
                 

                    

{/* RIGHT SIDE */}
          <div style={{
            background: '#0d0d0d',
            border: '.0625rem solid #222',
            borderRadius: '1.5rem',
            padding: '2rem'
          }}>

            <h2 style={{
              fontSize: '2rem',
              marginBottom: '2rem'
            }}>
              Property Definition
            </h2>

                    <div style={generatedTitleCard}>

                    <p style={generatedTitleLabel}>
                        Generated Listing Title
                    </p>

                    <h2 style={generatedTitleValue}>
                        {generateListingTitle(propertyData) || 'Begin Defining Property'}
                    </h2>

                    </div>

                            <div style={generatedDescriptionCard}>

                            <p style={generatedTitleLabel}>
                                Generated Listing Description
                            </p>

                            <p style={generatedDescriptionValue}>
                                {
                                generateListingDescription(propertyData)
                                || 'Property description will generate automatically.'
                                }
                            </p>

                            </div>

            <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                    }}>

{/* LOCATION */}
                    <div style={definitionCard}>

                        <p style={definitionLabel}>
                        Location
                        </p>

                        <h3 style={definitionValue}>
                        {propertyData.province
                            ? `${propertyData.province} → ${propertyData.canton || 'Select canton'}`
                            : 'Select province'}
                        </h3>

                    </div>

{/* district */}
                    <div style={definitionCard}>

                        <p style={definitionLabel}>
                        District
                        </p>

                        <h3 style={definitionValue}>
                        {propertyData.district || 'Not Yet Defined'}
                        </h3>

                    </div>

                    {/* USE TYPE */}
                    <div style={definitionCard}>

                        <p style={definitionLabel}>
                        Property Type
                        </p>

                        <h3 style={definitionValue}>
                        {propertyData.property_type
                        ? propertyData.property_type
                        : 'Not Yet Defined'}
                        </h3>

                    </div>

                    {/* PROPERTY area */}
                    <div style={definitionCard}>

                        <p style={definitionLabel}>
                        Property Area
                        </p>

                        <h3 style={definitionValue}>
                        {propertyData.property_area|| 'Not Yet Defined'}
                        </h3>

                    </div>

{/* RESIDENTIAL ENTITY ATTRIBUTES */}
{show_residential_fields && (

<>

{/* BEDROOMS */}
                    <div style={definitionCard}>

                    <p style={definitionLabel}>
                        Bedrooms
                    </p>

                    <h3 style={definitionValue}>
                        {propertyData.bedrooms || 'Not Yet Defined'}
                    </h3>

                    </div>

{/* BATHROOMS */}
                    <div style={definitionCard}>

                    <p style={definitionLabel}>
                        Bathrooms
                    </p>

                    <h3 style={definitionValue}>
                        {propertyData.bathrooms || 'Not Yet Defined'}
                    </h3>

                    </div>

{/* PARKING */}
                    <div style={definitionCard}>

                    <p style={definitionLabel}>
                        Parking
                    </p>

                    <h3 style={definitionValue}>
                        {propertyData.parking || 'Not Yet Defined'}
                    </h3>

                    </div>

{/* YEAR BUILT */}
                    <div style={definitionCard}>

                    <p style={definitionLabel}>
                        Year Built
                    </p>

                    <h3 style={definitionValue}>
                        {propertyData.year_built_range || 'Not Yet Defined'}
                    </h3>

                    </div>

{/* CONSTRUCTION AREA */}
                    <div style={definitionCard}>

                    <p style={definitionLabel}>
                        Construction Area
                    </p>

                    <h3 style={definitionValue}>
                        {propertyData.construction_area || 'Not Yet Defined'}
                    </h3>

                    </div>

                    </>

                    )}

{/* UTILITIES */}
                    <div style={definitionCard}>

                        <p style={definitionLabel}>
                        Utility
                        </p>

                        <h3 style={definitionValue}>
                        {propertyData.utility.length > 0
                        ? propertyData.utility.join(', ')
                        : 'Not Yet Defined'}
                        </h3>

                    </div>

{/* environment */}
                    <div style={definitionCard}>

                        <p style={definitionLabel}>
                        Environment
                        </p>

                        <h3 style={definitionValue}>
                        {propertyData.environment || 'Not Yet Defined'}
                        </h3>

                    </div>
                
{/* ACCESSIBILITY */}
                    <div style={definitionCard}>

                    <p style={definitionLabel}>
                        Accessibility
                    </p>

                    <h3 style={definitionValue}>
                        {propertyData.accessibility.length > 0
                        ? propertyData.accessibility.join(', ')
                        : 'Not Yet Defined'}
                    </h3>

                    </div>

{/* Terrain */}
                    <div style={definitionCard}>

                        <p style={definitionLabel}>
                        Terrain
                        </p>

                        <h3 style={definitionValue}>
                        {propertyData.terrain.length > 0
                        ? propertyData.terrain.join(', ')
                        : 'Not Yet Defined'}
                        </h3>
                    </div>
{/* LEGAL */}
                    <div style={definitionCard}>

                        <p style={definitionLabel}>
                        Legal Status
                        </p>

                        <h3 style={definitionValue}>
                        {propertyData.legal_status || 'Not Yet Defined'}
                        </h3>
                    </div>               

{/* price */}
                        <div style={definitionCard}>

                        <p style={definitionLabel}>
                            Monthly Rent
                        </p>

                        <h3 style={definitionValue}>


                        </h3>

                        </div>

{/* IMAGES */}
                        <div style={definitionCard}>

                        <p style={definitionLabel}>
                            Images
                        </p>

                        <h3 style={definitionValue}>
                            {propertyData.images.length > 0
                            ? `${propertyData.images.length} Uploaded`
                            : 'No Images Uploaded'}
                        </h3>

                        </div>

{/* WHATSAPP */}
                        <div style={definitionCard}>

                        <p style={definitionLabel}>
                            WhatsApp
                        </p>

                        <h3 style={definitionValue}>
                            {propertyData.whatsapp
                            ? `+506 ${formatWhatsAppNumber(propertyData.whatsapp)}`
                            : 'Not Yet Defined'}
                        </h3>

                        </div>

                </div>

            </div>

        </div>

      </div>

      {showCsvStaging && (

                    <div style={{

                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,.82)',
                    backdropFilter: 'blur(12px)',
                    zIndex: 99999,
                    overflowY: 'auto',
                    padding: '3rem 2rem'

                    }}>

                    {/* OUTER PANEL */}
                    <div style={{

                        maxWidth: '90rem',
                        margin: '0 auto',
                        background: '#0d0d0d',
                        border: '1px solid #222',
                        borderRadius: '2rem',
                        padding: '2rem'

                    }}>

                        {/* HEADER */}
                        <div style={{

                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '3rem'

                        }}>

                        <div>

                            <h2 style={{
                            fontSize: '2.5rem',
                            marginBottom: '.5rem'
                            }}>
                            Review Listings
                            </h2>

                            <p style={{
                            color: '#888',
                            fontSize: '1rem'
                            }}>
                            Add images and review your listings before publishing.
                            </p>

                        </div>

                        <button
                            onClick={() => setShowCsvStaging(false)}
                            style={{

                            background: '#181818',
                            border: '1px solid #333',
                            color: '#ff6666',
                            borderRadius: '999px',
                            padding: '.85rem 1.25rem',
                            cursor: 'pointer',
                            fontWeight: 'bold'

                            }}
                        >
                            Close
                        </button>

                        </div>

{/* LISTINGS GRID */}
                        <div style={{

                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill,minmax(420px,1fr))',
                        gap: '2rem'

                        }}>

                        {csvListings.map((listing, index) => (

                            <div
                            key={index}
                            style={{

                                background: '#111',
                                border: '1px solid #222',
                                borderRadius: '1.5rem',
                                overflow: 'hidden'

                            }}
                            >

                            {/* IMAGE AREA */}
                            <div style={{

                                aspectRatio: '4 / 3',
                                background: '#0a0a0a',
                                borderBottom: '1px solid #222',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#555',
                                position: 'relative'

                            }}>

                                {listing.images.length > 0 ? (

                                <img
                                    src={listing.images[0].preview}
                                    alt=""
                                    style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                    }}
                                />

                                ) : (

                                <div>
                                    No Images Uploaded
                                </div>

                                )}

                            </div>

                            {/* CONTENT */}
                            <div style={{
                                padding: '1.5rem'
                            }}>

                                <h3 style={{
                                fontSize: '1.4rem',
                                marginBottom: '.75rem',
                                lineHeight: '1.4'
                                }}>
                                {listing.title}
                                </h3>

                                <p style={{
                                color: '#888',
                                lineHeight: '1.7',
                                marginBottom: '1.5rem'
                                }}>
                                {listing.description}
                                </p>

                                {/* META */}
                                <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '.5rem',
                                marginBottom: '1.5rem'
                                }}>

                                <div style={csvMetaPill}>
                                    {listing.province}
                                </div>

                                <div style={csvMetaPill}>
                                    {listing.canton}
                                </div>

                                <div style={csvMetaPill}>
                                    {listing.monthly_price}
                                </div>

                                </div>

{/* IMAGE BUTTON */}
                                <label
                                style={{

                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: '#00ff99',
                                    color: '#000',
                                    borderRadius: '999px',
                                    padding: '.85rem 1.25rem',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    width: '100%'

                                }}
                                >

                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    style={{ display: 'none' }}

                                    onChange={(e) => {

                                    const files = e.target.files

                                    if (!files) return

                                    const uploadedFiles = Array.from(files)

                                    const imagePreviews = uploadedFiles.map(file =>
                                    URL.createObjectURL(file)
                                    )

                                    const updatedListings = [...csvListings]

                                    const imageObjects = uploadedFiles.map(file => ({
                                            preview: URL.createObjectURL(file),
                                            file,
                                            uploadedUrl: ''
                                            }))

                                    updatedListings[index].images = [
                                            ...updatedListings[index].images,
                                            ...imageObjects
                                            ]

                                    setCsvListings(updatedListings)

                                    }}

                                />

                                Upload Images

                                </label>

                                {/* IMAGE PREVIEWS */}
                                    {listing.images.length > 0 && (

                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(3,1fr)',
                                        gap: '.75rem',
                                        marginTop: '1.5rem'
                                    }}>

                                        {listing.images.map((
                                        image: {
                                            preview: string
                                            file: File
                                            uploadedUrl: string
                                        },
                                        imageIndex: number
                                        ) => (

                                        <img
                                            key={imageIndex}
                                            src={image.preview}
                                            alt=""
                                            style={{
                                            width: '100%',
                                            aspectRatio: '4 / 3',
                                            objectFit: 'cover',
                                            borderRadius: '.75rem',
                                            border: '1px solid #222'
                                            }}
                                        />

                                        ))}

                                    </div>

                                )}

                            </div>

                        </div>

                    ))}

                </div>

{/* PUBLISH BUTTON */}
                        <div style={{
                        marginTop: '3rem'
                        }}>
                                <button
                                    onClick={async () => {
                                    for (const listing of csvListings) {
                                        const uploadedImageUrls = []
                                        if (listing.images?.length) {
                                        for (const image of listing.images) {
                                            const file = image.file
                                            const fileName =
                                            `${Date.now()}-${file.name}`
                                            const { data, error } = await supabase
                                                .storage
                                                .from('listings-images')
                                                .upload(fileName, file)

                                                console.log(data)
                                                console.log(error)
                                           if (error) {
                                                    console.error(
                                                        JSON.stringify(error, null, 2)    
                                                    )
                                            continue
                                                    }
                                                    const {
                                                    data: publicUrlData
                                                    } = supabase
                                                    .storage
                                                    .from('listings-images')
                                                    .getPublicUrl(fileName)
                                                    uploadedImageUrls.push(
                                                    publicUrlData.publicUrl
                                                    )
                                            }
                                            }
                                        const finalListing = {
                                        province: listing.province,
                                        canton: listing.canton,
                                        district: listing.district,
                                        property_type: listing.property_type,
                                            bedrooms: listing.bedrooms,
                                            bathrooms: listing.bathrooms,
                                            parking: listing.parking,
                                            year_built_range: listing.year_built_range,
                                            construction_area: listing.construction_area,
                                        property_area: listing.property_area,
                                        utility: listing.utility || [],
                                        environment: listing.environment,
                                        accessibility: listing.accessibility || [],
                                        terrain: listing.terrain || [],
                                        legal_status: listing.legal_status,
                                        monthly_price: Number(
                                                            String(listing.monthly_price)
                                                    .replace(/[^\d]/g, '')
                                                ),
                                        whatsapp: listing.whatsapp,
                                        title: listing.title,
                                        description: listing.description,
                                        images: uploadedImageUrls
                                        }

                                        const response = await supabase
                                        .from('rent_lease_listings')
                                        .insert([finalListing])
                                        if (response.error) {
                                        console.error(
                                            JSON.stringify(response.error, null, 2)
                                            )
                                        }
                                    }

                                    alert('Rental Listings Published')
                                    setShowCsvStaging(false)
                                    setCsvListings([])
                                    }}
                                    style={{
                                    width: '100%',
                                    background: '#00ff99',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '1.5rem',
                                    padding: '1.5rem',
                                    fontSize: '1.4rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                    }}
                                >
                                    Publish Listings
                                </button>
                        </div>
                        </div>
                        </div>
                        )}
    </main>

  )

}

const sectionHeading = {
  fontSize: '1.1rem',
  marginBottom: '1rem'
}

const buttonWrap = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '.75rem'
}

const pill = {
  background: '#181818',
  border: '.0625rem solid #2a2a2a',
  color: '#bbb',
  padding: '.85rem 1rem',
  borderRadius: '999rem',
  cursor: 'pointer'
}

const activePill = {
  background: '#00ff99',
  border: '.0625rem solid #00ff99',
  color: '#000',
  padding: '.85rem 1rem',
  borderRadius: '999rem',
  cursor: 'pointer',
  fontWeight: 'bold'
}
const definitionCard = {
  background: '#111',
  border: '.0625rem solid #1d1d1d',
  borderRadius: '1rem',
  padding: '1.25rem'
}

const definitionLabel = {
  color: '#666',
  fontSize: '.75rem',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  letterSpacing: '.08rem',
  marginBottom: '.5rem'
}

const definitionValue = {
  fontSize: '1.1rem',
  color: '#fff',
  lineHeight: '1.5'
}

const pillWrap: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '10px'
}

const collapseButton = {
  background: '#181818',
  border: '.0625rem solid #2a2a2a',
  color: '#00ff99',
  width: '2rem',
  height: '2rem',
  borderRadius: '999rem',
  cursor: 'pointer',
  fontSize: '1rem'
}

const summaryCard = {
  background: '#111',
  border: '.0625rem solid #1d1d1d',
  borderRadius: '1rem',
  padding: '1rem 1.25rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  color: '#fff'
}

const resetButton = {
  background: 'transparent',
  border: 'none',
  color: '#ff6666',
  cursor: 'pointer',
  fontSize: '1rem'
}

const generatedTitleCard = {
  background: '#0f0f0f',
  border: '.0625rem solid #222',
  borderRadius: '1.25rem',
  padding: '1.5rem',
  marginBottom: '2rem'
}

const generatedTitleLabel = {
  color: '#666',
  fontSize: '.75rem',
  textTransform: 'uppercase' as const,
  letterSpacing: '.08rem',
  marginBottom: '.75rem'
}

const generatedTitleValue = {
  color: '#fff',
  fontSize: '2rem',
  lineHeight: '1.3',
  fontWeight: 'bold'
}

const generatedDescriptionCard = {
  background: '#0f0f0f',
  border: '.0625rem solid #222',
  borderRadius: '1.25rem',
  padding: '1.5rem',
  marginBottom: '2rem'
}

const generatedDescriptionValue = {
  color: '#aaa',
  fontSize: '1rem',
  lineHeight: '1.8'
}

const uploadBox = {
  border: '.125rem dashed #333',
  borderRadius: '1rem',
  padding: '3rem 2rem',
  textAlign: 'center' as const,
  color: '#888',
  cursor: 'pointer',
  background: '#0f0f0f'
}

const imageGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))',
  gap: '1rem',
  marginTop: '1.5rem'
}

const imageCard = {
  position: 'relative' as const
}

const previewImage = {
  width: '100%',
  aspectRatio: '4 / 3',
  objectFit: 'cover' as const,
  borderRadius: '.75rem',
  border: '.0625rem solid #222'
}

const removeImageButton = {
  position: 'absolute' as const,
  top: '.5rem',
  right: '.5rem',
  background: '#000',
  color: '#ff6666',
  border: 'none',
  borderRadius: '999rem',
  width: '2rem',
  height: '2rem',
  cursor: 'pointer',
  fontWeight: 'bold'
}

const phoneDisplay = {
  background:'#111',
  border:'.0625rem solid #222',
  borderRadius:'1rem',
  padding:'1.5rem',
  fontSize:'2rem',
  fontWeight:'bold',
  letterSpacing:'.15rem',
  textAlign:'center' as const,
  marginBottom:'1.5rem',
  color:'#00ff99'
}

const phoneKeypad = {
  display:'grid',
  gridTemplateColumns:'repeat(3, 1fr)',
  gap:'1rem',
  maxWidth:'20rem',
  margin:'0 auto'
}

const phoneKey = {
  background:'#181818',
  border:'.0625rem solid #2a2a2a',
  color:'#fff',
  borderRadius:'1rem',
  height:'4.5rem',
  fontSize:'1.75rem',
  fontWeight:'bold',
  cursor:'pointer'
}

const phoneDeleteKey = {
  background:'#330000',
  border:'.0625rem solid #662222',
  color:'#ff6666',
  borderRadius:'1rem',
  height:'4.5rem',
  fontSize:'1.5rem',
  fontWeight:'bold',
  cursor:'pointer'
}
const createListingButton = {
  width:'100%',
  background:'#00ff99',
  color:'#000',
  border:'none',
  borderRadius:'1.25rem',
  padding:'1.5rem',
  fontSize:'1.4rem',
  fontWeight:'bold',
  cursor:'pointer',
  marginTop:'4rem',
  transition:'all .2s ease'
}

const csvMetaPill = {
  background: '#181818',
  border: '1px solid #2a2a2a',
  borderRadius: '999px',
  padding: '.5rem .85rem',
  color: '#aaa',
  fontSize: '.85rem'

}