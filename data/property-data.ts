        export const property_types = [
                { en: 'House', es: 'Casa' },
                { en: 'Condo', es: 'Condominio' },
                { en: 'Land', es: 'Terreno' },
                { en: 'Farm', es: 'Finca' },
                { en: 'Cabin', es: 'Cabaña' },
                { en: 'Commercial Property', es: 'Propiedad Comercial' }
                ]

                export const residential_property_types = [
                { en: 'House', es: 'Casa' },
                { en: 'Condo', es: 'Condominio' },
                { en: 'Cabin', es: 'Cabaña' }
                ]

                export const bedroom_options = [
                { en: 'Studio', es: 'Estudio' },
                { en: '1 Bedroom', es: '1 Habitación' },
                { en: '2 Bedrooms', es: '2 Habitaciones' },
                { en: '3 Bedrooms', es: '3 Habitaciones' },
                { en: '4 Bedrooms', es: '4 Habitaciones' },
                { en: '5+ Bedrooms', es: '5+ Habitaciones' }
                ]

                export const bathroom_options = [
                { en: '1 Bathroom', es: '1 Baño' },
                { en: '2 Bathrooms', es: '2 Baños' },
                { en: '3 Bathrooms', es: '3 Baños' },
                { en: '4 Bathrooms', es: '4 Baños' },
                { en: '5+ Bathrooms', es: '5+ Baños' }
                ]

                export const parking_options = [
                { en: 'No Parking', es: 'Sin Estacionamiento' },
                { en: '1 Vehicle', es: '1 Vehículo' },
                { en: '2 Vehicles', es: '2 Vehículos' },
                { en: '3 Vehicles', es: '3 Vehículos' },
                { en: '4+ Vehicles', es: '4+ Vehículos' }
                ]

                export const year_built_options = [
                { en: 'Pre-1980', es: 'Antes de 1980' },
                { en: '1980s', es: 'Década de 1980' },
                { en: '1990s', es: 'Década de 1990' },
                { en: '2000s', es: 'Década de 2000' },
                { en: '2010s', es: 'Década de 2010' },
                { en: '2020+', es: '2020+' }
                ]

                export const construction_area_options = [
                { en: '<50m²', es: '<50m²' },
                { en: '50–100m²', es: '50–100m²' },
                { en: '100–200m²', es: '100–200m²' },
                { en: '200–400m²', es: '200–400m²' },
                { en: '400–800m²', es: '400–800m²' },
                { en: '800m²+', es: '800m²+' }
                ]

                export const property_areas = [
                { en: '<100m²', es: '<100m²' },
                { en: '100–500m²', es: '100–500m²' },
                { en: '500–1,000m²', es: '500–1,000m²' },
                { en: '1,000–5,000m²', es: '1,000–5,000m²' },
                { en: '5,000m²–1 Hectare', es: '5,000m²–1 Hectárea' },
                { en: '1–5 Hectares', es: '1–5 Hectáreas' },
                { en: '>5 Hectares', es: '>5 Hectáreas' }
                ]

                export type UtilityCategory =
                | 'water_supply'
                | 'electricity'
                | 'wastewater'
                | 'greywater'
                | 'internet'
                | 'gas'

                export type UtilityOption = {
                category: UtilityCategory
                en: string
                es: string
                }

                export const utilities: UtilityOption[] = [
                    // Water Supply
                    {
                        category: 'water_supply',
                        en: 'Municipal / ASADA Water',
                        es: 'Agua Municipal / ASADA'
                    },
                    {
                        category: 'water_supply',
                        en: 'Private Well',
                        es: 'Pozo Privado'
                    },
                    {
                        category: 'water_supply',
                        en: 'Shared / Community Well',
                        es: 'Pozo Compartido / Comunitario'
                    },
                    {
                        category: 'water_supply',
                        en: 'Spring',
                        es: 'Naciente'
                    },
                    {
                        category: 'water_supply',
                        en: 'Rainwater Collection',
                        es: 'Recolección de Agua de Lluvia'
                    },

                    // Electricity
                    {
                        category: 'electricity',
                        en: 'Grid Electricity',
                        es: 'Electricidad de la Red'
                    },
                    {
                        category: 'electricity',
                        en: 'Solar System',
                        es: 'Sistema Solar'
                    },
                    {
                        category: 'electricity',
                        en: 'Hydroelectric System',
                        es: 'Sistema Hidroeléctrico'
                    },

                    // Wastewater
                    {
                        category: 'wastewater',
                        en: 'Municipal Sewer',
                        es: 'Alcantarillado Municipal'
                    },
                    {
                        category: 'wastewater',
                        en: 'Septic System',
                        es: 'Sistema Séptico'
                    },
                    {
                        category: 'wastewater',
                        en: 'On-site Treatment System',
                        es: 'Sistema de Tratamiento en Sitio'
                    },

                    // Greywater
                    {
                        category: 'greywater',
                        en: 'Drain Field / On-site Disposal',
                        es: 'Campo de Drenaje / Disposición en Sitio'
                    },
                    {
                        category: 'greywater',
                        en: 'Greywater to Municipal Sewer',
                        es: 'Aguas Grises al Alcantarillado Municipal'
                    },
                    {
                        category: 'greywater',
                        en: 'Surface Discharge',
                        es: 'Descarga Superficial'
                    },

                    // Internet
                    {
                        category: 'internet',
                        en: 'Fiber Internet',
                        es: 'Internet por Fibra'
                    },

                    // Gas
                    {
                        category: 'gas',
                        en: 'LPG Cylinder',
                        es: 'Cilindro de Gas LP'
                    },
                    {
                        category: 'gas',
                        en: 'LPG Fixed Tank',
                        es: 'Tanque Fijo de Gas LP'
                    },
                    {
                        category: 'gas',
                        en: 'Piped Gas',
                        es: 'Gas por Tubería'
                    }
                    ]

                export const environments = [
                { en: 'Urban', es: 'Urbano' },
                { en: 'Riverfront', es: 'Frente al Río' },
                { en: 'Beachfront', es: 'Frente a la Playa' },
                { en: 'Mountain View', es: 'Vista a la Montaña' },
                { en: 'Jungle', es: 'Selva' },
                { en: 'Rural', es: 'Rural' },
                { en: 'Lakefront', es: 'Frente al Lago' }
                ]

                export const accessibilityOptions = [
                {
                    en: 'Paved Road to Property',
                    es: 'Carretera Pavimentada hasta la Propiedad'
                },
                {
                    en: 'Unpaved Road to Property',
                    es: 'Carretera No Pavimentada hasta la Propiedad'
                },
                {
                    en: 'Boat Access Only',
                    es: 'Acceso Solo por Bote'
                }
                ]

                export const pavedRoadDistanceRangeOptions = [
                {
                    value: 'under_100m',
                    en: '<100 m',
                    es: '<100 m'
                },
                {
                    value: '100_500m',
                    en: '100–500 m',
                    es: '100–500 m'
                },
                {
                    value: '500_1000m',
                    en: '500–1,000 m',
                    es: '500–1.000 m'
                },
                {
                    value: '1_5km',
                    en: '1–5 km',
                    es: '1–5 km'
                },
                {
                    value: 'over_5km',
                    en: '>5 km',
                    es: '>5 km'
                }
                ]

               export const terrainOptions = [
                { en: 'Flat', es: 'Plano' },
                { en: 'Mostly Flat', es: 'Mayormente Plano' },
                { en: 'Rolling Hills', es: 'Colinas Onduladas' },
                { en: 'Steep Slope', es: 'Pendiente Pronunciada' },
                { en: 'Mountainous', es: 'Montañoso' },
                { en: 'Rocky', es: 'Rocoso' },
                { en: 'Forested', es: 'Boscoso' },
                { en: 'River Valley', es: 'Valle del Río' },
                { en: 'Cleared Land', es: 'Terreno Despejado' },
                { en: 'Jungle Terrain', es: 'Terreno Selvático' },
                { en: 'Build Ready', es: 'Listo para Construir' },
                { en: 'Agricultural Terrain', es: 'Terreno Agrícola' }
                ]

                export const legal_statuses = [
                { en: 'Titled Property', es: 'Propiedad Titulada' },
                { en: 'Survey Available', es: 'Plano Disponible' },
                { en: 'Concession Property', es: 'Propiedad en Concesión' },
                { en: 'Financing Available', es: 'Financiamiento Disponible' }
                ]
            

        export const provinces: Record<string, string[]> = {

        'San José': [
            'San José',
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
            'Alajuela',
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
            'Cartago',
            'Paraíso',
            'La Unión',
            'Jiménez',
            'Turrialba',
            'Alvarado',
            'Oreamuno',
            'El Guarco'
        ],

        Heredia: [
            'Heredia',
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
            'Puntarenas',
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
            'Limón',
            'Pococí',
            'Siquirres',
            'Talamanca',
            'Matina',
            'Guácimo'
        ]

        }

  export const districts: Record<string, string[]> = {

    // SAN JOSÉ
            'San José': [
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

            'Cartago': [
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

            'Alajuela': [
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

            'Heredia': [
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

            'Limón': [
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