export const property_types = [
            'House',
            'Condo',
            'Land',
            'Farm',
            'Cabin',
            'Commercial Property'
            ]

            export const residential_property_types = [
            'House',
            'Condo',
            'Cabin'
            ]

            export const bedroom_options = [
            'Studio',
            '1 Bedroom',
            '2 Bedrooms',
            '3 Bedrooms',
            '4 Bedrooms',
            '5+ Bedrooms'
            ]

            export const bathroom_options = [
            '1 Bathroom',
            '2 Bathrooms',
            '3 Bathrooms',
            '4 Bathrooms',
            '5+ Bathrooms'
            ]

            export const parking_options = [
            'No Parking',
            '1 Vehicle',
            '2 Vehicles',
            '3 Vehicles',
            '4+ Vehicles'
            ]

            export const year_built_options = [
            'Pre-1980',
            '1980s',
            '1990s',
            '2000s',
            '2010s',
            '2020+'
            ]

            export const construction_area_options = [
            '<50m²',
            '50–100m²',
            '100–200m²',
            '200–400m²',
            '400–800m²',
            '800m²+'
            ]

            export const property_areas = [
            '<100m²',
            '100–500m²',
            '500–1,000m²',
            '1,000–5,000m²',
            '5,000m²–1 Hectare',
            '1–5 Hectares',
            '>5 Hectares'
            ]

             export const utilities = [
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

            export const environments = [
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

            export const accessibilityOptions = [
            'Paved Road Access',
            'Gravel Road Access',
            '4x4 Recommended',
            'Walk-In Access Only',
            'River Crossing Required',
            'Year-Round Access',
            'Seasonal Access',
            'Gated Entry'
            ]

            export const terrainOptions = [
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

            export const legal_statuses = [
            'Titled Property',
            'Concession Land',
            'Rights of Possession',
            'Corporation Owned',
            'Trust Owned',
            'Subdivision Ready',
            'Financing Available'
            ]
            

            export const provinces: Record<string, string[]> = {

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

  export const districts: Record<string, string[]> = {

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