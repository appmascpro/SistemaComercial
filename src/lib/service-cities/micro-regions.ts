/**
 * Micro-regiões de atuação comercial (SP).
 * expansionPriority segue a ordem estratégica de expansão (1 = foco atual).
 */

export interface MicroRegion {
  slug: string;
  name: string;
  expansionPriority: number;
  cities: string[];
}

export const MICRO_REGIONS: MicroRegion[] = [
  {
    slug: "marilia",
    name: "Base Marília e entorno direto",
    expansionPriority: 1,
    cities: [
      "Marília",
      "Vera Cruz",
      "Garça",
      "Oriente",
      "Pompéia",
      "Quintana",
      "Herculândia",
      "Tupã",
      "Álvaro de Carvalho",
      "Alvinlândia",
      "Lupércio",
      "Ocauçu",
      "Gália",
      "Fernão",
      "Júlio Mesquita",
      "Ubirajara",
      "Duartina",
    ],
  },
  {
    slug: "tupa-assis-ourinhos",
    name: "Eixo Tupã, Assis e Ourinhos",
    expansionPriority: 3,
    cities: [
      "Tupã",
      "Bastos",
      "Iacri",
      "Queiroz",
      "Parapuã",
      "Osvaldo Cruz",
      "Adamantina",
      "Lucélia",
      "Inúbia Paulista",
      "Salmourão",
      "Sagres",
      "Pracinha",
      "Rinópolis",
      "Assis",
      "Cândido Mota",
      "Palmital",
      "Paraguaçu Paulista",
      "Maracaí",
      "Pedrinhas Paulista",
      "Ourinhos",
      "Chavantes",
      "Santa Cruz do Rio Pardo",
      "Ipaussu",
      "Bernardino de Campos",
      "Piraju",
    ],
  },
  {
    slug: "bauru-jau-botucatu",
    name: "Eixo Bauru, Jaú e Botucatu",
    expansionPriority: 2,
    cities: [
      "Bauru",
      "Agudos",
      "Piratininga",
      "Arealva",
      "Iacanga",
      "Reginópolis",
      "Pongaí",
      "Balbinos",
      "Pirajuí",
      "Presidente Alves",
      "Cabrália Paulista",
      "Duartina",
      "Pederneiras",
      "Macatuba",
      "Lençóis Paulista",
      "Jaú",
      "Dois Córregos",
      "Barra Bonita",
      "Mineiros do Tietê",
      "Brotas",
      "Torrinha",
      "Botucatu",
      "São Manuel",
      "Pratânia",
      "Areiópolis",
      "Igaraçu do Tietê",
      "Bocaina",
      "Boracéia",
    ],
  },
  {
    slug: "presidente-prudente",
    name: "Eixo Presidente Prudente e Oeste Paulista",
    expansionPriority: 5,
    cities: [
      "Presidente Prudente",
      "Presidente Venceslau",
      "Presidente Epitácio",
      "Presidente Bernardes",
      "Álvares Machado",
      "Regente Feijó",
      "Martinópolis",
      "Rancharia",
      "Indiana",
      "Santo Expedito",
      "Pirapozinho",
      "Tarabai",
      "Teodoro Sampaio",
      "Euclides da Cunha Paulista",
      "Mirante do Paranapanema",
      "Rosana",
      "Caiuá",
      "Marabá Paulista",
      "Santo Anastácio",
      "Piquerobi",
      "Ribeirão dos Índios",
      "Emilianópolis",
      "Caiabu",
      "Narandiba",
      "Sandovalina",
    ],
  },
  {
    slug: "dracena-adamantina",
    name: "Eixo Dracena, Adamantina e Alta Paulista",
    expansionPriority: 5,
    cities: [
      "Dracena",
      "Junqueirópolis",
      "Tupi Paulista",
      "Ouro Verde",
      "Flórida Paulista",
      "Pacaembu",
      "Irapuru",
      "Panorama",
      "Paulicéia",
      "Santa Mercedes",
      "Nova Guataporanga",
      "Monte Castelo",
      "São João do Pau d'Alho",
    ],
  },
  {
    slug: "aracatuba-birigui",
    name: "Eixo Araçatuba, Birigui e Andradina",
    expansionPriority: 4,
    cities: [
      "Araçatuba",
      "Birigui",
      "Penápolis",
      "Guararapes",
      "Valparaíso",
      "Mirandópolis",
      "Lavínia",
      "Bento de Abreu",
      "Rubiácea",
      "Guaraçaí",
      "Andradina",
      "Castilho",
      "Ilha Solteira",
      "Pereira Barreto",
      "Sud Mennucci",
      "Suzanápolis",
      "Murutinga do Sul",
      "Nova Independência",
      "Buritama",
      "Bilac",
      "Gabriel Monteiro",
      "Piacatu",
      "Santópolis do Aguapeí",
      "Clementina",
      "Luiziânia",
      "Alto Alegre",
      "Avanhandava",
      "Barbosa",
      "Glicério",
    ],
  },
  {
    slug: "sao-jose-rio-preto",
    name: "Eixo São José do Rio Preto",
    expansionPriority: 6,
    cities: [
      "São José do Rio Preto",
      "Mirassol",
      "Bady Bassitt",
      "Cedral",
      "Uchoa",
      "Catanduva",
      "Novais",
      "Pindorama",
      "Santa Adélia",
      "Ariranha",
      "Paraíso",
      "Itajobi",
      "Novo Horizonte",
      "Sales",
      "Irapuã",
      "Urupês",
      "Ibirá",
      "José Bonifácio",
      "Mendonça",
      "Nipoã",
      "Poloni",
      "Monte Aprazível",
      "Neves Paulista",
      "Tanabi",
      "Mirassolândia",
      "Guapiaçu",
      "Onda Verde",
      "Ipiguá",
      "Bálsamo",
      "Votuporanga",
      "Cosmorama",
      "Álvares Florence",
      "Américo de Campos",
      "Cardoso",
      "Pontes Gestal",
      "Valentim Gentil",
      "Fernandópolis",
      "Jales",
      "Santa Fé do Sul",
      "Estrela d'Oeste",
      "General Salgado",
      "Auriflama",
      "Floreal",
      "Magda",
      "Nhandeara",
      "Macaubal",
      "Sebastianópolis do Sul",
      "Monções",
      "Gastão Vidigal",
      "União Paulista",
      "Planalto",
      "Buritama",
    ],
  },
  {
    slug: "barretos-bebedouro",
    name: "Eixo Barretos, Bebedouro e Olímpia",
    expansionPriority: 7,
    cities: [
      "Barretos",
      "Bebedouro",
      "Olímpia",
      "Colina",
      "Jaborandi",
      "Terra Roxa",
      "Viradouro",
      "Severínia",
      "Cajobi",
      "Monte Azul Paulista",
      "Pirangi",
      "Taiaçu",
      "Taiúva",
      "Vista Alegre do Alto",
      "Guaraci",
      "Altair",
      "Colômbia",
      "Guaíra",
      "Orindiúva",
      "Paulo de Faria",
      "Icém",
    ],
  },
  {
    slug: "ribeirao-preto",
    name: "Eixo Ribeirão Preto",
    expansionPriority: 7,
    cities: [
      "Ribeirão Preto",
      "Sertãozinho",
      "Jaboticabal",
      "Pitangueiras",
      "Pontal",
      "Barrinha",
      "Pradópolis",
      "Dumont",
      "Guatapará",
      "Cravinhos",
      "Serrana",
      "Serra Azul",
      "Santa Rosa de Viterbo",
      "São Simão",
      "Luís Antônio",
      "Santa Rita do Passa Quatro",
      "Cajuru",
      "Altinópolis",
      "Batatais",
      "Brodowski",
      "Jardinópolis",
      "Santo Antônio da Alegria",
    ],
  },
  {
    slug: "franca",
    name: "Eixo Franca",
    expansionPriority: 7,
    cities: [
      "Franca",
      "Patrocínio Paulista",
      "Restinga",
      "Cristais Paulista",
      "Pedregulho",
      "Rifaina",
      "Jeriquara",
      "Itirapuã",
      "Ribeirão Corrente",
      "São José da Bela Vista",
      "Guará",
      "Ituverava",
      "Miguelópolis",
      "Igarapava",
      "Aramina",
      "Buritizal",
      "Orlândia",
      "Nuporanga",
      "Morro Agudo",
      "São Joaquim da Barra",
      "Sales Oliveira",
    ],
  },
  {
    slug: "araraquara-sao-carlos",
    name: "Eixo Araraquara, São Carlos e Central",
    expansionPriority: 8,
    cities: [
      "Araraquara",
      "São Carlos",
      "Matão",
      "Américo Brasiliense",
      "Santa Lúcia",
      "Rincão",
      "Motuca",
      "Gavião Peixoto",
      "Boa Esperança do Sul",
      "Trabiju",
      "Dourado",
      "Ribeirão Bonito",
      "Ibaté",
      "Descalvado",
      "Porto Ferreira",
      "Santa Rita do Passa Quatro",
      "Analândia",
      "Itirapina",
      "Ibitinga",
      "Itápolis",
      "Tabatinga",
      "Nova Europa",
      "Borborema",
      "Itaju",
    ],
  },
  {
    slug: "avare-itapeva",
    name: "Eixo Avaré, Botucatu e Itapeva",
    expansionPriority: 9,
    cities: [
      "Avaré",
      "Cerqueira César",
      "Águas de Santa Bárbara",
      "Iaras",
      "Itatinga",
      "Pardinho",
      "Itapeva",
      "Itaberá",
      "Itararé",
      "Itaporanga",
      "Barão de Antonina",
      "Taquarituba",
      "Coronel Macedo",
      "Fartura",
      "Sarutaiá",
      "Tejupá",
      "Taguaí",
      "Buri",
      "Capão Bonito",
      "Ribeirão Branco",
      "Guapiara",
      "Ribeirão Grande",
    ],
  },
  {
    slug: "borda-campinas",
    name: "Borda Campinas / Piracicaba / Sorocaba",
    expansionPriority: 10,
    cities: [
      "Piracicaba",
      "Rio Claro",
      "Limeira",
      "Americana",
      "Santa Bárbara d'Oeste",
      "Pirassununga",
      "Leme",
      "Araras",
      "Conchal",
      "Tatuí",
      "Itapetininga",
      "Capela do Alto",
      "Alambari",
      "Angatuba",
      "Guareí",
      "Porangaba",
      "Torre de Pedra",
      "Quadra",
      "Cesário Lange",
      "Pereiras",
      "Conchas",
      "Anhembi",
      "Bofete",
    ],
  },
];

/** Cidade → micro-região (prioridade menor vence em duplicatas). */
const cityRegionMap = buildCityRegionMap();

function buildCityRegionMap(): Map<string, MicroRegion> {
  const sorted = [...MICRO_REGIONS].sort(
    (a, b) => a.expansionPriority - b.expansionPriority
  );
  const map = new Map<string, MicroRegion>();

  for (const region of sorted) {
    for (const city of region.cities) {
      if (!map.has(city)) {
        map.set(city, region);
      }
    }
  }

  return map;
}

export function getMicroRegionBySlug(slug: string): MicroRegion | undefined {
  return MICRO_REGIONS.find((r) => r.slug === slug);
}

export function getMicroRegionForCity(city: string): MicroRegion | undefined {
  return cityRegionMap.get(city);
}

export function getMicroRegionsOrdered(): MicroRegion[] {
  return [...MICRO_REGIONS].sort((a, b) => {
    if (a.expansionPriority !== b.expansionPriority) {
      return a.expansionPriority - b.expansionPriority;
    }
    return a.name.localeCompare(b.name, "pt-BR");
  });
}

export interface ServiceCityEntry {
  city: string;
  state: string;
  region: string;
  regionName: string;
  expansionPriority: number;
}

export function getAllServiceCityEntries(): ServiceCityEntry[] {
  return [...cityRegionMap.entries()]
    .map(([city, region]) => ({
      city,
      state: "SP",
      region: region.slug,
      regionName: region.name,
      expansionPriority: region.expansionPriority,
    }))
    .sort((a, b) => {
      if (a.expansionPriority !== b.expansionPriority) {
        return a.expansionPriority - b.expansionPriority;
      }
      return a.city.localeCompare(b.city, "pt-BR");
    });
}

export function getCitiesForMicroRegion(slug: string): string[] {
  const region = getMicroRegionBySlug(slug);
  if (!region) return [];
  return [...region.cities].sort((a, b) => a.localeCompare(b, "pt-BR"));
}
