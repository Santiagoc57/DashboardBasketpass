export type TeamDirectoryMetadataOverride = {
  display_name?: string | null;
  stadium?: string | null;
  manager?: string | null;
  website?: string | null;
  instagram?: string | null;
  official_url?: string | null;
  incident_count?: number;
};

export const GLOBAL_TEAM_METADATA_OVERRIDES: Record<string, TeamDirectoryMetadataOverride> = {
  "Alimerka Oviedo Baloncesto": {
    "display_name": "Oviedo Baloncesto"
  },
  "Amara Lleida": {
    "display_name": "Lleida",
    "website": "https://flleida.cat/",
    "instagram": "https://www.instagram.com/flleida",
    "stadium": "Espai Fruita Barris Nord"
  },
  "Anadolu Efes Istanbul": {
    "website": "https://www.anadoluefessk.org/",
    "instagram": "https://www.instagram.com/anadoluefessk/",
    "stadium": "Turkcell Basketball Development Center",
    "display_name": "Anadolu Efes"
  },
  "AS Monaco": {
    "website": "https://asmonaco.basketball/",
    "instagram": "https://www.instagram.com/asmonaco_basket/",
    "stadium": "Salle Gaston Médecin",
    "display_name": "Monaco"
  },
  "Barça": {
    "display_name": "Barça",
    "website": "https://www.fcbarcelona.es/es/baloncesto",
    "instagram": "https://www.instagram.com/FCBbasket",
    "stadium": "Palau Blaugrana"
  },
  "Baskonia": {
    "display_name": "Baskonia",
    "website": "https://www.baskonia.com",
    "instagram": "https://www.instagram.com/baskonia1959",
    "stadium": "Fernando Buesa Arena"
  },
  "Basquet Girona": {
    "display_name": "Bàsquet Girona",
    "website": "https://basquetgirona.com/",
    "instagram": "https://www.instagram.com/basquetgirona",
    "stadium": "Palau Girona-Fontajau"
  },
  "BAXI Manresa": {
    "display_name": "Manresa",
    "website": "https://www.basquetmanresa.com",
    "instagram": "https://www.instagram.com/basquetmanresa",
    "stadium": "Pavelló Nou Congost"
  },
  "Bilbao Basket": {
    "display_name": "Bilbao Basket",
    "website": "https://www.bilbaobasket.biz",
    "instagram": "https://www.instagram.com/bilbaobasket",
    "stadium": "Bilbao Arena"
  },
  "Bàsquet Girona": {
    "display_name": "Bàsquet Girona",
    "website": "https://basquetgirona.com/",
    "instagram": "https://www.instagram.com/basquetgirona",
    "stadium": "Palau Girona-Fontajau"
  },
  "Caja Rural CB Zamora": {
    "website": "https://cbzamora.com/",
    "instagram": "https://www.instagram.com/cb.zamora/",
    "stadium": "Pabellón Ángel Nieto",
    "display_name": "CB Zamora"
  },
  "Casademont Zaragoza": {
    "display_name": "Zaragoza",
    "website": "https://casademontzaragoza.es/",
    "instagram": "https://www.instagram.com/CasademontZaragoza",
    "stadium": "Pabellón Príncipe Felipe"
  },
  "CB Naturavia Morón": {
    "display_name": "Morón"
  },
  "Club Ourense Baloncesto": {
    "display_name": "Ourense"
  },
  "Coviran Granada": {
    "display_name": "Granada",
    "website": "https://fundacioncbgranada.es",
    "instagram": "https://www.instagram.com/fundacioncbg",
    "stadium": "Palacio de Deportes de Granada"
  },
  "Crvena Zvezda Meridianbet Belgrade": {
    "website": "https://kkcrvenazvezda.rs/",
    "instagram": "https://www.instagram.com/crvenazvezdakk/",
    "stadium": "Belgrade Arena",
    "display_name": "Crvena Zvezda"
  },
  "Dreamland Gran Canaria": {
    "display_name": "Gran Canaria",
    "website": "https://www.cbgrancanaria.net",
    "instagram": "https://www.instagram.com/grancanariacb",
    "stadium": "Gran Canaria Arena"
  },
  "Dubai Basketball": {
    "website": "https://dubaibasketball.com/",
    "instagram": "https://www.instagram.com/dubaibasketballclub/",
    "stadium": "Coca-Cola Arena"
  },
  "EA7 Emporio Armani Milan": {
    "website": "https://www.olimpiamilano.com/",
    "instagram": "https://www.instagram.com/olimpiamilano1936/",
    "stadium": "Unipol Forum",
    "display_name": "Olimpia Milano"
  },
  "FC Barcelona": {
    "display_name": "Barcelona",
    "website": "https://www.fcbarcelona.es/es/baloncesto",
    "instagram": "https://www.instagram.com/FCBBasket",
    "stadium": "Palau Blaugrana"
  },
  "FC Bayern Munich": {
    "website": "https://fcbayern.com/basketball/en",
    "instagram": "https://www.instagram.com/fcbayernbasketball/",
    "stadium": "SAP Garden",
    "display_name": "Bayern Munich"
  },
  "Fenerbahçe Beko Istanbul": {
    "website": "https://www.fenerbahce.org/?lang=en",
    "instagram": "https://www.instagram.com/fbbasketbol/",
    "stadium": "Ülker Sports and Event Hall",
    "display_name": "Fenerbahçe"
  },
  "FIBWI Mallorca Basquet": {
    "display_name": "Mallorca"
  },
  "Flexicar Fuenlabrada": {
    "display_name": "Fuenlabrada"
  },
  "Fundación CB Canarias": {
    "display_name": "CB Canarias",
    "website": "https://fundacioncbcanarias.org/en/",
    "instagram": "https://www.instagram.com/fundacioncbcanarias/",
    "stadium": "Pabellón Santiago Martín"
  },
  "Gran Canaria": {
    "display_name": "Gran Canaria",
    "website": "https://www.cbgrancanaria.net",
    "instagram": "https://www.instagram.com/grancanariacb",
    "stadium": "Gran Canaria Arena"
  },
  "Grupo Alega Cantabria": {
    "display_name": "Cantabria"
  },
  "Grupo Ureta Tizona Burgos": {
    "display_name": "Tizona Burgos"
  },
  "Hapoel IBI Tel Aviv": {
    "website": "https://hapoelbc.com/en/about-en/",
    "instagram": "https://www.instagram.com/hapoelbanktelaviv/",
    "stadium": "Menora Mivtachim Arena",
    "display_name": "Hapoel Tel Aviv"
  },
  "Hestia Menorca": {
    "display_name": "Menorca"
  },
  "Hiopos Lleida": {
    "display_name": "Lleida",
    "website": "https://flleida.cat/",
    "instagram": "https://www.instagram.com/flleida",
    "stadium": "Espai Fruita Barris Nord"
  },
  "HLA Alicante": {
    "display_name": "Alicante"
  },
  "Inveready Gipuzkoa": {
    "display_name": "Gipuzkoa Basket"
  },
  "Joventut Badalona": {
    "display_name": "Joventut",
    "website": "https://www.penya.com",
    "instagram": "https://www.instagram.com/Penya1930",
    "stadium": "Palau Municipal d'Esports de Badalona"
  },
  "La Laguna Tenerife": {
    "display_name": "Tenerife",
    "website": "https://www.cbcanarias.net",
    "instagram": "https://www.instagram.com/cbcanarias",
    "stadium": "Pab. Dep. Tenerife Santiago Martín"
  },
  "LDLC ASVEL Villeurbanne": {
    "website": "https://ldlcasvel.com/",
    "instagram": "https://www.instagram.com/ldlc_asvel/",
    "stadium": "LDLC Arena",
    "display_name": "ASVEL"
  },
  "Leyma Coruña": {
    "display_name": "Coruña",
    "website": "https://www.basquetcoruna.com",
    "instagram": "https://www.instagram.com/basquetcoruna",
    "stadium": "Coliseum"
  },
  "Maccabi Rapyd Tel Aviv": {
    "website": "https://www.maccabi.co.il/?lang=en",
    "instagram": "https://www.instagram.com/maccabitlv/",
    "stadium": "Menora Mivtachim Arena",
    "display_name": "Maccabi Tel Aviv"
  },
  "Maccabi Playtika Tel Aviv": {
    "website": "https://www.maccabi.co.il/?lang=en",
    "instagram": "https://www.instagram.com/maccabitlv/",
    "stadium": "Menora Mivtachim Arena",
    "display_name": "Maccabi Tel Aviv"
  },
  "Melilla Ciudad Del Deporte": {
    "display_name": "Melilla"
  },
  "Monbus Obradoiro": {
    "display_name": "Obradoiro"
  },
  "MoraBanc Andorra": {
    "display_name": "Andorra",
    "website": "https://www.bca.ad",
    "instagram": "https://www.instagram.com/morabancandorra",
    "stadium": "Pavelló Toni Martí"
  },
  "Movistar Estudiantes": {
    "website": "https://www.movistarestudiantes.com/",
    "instagram": "https://www.instagram.com/clubestudiantes/",
    "display_name": "Estudiantes"
  },
  "Olympiacos Piraeus": {
    "website": "https://www.olympiacosbc.gr/en/",
    "instagram": "https://www.instagram.com/olympiacosbc/",
    "stadium": "Peace and Friendship Stadium",
    "display_name": "Olympiacos"
  },
  "Palencia Baloncesto": {
    "display_name": "Palencia"
  },
  "Palmer Basket Mallorca Palma": {
    "display_name": "Palma"
  },
  "Panathinaikos AKTOR Athens": {
    "website": "https://www.paobc.gr/",
    "instagram": "https://www.instagram.com/paobcgr/",
    "stadium": "Telekom Center Athens",
    "display_name": "Panathinaikos"
  },
  "Paris Basketball": {
    "website": "https://parisbasketball.com/en/",
    "instagram": "https://www.instagram.com/parisbasketball/",
    "stadium": "Adidas Arena"
  },
  "Partizan Mozzart Bet Belgrade": {
    "website": "https://partizan.basketball/",
    "instagram": "https://www.instagram.com/partizanbc/",
    "stadium": "Belgrade Arena",
    "display_name": "Partizan"
  },
  "Real Betis Baloncesto": {
    "website": "https://www.realbetisbalompie.es/baloncesto/",
    "instagram": "https://www.instagram.com/realbetisbalompie/",
    "display_name": "Betis Baloncesto"
  },
  "Real Madrid": {
    "display_name": "Real Madrid",
    "website": "https://www.realmadrid.com/baloncesto",
    "instagram": "https://www.instagram.com/realmadridbasket",
    "stadium": "Movistar Arena"
  },
  "Río Breogán": {
    "display_name": "Breogán",
    "website": "https://www.cbbreogan.com",
    "instagram": "https://www.instagram.com/cbbreogan",
    "stadium": "Pazo Provincial dos Deportes de Lugo"
  },
  "San Pablo Burgos": {
    "display_name": "San Pablo Burgos",
    "website": "https://www.sanpabloburgos.com/",
    "instagram": "https://www.instagram.com/sanpabloburgos/",
    "stadium": "Coliseum Burgos"
  },
  "Stellantis & You Granada": {
    "display_name": "Granada",
    "website": "https://fundacioncbgranada.es",
    "instagram": "https://www.instagram.com/fundacioncbg",
    "stadium": "Palacio de Deportes de Granada"
  },
  "Surne Bilbao Basket": {
    "display_name": "Bilbao Basket",
    "website": "https://www.bilbaobasket.biz",
    "instagram": "https://www.instagram.com/bilbaobasket",
    "stadium": "Bilbao Arena"
  },
  "UCAM Murcia": {
    "display_name": "Murcia",
    "website": "https://www.ucammurcia.com",
    "instagram": "https://www.instagram.com/ucammurcia",
    "stadium": "Palacio de Deportes de Murcia"
  },
  "UEMC Real Valladolid": {
    "display_name": "Real Valladolid"
  },
  "Unicaja": {
    "display_name": "Unicaja",
    "website": "https://www.unicajabaloncesto.com",
    "instagram": "https://www.instagram.com/unicajabaloncesto",
    "stadium": "Palacio de Deportes José María Martín Carpena"
  },
  "Valencia Basket": {
    "display_name": "Valencia Basket",
    "website": "https://www.valenciabasket.com",
    "instagram": "https://www.instagram.com/valenciabasket",
    "stadium": "Roig Arena"
  },
  "Zamora": {
    "display_name": "CB Zamora"
  },
  "Žalgiris Kaunas": {
    "website": "https://zalgiris.lt/en",
    "instagram": "https://www.instagram.com/bczalgiris/",
    "stadium": "Žalgirio Arena",
    "display_name": "Žalgiris"
  }
};

export const TEAM_DISPLAY_NAME_OVERRIDES: Record<string, string> = {
  "9 de Julio de Morteros": "9 de Julio",
  "Alma Juniors de Esperanza": "Alma Juniors",
  "Argentino (J)": "Argentino de Junín",
  "Argentino de Junín": "Argentino de Junín",
  "Argentino de Marcos Juárez": "Argentino (Marcos Juárez)",
  "Atenas de Córdoba": "Atenas (Córdoba)",
  "Atlético Regina": "Club Atlético Regina",
  "Banda Norte": "Banda Norte",
  "CAPRI de Posadas": "Capri (Posadas)",
  "Casa de Padua": "Casa Padua",
  "Cañuelas Fútbol Club": "Cañuelas FC",
  "Centro Español de Plottier": "Centro Español",
  "Club Atlético Pilar": "Atlético Pilar",
  "Club Atlético Estudiantes": "Club Atlético Estudiantes de Tucumán",
  "Club Atlético Estudiantes de Tucumán": "Club Atlético Estudiantes de Tucumán",
  "Club GEI": "GEI",
  "Club Tres de Febrero": "3 de Febrero",
  "Comunicaciones de Mercedes": "Comunicaciones (M)",
  "Colón de Santa Fe": "Colón (SF)",
  "Colón SF": "Colón (SF)",
  "Córdoba de Corrientes": "Córdoba (Corrientes)",
  "Cultural de Santa Sylvina": "Cultural (Santa Sylvina)",
  "Defensores de Hurlingham": "Defensores de Hurlingham",
  "Deportivo Roca": "Club Social y Deportivo Roca",
  "Don Bosco de Resistencia": "Don Bosco (Resistencia)",
  "Estudiantil porteño": "Estudiantil Porteño",
  "Gimnasia de Villa del Parque": "Gimnasia y Esgrima de Villa del Parque",
  "Gimnasia y Esgrima de Rosario": "Gimnasia (Rosario)",
  "Hércules de Charata": "Hércules (Charata)",
  "Instituto de Córdoba": "Instituto",
  "Independiente de Neuquén": "Independiente de Neuquén",
  "Jose Hernandez": "José Hernández",
  "La Unión de Colón": "La Unión (C)",
  "Las Heras de Villa Ballester": "Las Heras",
  "Los Indios de Moreno": "Los Indios de Moreno",
  "Mitre de Posadas": "Mitre (Posadas)",
  "Nolthing": "Nolting",
  "Náutico Avellaneda": "Náutico (Rosario)",
  "Obras": "Obras Basket",
  "Olímpico de la Banda": "Olímpico (La Banda)",
  "Olimpia de Venado Tuerto": "Olimpia (Venado Tuerto)",
  "Pacífico de Neuquén": "Pacífico",
  "Peñarol Uru": "Peñarol",
  "Peñarol de Mar del Plata": "Peñarol",
  "Pico Football Club": "Pico FC",
  "Provincial de Rosario": "Club Atlético Provincial",
  "Quilmes de Mar del Plata": "Quilmes (MdP)",
  "Regatas (C)": "Regatas Corrientes",
  "Riachuelo": "Riachuelo (La Rioja)",
  "Rivadavia Básquet": "Rivadavia (M)",
  "San Lorenzo de Almagro": "San Lorenzo",
  "San Lorenzo de Monte Caseros": "San Lorenzo (Monte Caseros)",
  "San Martín (C)": "San Martín (Corrientes)",
  "San Martín de Corrientes": "San Martín de Corrientes",
  "San Martín de Marcos Juárez": "San Martín (Marcos Juárez)",
  "San Miquel": "San Miguel",
  "San José de Mendoza": "San José",
  "Tokio de Posadas": "Tokio (Posadas)",
  "Universidad La Matanza": "Universidad de La Matanza",
  "Universidad Nacional de La Matanza": "Universidad de La Matanza",
  "Unión de Santa Fe": "Unión (Santa Fe)",
  "Velez Sarsfield": "Vélez Sarsfield",
  "Villa Mitre de Bahía Blanca": "Villa Mitre",
  "Villa San Martín de Resistencia": "Villa San Martín",
  "Moreno de Quilmes": "Moreno",
  "Zarate": "Zárate Basket",
  "Zárate Basket": "Zárate Basket"
};

export const TEAM_COMPETITION_DISPLAY_NAME_OVERRIDES: Record<string, string> = {
  "Alimerka Oviedo Baloncesto::Primera FEB": "Alimerka Oviedo Baloncesto",
  "Amancay de La Rioja::Liga Argentina": "Amancay (LR)",
  "Amara Lleida::Liga U22": "Amara Lleida",
  "Anadolu Efes Istanbul::Euroliga": "Anadolu Efes Istanbul",
  "APU Old Wild West Udine::LBA Serie A": "APU Old Wild West Udine",
  "AS Monaco::Euroliga": "AS Monaco",
  "ASISA Joventut::Liga Endesa": "ASISA Joventut",
  "Atenas de Córdoba::Liga Nacional": "Atenas (Córdoba)",
  "Atuneros del Pacífico::Liga Ecuador Fem": "Atuneros del Pacífico",
  "Banco di Sardegna Sassari::LBA Serie A": "Banco di Sardegna Sassari",
  "Barça::Liga Endesa": "Barça",
  "Basquet Girona::Liga U22": "Bàsquet Girona",
  "Baskonia::Liga Endesa": "Kosner Baskonia",
  "BAXI Manresa::Liga Endesa": "BAXI Manresa",
  "BAXI Manresa::Liga U22": "BAXI Manresa",
  "Bertram Derthona Tortona::LBA Serie A": "Bertram Derthona Tortona",
  "Bilbao Basket::Liga U22": "Bilbao Basket",
  "Bochas Sport Club::Liga Argentina": "Bochas (CC)",
  "Bochas Sport Club::Liga Femenina": "Bochas (CC)",
  "Brescia::LBA Serie A": "Germani Brescia",
  "Calero::Libo Basquet": "Club Calero",
  "Can::Libo Basquet": "CAN Oruro",
  "Carl AZ::Libo Basquet": "Carl A-Z",
  "Casademont Zaragoza::Liga Endesa": "Casademont Zaragoza",
  "Casademont Zaragoza::Liga U22": "Casademont Zaragoza",
  "Centenario de Venado Tuerto::Liga Argentina": "Centenario (VT)",
  "Chañares de James Craik::Liga Femenina": "Chañares (JC)",
  "Club Atlético Estudiantes::Liga Argentina": "Club Atlético Estudiantes de Tucumán",
  "Club Atlético Estudiantes de Tucumán::Liga Argentina": "Club Atlético Estudiantes de Tucumán",
  "Club Atlético Pilar::Liga Argentina": "Atlético Pilar",
  "Club Atlético Provincial::Liga Argentina": "Club Atlético Provincial",
  "Provincial de Rosario::Liga Argentina": "Club Atlético Provincial",
  "Club Deportivo Valdivia::Liga Chery": "CD Valdivia",
  "Club Ourense Baloncesto::Primera FEB": "Club Ourense Baloncesto",
  "Coviran Granada::Liga Endesa": "Coviran Granada",
  "Cremona::LBA Serie A": "Vanoli Basket Cremona",
  "Crvena Zvezda Meridianbet Belgrade::Euroliga": "Crvena Zvezda Meridianbet Belgrade",
  "Cuenca::Liga Ecuador Fem": "Cuenca Basket Club",
  "Deportivo Alemán de Concepción::Liga Dos": "Deportivo Alemán de Concepción",
  "Dinamo Sassari::LBA Serie A": "Banco di Sardegna Sassari",
  "Dolomiti Energia Trentino::LBA Serie A": "Dolomiti Energia Trentino",
  "Dragonas Importadora Alvarado::Liga Ecuador Fem": "Dragonas Importadora Alvarado",
  "Dreamland Gran Canaria::Liga Endesa": "Gran Canaria",
  "Dubai Basketball::Euroliga": "Dubai Basketball",
  "EA7 Emporio Armani Milan::Euroliga": "EA7 Emporio Armani Milan",
  "EA7 Emporio Armani Milan::LBA Serie A": "EA7 Emporio Armani Milano",
  "FC Barcelona::Euroliga": "Barcelona",
  "FC Barcelona::Liga U22": "Barça Atlètic",
  "FC Bayern Munich::Euroliga": "FC Bayern Munich",
  "Fenerbahçe Beko Istanbul::Euroliga": "Fenerbahce Beko Istanbul",
  "Ferro Carril Oeste::Liga Femenina": "Ferro Carril Oeste",
  "FIBWI Mallorca Basquet::Primera FEB": "Fibwi Mallorca Bàsquet Palma",
  "Flexicar Fuenlabrada::Primera FEB": "Flexicar Fuenlabrada",
  "Fundación CB Canarias::Liga U22": "Fundación CB Canarias",
  "Gimnasia::Liga Argentina": "Gimnasia y Esgrima (LP)",
  "Gimnasia y Esgrima de La Plata::Liga Argentina": "Gimnasia y Esgrima (LP)",
  "Gimnasia y Esgrima de La Plata::Liga Metropolitana": "Gimnasia y Esgrima La Plata",
  "Gimnástico::Liga Chery": "CD Gimnástico",
  "Gorriones de Río Cuarto::Liga Femenina": "Gorriones",
  "Gran Canaria::Liga U22": "Gran Canaria",
  "Grupo Alega Cantabria::Primera FEB": "Grupo Alega Cantabria",
  "Grupo Caesa Seguros FC Cartagena CB::Primera FEB": "Grupo Caesa Seguros FC Cartagena CB",
  "Grupo Ureta Tizona Burgos::Primera FEB": "Grupo Ureta Tizona Burgos",
  "Hapoel IBI Tel Aviv::Euroliga": "Hapoel IBI Tel Aviv",
  "Hebraica::LUB": "Hebraica y Macabi",
  "Hestia Menorca::Primera FEB": "Hestia Menorca",
  "Hiopos Lleida::Liga Endesa": "Hiopos Lleida",
  "Hindú (C)::Liga Femenina": "Hindú Club (C)",
  "Hindú Club::Liga Argentina": "Hindú Club de Córdoba",
  "Hindú Club de Córdoba::Liga Argentina": "Hindú Club de Córdoba",
  "Hindú Club de Córdoba::Liga Femenina": "Hindú Club de Córdoba",
  "Hindú Club de Resistencia::Liga Federal": "Hindú Club",
  "HLA Alicante::Primera FEB": "HLA Alicante",
  "Inveready Gipuzkoa::Primera FEB": "Inveready Gipuzkoa",
  "Independiente de Neuquén::Liga Femenina": "Independiente de Neuquén",
  "Instituto de Córdoba::Liga Femenina": "Instituto",
  "Instituto de Córdoba::Liga Nacional": "Instituto",
  "Jorge Guzmán::Liga Ecuador Fem": "Jorge Guzmán Club Deportivo",
  "Joventut Badalona::Liga Endesa": "ASISA Joventut",
  "Joventut Badalona::Liga U22": "Joventut Badalona",
  "Kinwa::Libo Basquet": "Kinwa",
  "Kosner Baskonia Vitoria-Gasteiz::Euroliga": "Kosner Baskonia Vitoria-Gasteiz",
  "La Laguna Tenerife::Liga Endesa": "La Laguna Tenerife",
  "LDLC ASVEL Villeurbanne::Euroliga": "LDLC ASVEL Villeurbanne",
  "Leones::Libo Basquet": "Leones de Potosí",
  "Leones de Potosí::Libo Basquet": "Leones de Potosí",
  "Leyma Coruña::Primera FEB": "Leyma Coruña",
  "Maccabi Playtika Tel Aviv::Euroliga": "Maccabi Rapyd Tel Aviv",
  "Maccabi Rapyd Tel Aviv::Euroliga": "Maccabi Rapyd Tel Aviv",
  "Melilla Ciudad Del Deporte::Primera FEB": "Melilla Ciudad del Deporte",
  "Monbus Obradoiro::Primera FEB": "Monbus Obradoiro",
  "MoraBanc Andorra::Liga Endesa": "MoraBanc Andorra",
  "Movistar Estudiantes::Primera FEB": "Movistar Estudiantes",
  "Municipal Puente Alto::Liga Chery": "Municipal Puente Alto",
  "Napoli::LBA Serie A": "Napolibasket",
  "Náutico (R)::Liga Femenina": "Náutico",
  "Náutico Sportivo Avellaneda::Liga Femenina": "Náutico",
  "Obras Basket::Liga Femenina": "Obras Basket",
  "Olimpia Milano::LBA Serie A": "Olimpia Milano",
  "Olympiacos Piraeus::Euroliga": "Olympiacos Piraeus",
  "Palencia Baloncesto::Primera FEB": "Súper Agropal Palencia",
  "Pallacanestro Cantù::LBA Serie A": "Acqua S.Bernardo Cantù",
  "Pallacanestro Reggiana::LBA Serie A": "Pallacanestro Reggiana",
  "Pallacanestro Trieste::LBA Serie A": "Pallacanestro Trieste",
  "Pallacanestro Udinese::LBA Serie A": "APU Old Wild West Udine",
  "Panathinaikos AKTOR Athens::Euroliga": "Panathinaikos AKTOR Athens",
  "Paris Basketball::Euroliga": "Paris Basketball",
  "Partizan Mozzart Bet Belgrade::Euroliga": "Partizan Mozzart Bet Belgrade",
  "Peñarol Uru::LUB": "Peñarol",
  "Piratas::Liga Ecuador Fem": "Piratas de los Lagos",
  "Potosi::Libo Basquet": "Nacional Potosí",
  "Puerto Montt::Liga Dos": "Puerto Montt Básquetbol",
  "Puente Alto::Liga Chery": "Municipal Puente Alto",
  "Quimsa::Liga Femenina": "Quimsa",
  "Riachuelo::Liga Femenina": "Riachuelo",
  "Riachuelo::Liga Nacional": "Riachuelo (La Rioja)",
  "Real Madrid::Euroliga": "Real Madrid",
  "Real Madrid::Liga Endesa": "Real Madrid",
  "Real Madrid::Liga U22": "Real Madrid",
  "Recoletas Salud San Pablo Burgos::Liga Endesa": "Recoletas Salud San Pablo Burgos",
  "Río Breogán::Liga Endesa": "Río Breogán",
  "San Antonio::Liga Ecuador Fem": "San Antonio Gold",
  "San Antonio Gold::Liga Ecuador Fem": "San Antonio Gold",
  "San Pablo Burgos::Liga Endesa": "Recoletas Salud San Pablo Burgos",
  "San Pablo Burgos::Liga U22": "Burgos Grupo de Santiago",
  "Sergio Ceppi::Liga Chery": "CD Sergio Ceppi",
  "Sportivo Italiano::Liga Chery": "Sportiva Italiana",
  "Sportivo Italiano::LNF Chile": "Sportiva Italiana",
  "Spartans::Liga Ecuador Fem": "Spartans SG",
  "Stellantis & You Granada::Liga U22": "Stellantis & You Granada",
  "Surne Bilbao Basket::Liga Endesa": "Bilbao Basket",
  "Tabaré::LUB Ascenso": "Tabaré",
  "Tomás de Rocamora::Liga Femenina": "Rocamora",
  "Tortona::LBA Serie A": "Bertram Derthona Tortona",
  "Trapani::LBA Serie A": "Trapani Shark",
  "Trieste::LBA Serie A": "Pallacanestro Trieste",
  "U Sucre::Libo Basquet": "Universitario de Sucre",
  "UCAM Murcia::Liga Endesa": "UCAM Murcia",
  "UNA Hotels Reggio Emilia::LBA Serie A": "UNA Hotels Reggio Emilia",
  "Unicaja::Liga Endesa": "Unicaja",
  "Unicaja::Liga U22": "Unicaja Alhaurín de la Torre",
  "Universidad de Concepción::Liga Chery": "CD Universidad de Concepción",
  "Universidad de Concepción::LNF Chile": "Universidad de Concepción",
  "Universitario de Sucre::Libo Basquet": "Universitario de Sucre",
  "Valencia Basket::Euroliga": "Valencia Basket",
  "Valencia Basket::Liga Endesa": "Valencia Basket",
  "Valencia Basket::Liga U22": "Valencia Basket",
  "Vanoli Basket Cremona::LBA Serie A": "Vanoli Basket Cremona",
  "Virtus Bologna::Euroliga": "Virtus Bologna",
  "Virtus Bologna::LBA Serie A": "Virtus Olidata Bologna",
  "Virtus Olidata Bologna::LBA Serie A": "Virtus Olidata Bologna",
  "Zalgiris Kaunas::Euroliga": "Zalgiris Kaunas",
  "Žalgiris Kaunas::Euroliga": "Zalgiris Kaunas"
};

export const TEAM_DIRECTORY_COMPETITION_METADATA_OVERRIDES: Record<string, TeamDirectoryMetadataOverride> = {
  "Basquet Girona::Liga Endesa": {
    "official_url": "https://acb.com/es/liga/equipos/basquet-girona-591"
  },
  "Bàsquet Girona::Liga Endesa": {
    "official_url": "https://acb.com/es/liga/equipos/basquet-girona-591"
  },
  "Barça::Liga Endesa": {
    "official_url": "https://acb.com/es/liga/equipos/barca-2"
  },
  "Baskonia::Liga Endesa": {
    "official_url": "https://acb.com/es/liga/equipos/kosner-baskonia-3"
  },
  "FC Barcelona::Liga Endesa": {
    "official_url": "https://acb.com/es/liga/equipos/barca-2"
  },
  "BAXI Manresa::Liga Endesa": {
    "official_url": "https://acb.com/es/liga/equipos/baxi-manresa-10"
  },
  "Casademont Zaragoza::Liga Endesa": {
    "official_url": "https://acb.com/es/liga/equipos/casademont-zaragoza-16"
  },
  "Coviran Granada::Liga Endesa": {
    "official_url": "https://acb.com/es/liga/equipos/coviran-granada-592"
  },
  "Dreamland Gran Canaria::Liga Endesa": {
    "official_url": "https://acb.com/es/liga/equipos/dreamland-gran-canaria-5"
  },
  "Hiopos Lleida::Liga Endesa": {
    "official_url": "https://www.acb.com/es/liga/equipos/hiopos-lleida-658"
  },
  "Joventut Badalona::Liga Endesa": {
    "official_url": "https://acb.com/es/liga/equipos/asisa-joventut-8"
  },
  "La Laguna Tenerife::Liga Endesa": {
    "official_url": "https://acb.com/es/liga/equipos/la-laguna-tenerife-28"
  },
  "Leyma Coruña::Liga Endesa": {
    "official_url": "https://acb.com/es/liga/equipos/leyma-coruna-657"
  },
  "MoraBanc Andorra::Liga Endesa": {
    "official_url": "https://acb.com/es/liga/equipos/morabanc-andorra-22"
  },
  "Real Madrid::Liga Endesa": {
    "official_url": "https://www.acb.com/es/liga/equipos/real-madrid-9"
  },
  "Río Breogán::Liga Endesa": {
    "official_url": "https://acb.com/es/liga/equipos/rio-breogan-25"
  },
  "San Pablo Burgos::Liga Endesa": {
    "official_url": "https://acb.com/es/liga/equipos/recoletas-salud-san-pablo-burgos-549"
  },
  "Surne Bilbao Basket::Liga Endesa": {
    "official_url": "https://acb.com/es/liga/equipos/surne-bilbao-4"
  },
  "Unicaja::Liga Endesa": {
    "official_url": "https://www.acb.com/es/liga/equipos/unicaja-14"
  },
  "Valencia Basket::Liga Endesa": {
    "official_url": "https://acb.com/es/liga/equipos/valencia-basket-13"
  },
  "Dolomiti Energia Trentino::LBA Serie A": {
    "official_url": "https://www.legabasket.it/protagonisti/squadre/2025/1718/dolomiti-energia-trentino"
  },
  "Brescia::LBA Serie A": {
    "official_url": "https://www.legabasket.it/protagonisti/squadre/1959/1419/germani-basket-brescia"
  },
  "Dinamo Sassari::LBA Serie A": {
    "official_url": "https://www.legabasket.it/protagonisti/squadre/2010/1286/dinamo-sassari"
  },
  "Cremona::LBA Serie A": {
    "official_url": "https://www.legabasket.it/protagonisti/squadre/2025/1725/vanoli-basket-cremona"
  },
  "Givova Scafati::LBA Serie A": {
    "official_url": "https://www.legabasket.it/protagonisti/squadre/2024/1653/givova-scafati"
  },
  "Napoli::LBA Serie A": {
    "official_url": "https://www.legabasket.it/protagonisti/squadre/1481/gevi-napoli-basket"
  },
  "Nutribullet Treviso::LBA Serie A": {
    "official_url": "https://www.legabasket.it/protagonisti/squadre/2025/1722/nutri-bullet-treviso-basket"
  },
  "Olimpia Milano::LBA Serie A": {
    "official_url": "https://www.legabasket.it/protagonisti/squadre/2025/1714/ea7-emporio-armani-milano"
  },
  "Openjobmetis Varese::LBA Serie A": {
    "official_url": "https://www.legabasket.it/protagonisti/squadre/2025/1723/openjobmetis-varese"
  },
  "Pallacanestro Cantù::LBA Serie A": {
    "official_url": "https://www.legabasket.it/protagonisti/squadre/2025/1726/acqua-s-bernardo-cant"
  },
  "Pallacanestro Udinese::LBA Serie A": {
    "official_url": "https://www.legabasket.it/protagonisti/squadre/2025/1727/apu-old-wild-west-udine"
  },
  "Pesaro::LBA Serie A": {
    "official_url": "https://www.legabasket.it/protagonisti/squadre/315"
  },
  "Pistoia::LBA Serie A": {
    "official_url": "https://www.legabasket.it/protagonisti/squadre/2024/1650/estra-pistoia"
  },
  "Trapani::LBA Serie A": {
    "official_url": "https://www.legabasket.it/protagonisti/squadre/2025/1719/trapani-shark"
  },
  "Tortona::LBA Serie A": {
    "official_url": "https://www.legabasket.it/protagonisti/squadre/2024/1657/bertram-derthona-tortona"
  },
  "Treviso::LBA Serie A": {
    "official_url": "https://www.legabasket.it/protagonisti/squadre/2025/1722/nutri-bullet-treviso-basket"
  },
  "Trieste::LBA Serie A": {
    "official_url": "https://www.legabasket.it/protagonisti/squadre/2025/1739/pallacanestro-trieste"
  },
  "Umana Reyer Venezia::LBA Serie A": {
    "official_url": "https://www.legabasket.it/protagonisti/squadre/2025/1724/umana-reyer-venezia"
  },
  "UNA Hotels Reggio Emilia::LBA Serie A": {
    "official_url": "https://www.legabasket.it/protagonisti/squadre/2025/1735/una-hotels-reggio-emilia"
  },
  "Virtus Bologna::LBA Serie A": {
    "official_url": "https://www.legabasket.it/protagonisti/squadre/2025/1712/virtus-bologna"
  },
  "Anadolu Efes Istanbul::Euroliga": {
    "official_url": "https://www.euroleaguebasketball.net/en/euroleague/teams/efes/ist/"
  },
  "AS Monaco::Euroliga": {
    "official_url": "https://www.euroleaguebasketball.net/euroleague/teams/as-monaco/mco/"
  },
  "Crvena Zvezda Meridianbet Belgrade::Euroliga": {
    "official_url": "https://www.euroleaguebasketball.net/en/euroleague/teams/crvena-zvezda-meridianbet-belgrade/red/"
  },
  "Dubai Basketball::Euroliga": {
    "official_url": "https://www.euroleaguebasketball.net/en/euroleague/teams/dubai-basketball/dub/"
  },
  "EA7 Emporio Armani Milan::Euroliga": {
    "official_url": "https://www.euroleaguebasketball.net/en/euroleague/teams/ea7-emporio-armani-milan/mil/"
  },
  "FC Barcelona::Euroliga": {
    "official_url": "https://www.euroleaguebasketball.net/en/euroleague/teams/fc-barcelona/bar/"
  },
  "FC Bayern Munich::Euroliga": {
    "official_url": "https://www.euroleaguebasketball.net/en/euroleague/teams/fc-bayern-munich/mun/"
  },
  "Fenerbahçe Beko Istanbul::Euroliga": {
    "official_url": "https://www.euroleaguebasketball.net/en/euroleague/teams/fenerbahce-beko-istanbul/ulk/"
  },
  "Hapoel IBI Tel Aviv::Euroliga": {
    "official_url": "https://www.euroleaguebasketball.net/en/euroleague/teams/hapoel-ibi-tel-aviv/hta/"
  },
  "LDLC ASVEL Villeurbanne::Euroliga": {
    "official_url": "https://www.euroleaguebasketball.net/en/euroleague/teams/ldlc-asvel-villeurbanne/asv/"
  },
  "Maccabi Playtika Tel Aviv::Euroliga": {
    "official_url": "https://www.euroleaguebasketball.net/en/euroleague/teams/maccabi-rapyd-tel-aviv/tel/"
  },
  "Olympiacos Piraeus::Euroliga": {
    "official_url": "https://www.euroleaguebasketball.net/en/euroleague/teams/olympiacos-piraeus/oly/"
  },
  "Panathinaikos AKTOR Athens::Euroliga": {
    "official_url": "https://www.euroleaguebasketball.net/en/euroleague/teams/panathinaikos-bc-athens/pan/"
  },
  "Paris Basketball::Euroliga": {
    "official_url": "https://www.euroleaguebasketball.net/en/euroleague/teams/paris-basketball/prs/"
  },
  "Partizan Mozzart Bet Belgrade::Euroliga": {
    "official_url": "https://www.euroleaguebasketball.net/en/euroleague/teams/kk-partizan/par/"
  },
  "Real Madrid::Euroliga": {
    "official_url": "https://www.euroleaguebasketball.net/en/euroleague/teams/real-madrid/mad/"
  },
  "Valencia Basket::Euroliga": {
    "official_url": "https://www.euroleaguebasketball.net/en/euroleague/teams/valencia-basket/pam/"
  },
  "Žalgiris Kaunas::Euroliga": {
    "official_url": "https://www.euroleaguebasketball.net/en/euroleague/teams/zalgiris/zal/"
  },
  "Argentino (J)::Liga Nacional": {
    "official_url": "https://www.laliganacional.com.ar/laliga/club/argentino"
  },
  "Atenas de Córdoba::Liga Nacional": {
    "official_url": "https://www.laliganacional.com.ar/laliga/club/atenas"
  },
  "Boca Juniors::Liga Nacional": {
    "official_url": "https://www.laliganacional.com.ar/laliga/club/boca"
  },
  "Ferro Carril Oeste::Liga Nacional": {
    "official_url": "https://www.laliganacional.com.ar/laliga/club/ferro-carril-oeste"
  },
  "Gimnasia y Esgrima de Comodoro Rivadavia::Liga Nacional": {
    "official_url": "https://www.laliganacional.com.ar/laliga/club/gecr"
  },
  "Independiente de Oliva::Liga Nacional": {
    "official_url": "https://www.laliganacional.com.ar/laliga/club/independiente-oliva"
  },
  "Instituto de Córdoba::Liga Nacional": {
    "official_url": "https://www.laliganacional.com.ar/laliga/club/instituto"
  },
  "La Unión (F)::Liga Nacional": {
    "official_url": "https://www.laliganacional.com.ar/laliga/club/la-union-f"
  },
  "Oberá Tenis Club::Liga Nacional": {
    "official_url": "https://www.laliganacional.com.ar/laliga/club/obera"
  },
  "Obras::Liga Nacional": {
    "official_url": "https://www.laliganacional.com.ar/laliga/club/obras"
  },
  "Olímpico de la Banda::Liga Nacional": {
    "official_url": "https://www.laliganacional.com.ar/laliga/club/olimpico"
  },
  "Peñarol de Mar del Plata::Liga Nacional": {
    "official_url": "https://www.laliganacional.com.ar/laliga/club/penarol"
  },
  "Platense::Liga Nacional": {
    "official_url": "https://www.laliganacional.com.ar/laliga/club/platense"
  },
  "Quimsa::Liga Nacional": {
    "official_url": "https://www.laliganacional.com.ar/laliga/club/quimsa"
  },
  "Racing de Chivilcoy::Liga Nacional": {
    "official_url": "https://www.laliganacional.com.ar/laliga/club/racing-chivilcoy"
  },
  "Regatas (C)::Liga Nacional": {
    "official_url": "https://www.laliganacional.com.ar/laliga/club/regatas"
  },
  "Riachuelo::Liga Nacional": {
    "official_url": "https://www.laliganacional.com.ar/laliga/club/riachuelo"
  },
  "San Lorenzo de Almagro::Liga Nacional": {
    "official_url": "https://www.laliganacional.com.ar/laliga/club/san-lorenzo"
  },
  "San Martín (C)::Liga Nacional": {
    "official_url": "https://www.laliganacional.com.ar/laliga/club/san-martin"
  },
  "Unión de Santa Fe::Liga Nacional": {
    "official_url": "https://www.laliganacional.com.ar/laliga/club/union-sf"
  },
  "Zarate::Liga Nacional": {
    "official_url": "https://www.laliganacional.com.ar/laliga/club/zarate"
  },
  "Atlético San Isidro::Liga Argentina": {
    "official_url": "https://www.laliganacional.com.ar/ligaargentina/club/san-isidro"
  },
  "Barrio Parque::Liga Argentina": {
    "official_url": "https://www.laliganacional.com.ar/ligaargentina/club/barrio-parque"
  },
  "Central Entrerriano::Liga Argentina": {
    "official_url": "https://www.laliganacional.com.ar/ligaargentina/club/centralentrerriano"
  },
  "Ciclista Juninense::Liga Argentina": {
    "official_url": "https://www.laliganacional.com.ar/ligaargentina/club/ciclista"
  },
  "Amancay de La Rioja::Liga Argentina": {
    "official_url": "https://www.laliganacional.com.ar/ligaargentina/club/amancay"
  },
  "Centenario de Venado Tuerto::Liga Argentina": {
    "official_url": "https://www.laliganacional.com.ar/ligaargentina/club/centenario"
  },
  "Club Atlético Estudiantes de Tucumán::Liga Argentina": {
    "official_url": "https://www.laliganacional.com.ar/ligaargentina/club/estudiantestucuman"
  },
  "Club Atlético Estudiantes::Liga Argentina": {
    "official_url": "https://www.laliganacional.com.ar/ligaargentina/club/estudiantes-o"
  },
  "Club Atlético Provincial::Liga Argentina": {
    "official_url": "https://www.laliganacional.com.ar/ligaargentina/club/provincial"
  },
  "Colón SF::Liga Argentina": {
    "official_url": "https://www.laliganacional.com.ar/ligaargentina/club/colon-santafe"
  },
  "Comunicaciones de Mercedes::Liga Argentina": {
    "official_url": "https://www.laliganacional.com.ar/ligaargentina/club/comunicaciones"
  },
  "Deportivo Norte::Liga Argentina": {
    "official_url": "https://www.laliganacional.com.ar/ligaargentina/club/deportivo-norte"
  },
  "Deportivo Viedma::Liga Argentina": {
    "official_url": "https://www.laliganacional.com.ar/ligaargentina/club/alianza"
  },
  "El Talar::Liga Argentina": {
    "official_url": "https://www.laliganacional.com.ar/ligaargentina/club/eltalar"
  },
  "Gimnasia::Liga Argentina": {
    "official_url": "https://www.laliganacional.com.ar/ligaargentina/club/gimnasia-y-esgrima"
  },
  "Hindú Club::Liga Argentina": {
    "official_url": "https://www.laliganacional.com.ar/ligaargentina/club/hindu"
  },
  "Hispano Americano::Liga Argentina": {
    "official_url": "https://www.laliganacional.com.ar/ligaargentina/club/h-americano"
  },
  "Independiente BBC::Liga Argentina": {
    "official_url": "https://www.laliganacional.com.ar/ligaargentina/club/independiente-sde"
  },
  "Jujuy Básquet::Liga Argentina": {
    "official_url": "https://www.laliganacional.com.ar/ligaargentina/club/jujuybasquet"
  },
  "La Unión de Colón::Liga Argentina": {
    "official_url": "https://www.laliganacional.com.ar/ligaargentina/club/la-union-c"
  },
  "Lanús::Liga Argentina": {
    "official_url": "https://www.laliganacional.com.ar/ligaargentina/club/lanus"
  },
  "Pergamino Básquet::Liga Argentina": {
    "official_url": "https://www.laliganacional.com.ar/ligaargentina/club/pergamino"
  },
  "Pico Football Club::Liga Argentina": {
    "official_url": "https://www.laliganacional.com.ar/ligaargentina/club/picofc"
  },
  "Quilmes de Mar del Plata::Liga Argentina": {
    "official_url": "https://www.laliganacional.com.ar/ligaargentina/club/quilmes"
  },
  "Racing de Avellaneda::Liga Argentina": {
    "official_url": "https://www.laliganacional.com.ar/ligaargentina/club/racing-avellaneda"
  },
  "Rivadavia Básquet::Liga Argentina": {
    "official_url": "https://www.laliganacional.com.ar/ligaargentina/club/rivadavia"
  },
  "Salta Basket::Liga Argentina": {
    "official_url": "https://www.laliganacional.com.ar/ligaargentina/club/salta-basket"
  },
  "Sportivo Suardi::Liga Argentina": {
    "official_url": "https://www.laliganacional.com.ar/ligaargentina/club/suardi"
  },
  "Tomás de Rocamora::Liga Argentina": {
    "official_url": "https://www.laliganacional.com.ar/ligaargentina/club/rocamora"
  },
  "Unión de Mar del Plata::Liga Argentina": {
    "official_url": "https://www.laliganacional.com.ar/ligaargentina/club/union-mdp"
  },
  "Villa Mitre de Bahía Blanca::Liga Argentina": {
    "official_url": "https://www.laliganacional.com.ar/ligaargentina/club/villamitrebb"
  },
  "Villa San Martín de Resistencia::Liga Argentina": {
    "official_url": "https://www.laliganacional.com.ar/ligaargentina/club/villa-s-martin"
  },
  "Alega Cantabria::Primera FEB": {
    "official_url": "https://baloncestoenvivo.feb.es/equipo/979907"
  },
  "Alimerka Oviedo Baloncesto::Primera FEB": {
    "official_url": "https://baloncestoenvivo.feb.es/equipo/981124"
  },
  "Amics Castelló::Primera FEB": {
    "official_url": "https://baloncestoenvivo.feb.es/equipo/951360"
  },
  "Caja Rural CB Zamora::Primera FEB": {
    "official_url": "https://baloncestoenvivo.feb.es/equipo/981125"
  },
  "Cartagena::Primera FEB": {
    "official_url": "https://baloncestoenvivo.feb.es/equipo/981251"
  },
  "CB Naturavia Morón::Primera FEB": {
    "official_url": "https://baloncestoenvivo.feb.es/equipo/952158"
  },
  "Club Ourense Baloncesto::Primera FEB": {
    "official_url": "https://baloncestoenvivo.feb.es/equipo/981493"
  },
  "FIBWI Mallorca Basquet::Primera FEB": {
    "official_url": "https://baloncestoenvivo.feb.es/equipo/981214"
  },
  "Flexicar Fuenlabrada::Primera FEB": {
    "official_url": "https://baloncestoenvivo.feb.es/equipo/981525"
  },
  "Grupo Alega Cantabria::Primera FEB": {
    "official_url": "https://baloncestoenvivo.feb.es/equipo/979907"
  },
  "Grupo Ureta Tizona Burgos::Primera FEB": {
    "official_url": "https://baloncestoenvivo.feb.es/equipo/979920"
  },
  "Hestia Menorca::Primera FEB": {
    "official_url": "https://baloncestoenvivo.feb.es/equipo/981300"
  },
  "HLA Alicante::Primera FEB": {
    "official_url": "https://baloncestoenvivo.feb.es/equipo/979989"
  },
  "Inveready Gipuzkoa::Primera FEB": {
    "official_url": "https://baloncestoenvivo.feb.es/equipo/981203"
  },
  "Melilla Ciudad Del Deporte::Primera FEB": {
    "official_url": "https://baloncestoenvivo.feb.es/equipo/979769"
  },
  "Monbus Obradoiro::Primera FEB": {
    "official_url": "https://baloncestoenvivo.feb.es/equipo/981421"
  },
  "Movistar Estudiantes::Primera FEB": {
    "official_url": "https://baloncestoenvivo.feb.es/equipo/981431"
  },
  "Palencia Baloncesto::Primera FEB": {
    "official_url": "https://baloncestoenvivo.feb.es/equipo/981343"
  },
  "Palmer Basket Mallorca Palma::Primera FEB": {
    "official_url": "https://baloncestoenvivo.feb.es/equipo/981215"
  },
  "Real Betis Baloncesto::Primera FEB": {
    "official_url": "https://baloncestoenvivo.feb.es/equipo/950951"
  },
  "UEMC Real Valladolid::Primera FEB": {
    "official_url": "https://baloncestoenvivo.feb.es/equipo/952032"
  },
  "Bochas Sport Club::Liga Femenina": {
    "official_url": "https://www.laliganacional.com.ar/lfb/club/bochas"
  },
  "Chañares de James Craik::Liga Femenina": {
    "official_url": "https://www.laliganacional.com.ar/lfb/club/chanares"
  },
  "Deportivo Berazategui::Liga Femenina": {
    "official_url": "https://www.laliganacional.com.ar/lfb/club/berazategui"
  },
  "El Biguá::Liga Femenina": {
    "official_url": "https://www.laliganacional.com.ar/lfb/club/el-bigua"
  },
  "El Talar::Liga Femenina": {
    "official_url": "https://www.laliganacional.com.ar/lfb/club/eltalar"
  },
  "Ferro Carril Oeste::Liga Femenina": {
    "official_url": "https://www.laliganacional.com.ar/lfb/club/ferro-carril-oeste"
  },
  "Gorriones de Río Cuarto::Liga Femenina": {
    "official_url": "https://www.laliganacional.com.ar/lfb/club/gorriones"
  },
  "Hindú (C)::Liga Femenina": {
    "official_url": "https://www.laliganacional.com.ar/lfb/club/hindu-cordoba"
  },
  "Independiente (N)::Liga Femenina": {
    "official_url": "https://www.laliganacional.com.ar/lfb/club/independiente-neuquen"
  },
  "Instituto de Córdoba::Liga Femenina": {
    "official_url": "https://www.laliganacional.com.ar/lfb/club/instituto"
  },
  "Lanús::Liga Femenina": {
    "official_url": "https://www.laliganacional.com.ar/lfb/club/lanus"
  },
  "Náutico (R)::Liga Femenina": {
    "official_url": "https://www.laliganacional.com.ar/lfb/club/nautico"
  },
  "Obras::Liga Femenina": {
    "official_url": "https://www.laliganacional.com.ar/lfb/club/obras"
  },
  "Quimsa::Liga Femenina": {
    "official_url": "https://www.laliganacional.com.ar/lfb/club/quimsa"
  },
  "Riachuelo::Liga Femenina": {
    "official_url": "https://www.laliganacional.com.ar/lfb/club/riachuelo"
  },
  "San José de Mendoza::Liga Femenina": {
    "official_url": "https://www.laliganacional.com.ar/lfb/club/san-jose"
  },
  "Tomás de Rocamora::Liga Femenina": {
    "official_url": "https://www.laliganacional.com.ar/lfb/club/rocamora"
  },
  "Union deportiva San jose::Liga Femenina": {
    "official_url": "https://www.laliganacional.com.ar/lfb/club/san-jose"
  },
  "Unión Florida::Liga Femenina": {
    "official_url": "https://www.laliganacional.com.ar/lfb/club/union-florida"
  },
  "Azul y Rojo::LNF Chile": {
    "official_url": "https://lnbchile.com/competitions/lnb1/teams/197694"
  },
  "Colegio Los Leones::LNF Chile": {
    "official_url": "https://lnbchile.com/competitions/lnb1/teams/23015"
  },
  "Gimnástico::LNF Chile": {
    "official_url": "https://lnbchile.com/competitions/lnb1/teams/35925"
  },
  "Puente Alto::LNF Chile": {
    "official_url": "https://lnbchile.com/competitions/lnb1/teams/69206"
  },
  "Santiago Morning Quilicura::LNF Chile": {
    "official_url": "https://lnbchile.com/competitions/lnb1/teams/86187"
  },
  "Sergio Ceppi::LNF Chile": {
    "official_url": "https://lnbchile.com/competitions/lnb1/teams/29499"
  },
  "Sportivo Italiano::LNF Chile": {
    "official_url": "https://lnbchile.com/competitions/lnb1/teams/29501"
  },
  "Universidad de Concepción::LNF Chile": {
    "official_url": "https://lnbchile.com/competitions/lnb1/teams/23013"
  },
  "Barcelona Sporting Club::LDA": {
    "official_url": "https://ligabasquetpro.com/barcelona/"
  },
  "Cuenca::LDA": {
    "official_url": "https://ligabasquetpro.com/cuenca-basket-club/"
  },
  "Guerreros::LDA": {
    "official_url": "https://ligabasquetpro.com/guerreros/"
  },
  "Importadora Alvarado::LDA": {
    "official_url": "https://ligabasquetpro.com/importadora-alvarado/"
  },
  "Jorge Guzmán::LDA": {
    "official_url": "https://ligabasquetpro.com/jorge-guzman/"
  },
  "Leones de Riobamba::LDA": {
    "official_url": "https://ligabasquetpro.com/leones/"
  },
  "Piratas de los Lagos::LDA": {
    "official_url": "https://ligabasquetpro.com/piratas-de-los-lagos/"
  },
  "San Antonio::LDA": {
    "official_url": "https://ligabasquetpro.com/san-antonio-gold/"
  },
  "Spartans::LDA": {
    "official_url": "https://ligabasquetpro.com/spartans-sg/"
  },
  "Zamora::LDA": {
    "official_url": "https://ligabasquetpro.com/zamora-jaguars/"
  },
  "Atuneros del Pacífico::Liga Ecuador Fem": {
    "official_url": "https://ligabasquetpro.com/atuneros-del-pacifico/"
  },
  "Cuenca::Liga Ecuador Fem": {
    "official_url": "https://ligabasquetpro.com/cuenca-basket-club/"
  },
  "Dragonas Importadora Alvarado::Liga Ecuador Fem": {
    "official_url": "https://ligabasquetpro.com/importadora-alvarado/"
  },
  "Jorge Guzmán::Liga Ecuador Fem": {
    "official_url": "https://ligabasquetpro.com/jorge-guzman/"
  },
  "Piratas de los Lagos::Liga Ecuador Fem": {
    "official_url": "https://ligabasquetpro.com/piratas-de-los-lagos/"
  },
  "San Antonio Gold::Liga Ecuador Fem": {
    "official_url": "https://ligabasquetpro.com/san-antonio-gold/"
  },
  "Spartans::Liga Ecuador Fem": {
    "official_url": "https://ligabasquetpro.com/spartans-sg/"
  },
  "Amara Lleida::Liga U22": {
    "official_url": "https://www.acb.com/es/liga/equipos/hiopos-lleida-658"
  },
  "Basquet Girona::Liga U22": {
    "official_url": "https://acb.com/es/liga/equipos/basquet-girona-591"
  },
  "BAXI Manresa::Liga U22": {
    "official_url": "https://acb.com/es/liga/equipos/baxi-manresa-10"
  },
  "Bilbao Basket::Liga U22": {
    "official_url": "https://acb.com/es/liga/equipos/surne-bilbao-4"
  },
  "Casademont Zaragoza::Liga U22": {
    "official_url": "https://acb.com/es/liga/equipos/casademont-zaragoza-16"
  },
  "FC Barcelona::Liga U22": {
    "official_url": "https://acb.com/es/liga/equipos/barca-2"
  },
  "Fundación CB Canarias::Liga U22": {
    "official_url": "https://acb.com/es/liga/equipos/la-laguna-tenerife-28"
  },
  "Gran Canaria::Liga U22": {
    "official_url": "https://acb.com/es/liga/equipos/dreamland-gran-canaria-5"
  },
  "Joventut Badalona::Liga U22": {
    "official_url": "https://acb.com/es/liga/equipos/asisa-joventut-8"
  },
  "La Laguna Tenerife::Liga U22": {
    "official_url": "https://acb.com/es/liga/equipos/la-laguna-tenerife-28"
  },
  "Real Madrid::Liga U22": {
    "official_url": "https://www.acb.com/es/liga/equipos/real-madrid-9"
  },
  "San Pablo Burgos::Liga U22": {
    "official_url": "https://acb.com/es/liga/equipos/recoletas-salud-san-pablo-burgos-549"
  },
  "Stellantis & You Granada::Liga U22": {
    "official_url": "https://acb.com/es/liga/equipos/coviran-granada-592"
  },
  "UCAM Murcia::Liga U22": {
    "official_url": "https://www.acb.com/es/liga/equipos/ucam-murcia-12"
  },
  "Unicaja::Liga U22": {
    "official_url": "https://www.acb.com/es/liga/equipos/unicaja-14"
  },
  "Valencia Basket::Liga U22": {
    "official_url": "https://acb.com/es/liga/equipos/valencia-basket-13"
  },
  "Zamora::Liga U22": {
    "display_name": "CB Zamora",
    "website": "https://cbzamora.com/",
    "instagram": "https://www.instagram.com/cb.zamora/",
    "stadium": "Pabellón Ángel Nieto"
  }
};
