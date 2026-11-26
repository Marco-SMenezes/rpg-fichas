// Glossário inglês → português do bestiário, com os termos do Livro do Jogador usados no Tomo.
// pretraduzir() traduz tudo o que é estruturado ou fórmula fixa; o resto (prosa e nomes)
// vai para o mapa de tradução de cada lote (ver pendentes.mjs e aplicar.mjs).

export const TAMANHO = {
  Tiny: "Miúdo",
  Small: "Pequeno",
  Medium: "Médio",
  Large: "Grande",
  Huge: "Enorme",
  Gargantuan: "Imenso",
};
export const TIPO = {
  Beast: "Besta",
  Dragon: "Dragão",
  Humanoid: "Humanoide",
  Monstrosity: "Monstruosidade",
  Fiend: "Corruptor",
  Undead: "Morto-vivo",
  Elemental: "Elemental",
  Giant: "Gigante",
  Construct: "Constructo",
  Plant: "Planta",
  Fey: "Fada",
  Celestial: "Celestial",
  Aberration: "Aberração",
  Ooze: "Limo",
};
export const SUBTIPO = {
  "any race": "qualquer raça",
  devil: "diabo",
  Swarm: "enxame",
  demon: "demônio",
  human: "humano",
  shapechanger: "metamorfo",
  goblinoid: "goblinoide",
  titan: "titã",
  gnome: "gnomo",
  elf: "elfo",
  dwarf: "anão",
  gnoll: "gnoll",
  grimlock: "grimlock",
  kobold: "kobold",
  lizardfolk: "povo-lagarto",
  merfolk: "povo do mar",
  orc: "orc",
  sahuagin: "sahuagin",
};
export const TENDENCIA = {
  unaligned: "sem tendência",
  "chaotic evil": "caótico e mau",
  "lawful evil": "leal e mau",
  "neutral evil": "neutro e mau",
  "lawful good": "leal e bom",
  neutral: "neutro",
  "any alignment": "qualquer tendência",
  "chaotic good": "caótico e bom",
  "neutral good": "neutro e bom",
  "any non-good alignment": "qualquer tendência não boa",
  "lawful neutral": "leal e neutro",
  "chaotic neutral": "caótico e neutro",
  "any non-lawful alignment": "qualquer tendência não leal",
  "any chaotic alignment": "qualquer tendência caótica",
  "neutral good (50%) or neutral evil (50%)":
    "neutro e bom (50%) ou neutro e mau (50%)",
  "any evil alignment": "qualquer tendência má",
};
export const PERICIA = {
  acrobatics: "Acrobacia",
  "animal handling": "Adestrar Animais",
  arcana: "Arcanismo",
  athletics: "Atletismo",
  performance: "Atuação",
  deception: "Enganação",
  stealth: "Furtividade",
  history: "História",
  intimidation: "Intimidação",
  insight: "Intuição",
  investigation: "Investigação",
  medicine: "Medicina",
  nature: "Natureza",
  perception: "Percepção",
  persuasion: "Persuasão",
  "sleight of hand": "Prestidigitação",
  religion: "Religião",
  survival: "Sobrevivência",
};
export const DANO = {
  acid: "ácido",
  bludgeoning: "concussão",
  cold: "frio",
  fire: "fogo",
  force: "energia",
  lightning: "elétrico",
  necrotic: "necrótico",
  piercing: "perfurante",
  poison: "veneno",
  psychic: "psíquico",
  radiant: "radiante",
  slashing: "cortante",
  thunder: "trovejante",
};
export const CONDICAO = {
  blinded: "cego",
  charmed: "enfeitiçado",
  deafened: "surdo",
  exhaustion: "exaustão",
  frightened: "amedrontado",
  grappled: "agarrado",
  incapacitated: "incapacitado",
  invisible: "invisível",
  paralyzed: "paralisado",
  petrified: "petrificado",
  poisoned: "envenenado",
  prone: "caído",
  restrained: "impedido",
  stunned: "atordoado",
  unconscious: "inconsciente",
};
export const ATRIBUTO = {
  Strength: "Força",
  Dexterity: "Destreza",
  Constitution: "Constituição",
  Intelligence: "Inteligência",
  Wisdom: "Sabedoria",
  Charisma: "Carisma",
};
export const IDIOMA = {
  Common: "Comum",
  Draconic: "Dracônico",
  Abyssal: "Abissal",
  Infernal: "Infernal",
  Giant: "Gigante",
  Elvish: "Élfico",
  Ignan: "Ignan",
  Sylvan: "Silvestre",
  Aquan: "Aquan",
  Undercommon: "Subcomum",
  Terran: "Terran",
  Auran: "Auran",
  Goblin: "Goblin",
  Celestial: "Celestial",
  "Deep Speech": "Dialeto Subterrâneo",
  Sphinx: "Esfinge",
  Orc: "Orc",
  Gnomish: "Gnômico",
  Dwarvish: "Anão",
  Primordial: "Primordial",
  Druidic: "Druídico",
  "Thieves' cant": "Gíria dos Ladrões",
  Gnoll: "Gnoll",
  Otyugh: "Otyugh",
  Sahuagin: "Sahuagin",
  "Blink Dog": "Cão Intermitente",
  "Giant Eagle": "Águia Gigante",
  "Giant Elk": "Alce Gigante",
  "Giant Owl": "Coruja Gigante",
};
const ARMADURA = {
  "natural armor": "armadura natural",
  "leather armor": "armadura de couro",
  "hide armor": "armadura de peles",
  plate: "armadura de placas",
  "studded leather": "couro batido",
  "chain shirt": "camisão de malha",
  shield: "escudo",
  "scale mail": "brunea",
  "patchwork armor": "armadura remendada",
  "chain mail": "cota de malha",
  breastplate: "peitoral",
  "armor scraps": "restos de armadura",
  splint: "cota de talas",
  "barding scraps": "restos de barda",
};

/** Pés → metros (5 pés = 1,5 m), com vírgula decimal. */
export function metros(pes) {
  const m = Math.round(Number(pes) * 0.3 * 10) / 10;
  return String(m).replace(".", ",");
}

const lista = (s, mapa) =>
  s
    .split(/,\s*(?:and\s+)?|\s+and\s+/)
    .map((p) => mapa[p.trim()] ?? p.trim())
    .join(", ");

export function traduzirDanos(s) {
  if (!s) return "";
  return s
    .split(";")
    .map((parte) => {
      let p = parte.trim();
      const sufixos = [
        [
          / from nonmagical attacks not made with silvered weapons$/,
          " de ataques não mágicos que não sejam de armas prateadas",
        ],
        [
          / from nonmagical attacks not made with adamantine weapons$/,
          " de ataques não mágicos que não sejam de armas de adamante",
        ],
        [/ from nonmagical attacks$/, " de ataques não mágicos"],
      ];
      let fim = "";
      for (const [re, pt] of sufixos)
        if (re.test(p)) {
          p = p.replace(re, "");
          fim = pt;
          break;
        }
      if (p === "damage from spells") return "dano de magias";
      if (p === "bludgeoning, piercing, and slashing from nonmagical/nonsilver weapons")
        return "concussão, perfurante e cortante de armas não mágicas e não prateadas";
      if (p === "piercing from magic weapons wielded by good creatures")
        return "perfurante de armas mágicas empunhadas por criaturas boas";
      if (
        /^non magical bludgeoning, piercing, and slashing \(from stoneskin\)$/.test(
          p,
        )
      )
        return "concussão, perfurante e cortante não mágicos (de pele de pedra)";
      const itens = p
        .split(/,\s*(?:and\s+)?|\s+and\s+/)
        .map((x) => DANO[x.trim()] ?? x.trim());
      const juntos =
        itens.length > 1
          ? `${itens.slice(0, -1).join(", ")} e ${itens.at(-1)}`
          : itens[0];
      return juntos + fim;
    })
    .join("; ");
}

export const traduzirCondicoes = (s) => (s ? lista(s, CONDICAO) : "");

export function traduzirSentidos(s) {
  return (s ?? "")
    .replace(/passive Perception (\d+)/g, "Percepção passiva $1")
    .replace(/darkvision/g, "visão no escuro")
    .replace(/blindsight/g, "percepção às cegas")
    .replace(/truesight/g, "visão verdadeira")
    .replace(/tremorsense/g, "sentido sísmico")
    .replace(/\(blind beyond this radius\)/g, "(cego além desse raio)")
    .replace(
      / or (\d+) ft\. while deafened/g,
      (_, n) => ` ou ${metros(n)} m quando surdo`,
    )
    .replace(/\(rat form only\)/g, "(só na forma de rato)")
    .replace(/(\d+) ft\./g, (_, n) => `${metros(n)} m`);
}

export function traduzirIdiomas(s) {
  if (!s) return "";
  const especiais = [
    [
      /^any one language \(usually Common\)$/,
      "um idioma qualquer (geralmente Comum)",
    ],
    [/^the languages it knew in life$/, "os idiomas que sabia em vida"],
    [/^any languages it knew in life$/, "os idiomas que sabia em vida"],
    [
      /^one language known by its creator$/,
      "um idioma conhecido por seu criador",
    ],
    [
      /^any (two|four|six) languages$/,
      (_, n) =>
        `quaisquer ${{ two: "dois", four: "quatro", six: "seis" }[n]} idiomas`,
    ],
    [/^all$/, "todos"],
    [
      /^Common plus up to five other languages$/,
      "Comum e até cinco outros idiomas",
    ],
    [
      /^(.+) plus any two languages$/,
      (_, x) => `${IDIOMA[x] ?? x} e quaisquer dois idiomas`,
    ],
    [
      /^telepathy (\d+) ft\.(.*)$/,
      (_, n, resto) =>
        `telepatia ${metros(n)} m${resto.replace(" (works only with creatures that understand Abyssal)", " (só com criaturas que entendem Abissal)")}`,
    ],
    [
      /^understands the languages of its creator but can't speak$/,
      "entende os idiomas de seu criador, mas não fala",
    ],
    [
      /^understands the languages it knew in life but can't speak$/,
      "entende os idiomas que sabia em vida, mas não fala",
    ],
  ];
  const partes = s.split(/,\s*/);
  return partes
    .map((p) => {
      const t = p.trim();
      for (const [re, pt] of especiais)
        if (re.test(t)) return t.replace(re, pt);
      const entende = t.match(
        /^(?:understands )?(.+?)(?: but (?:can't|doesn't) speak(?: it)?)?$/,
      );
      const nomes = (entende?.[1] ?? t)
        .replace(/^and /, "")
        .split(/ and /)
        .map(
          (n) =>
            IDIOMA[n.trim()] ??
            IDIOMA[n.trim()[0].toUpperCase() + n.trim().slice(1)] ??
            n.trim(),
        );
      let r = nomes.join(" e ");
      if (t.startsWith("understands ")) r = `entende ${r}`;
      if (/but (?:can't|doesn't) speak/.test(t)) r += ", mas não fala";
      if (t.startsWith("and ")) r = `e ${r}`;
      return r;
    })
    .join(", ");
}

export function traduzirArmadura(s) {
  if (!s) return "";
  if (ARMADURA[s]) return ARMADURA[s];
  return s
    .replace(/_mage armor_/g, "_armadura arcana_")
    .replace(/_barkskin_/g, "_pele de árvore_")
    .replace(/ with /g, " com ")
    .replace(/\(natural armor\)/g, "(armadura natural)")
    .replace(/ while prone/g, " quando caído")
    .replace(/ in humanoid form/g, " na forma humanoide")
    .replace(
      / in (bear|boar|wolf) (and|or) hybrid form/g,
      (_, b, e) =>
        ` na forma de ${{ bear: "urso", boar: "javali", wolf: "lobo" }[b]} ${e === "and" ? "e" : "ou"} híbrida`,
    )
    .split(", ")
    .map((p) => ARMADURA[p] ?? p)
    .join(", ");
}

export function traduzirDeslocamento(v) {
  const partes = [];
  const nomes = {
    fly: "voo",
    swim: "natação",
    climb: "escalada",
    burrow: "escavação",
  };
  if (v.walk !== undefined) partes.push(`${metros(v.walk)} m`);
  for (const k of ["burrow", "climb", "fly", "swim"])
    if (v[k])
      partes.push(
        `${nomes[k]} ${metros(v[k])} m${k === "fly" && v.hover ? " (pairar)" : ""}`,
      );
  let r = partes.join(", ");
  if (v.notes)
    r += ` (${v.notes
      .replace(/(\d+) ft\./g, (_, n) => `${metros(n)} m`)
      .replace(/climb/g, "escalada")
      .replace(
        / in (bear|boar|tiger|wolf) form/g,
        (_, b) =>
          ` na forma de ${{ bear: "urso", boar: "javali", tiger: "tigre", wolf: "lobo" }[b]}`,
      )
      .replace(/ in bear or hybrid form/g, " na forma de urso ou híbrida")
      .replace(/ or hybrid form/g, " ou híbrida")})`;
  return r;
}

const DANO_RE = Object.keys(DANO).join("|");
/** "dano cortante", "dano de fogo"… como no Livro do Jogador. */
export const DANO_FRASE = {
  acid: "de ácido",
  bludgeoning: "de concussão",
  cold: "de frio",
  fire: "de fogo",
  force: "de energia",
  lightning: "elétrico",
  necrotic: "necrótico",
  piercing: "perfurante",
  poison: "de veneno",
  psychic: "psíquico",
  radiant: "radiante",
  slashing: "cortante",
  thunder: "trovejante",
};
const ATR_RE = Object.keys(ATRIBUTO).join("|");

/** Fórmulas fixas dos blocos de estatísticas. A prosa que sobra fica para o mapa do lote. */
export function traduzirFrases(t) {
  if (!t) return t;
  return t
    .replace(
      /Melee or Ranged Weapon Attack:/g,
      "Ataque Corpo a Corpo ou à Distância com Arma:",
    )
    .replace(/Melee Weapon Attack:/g, "Ataque Corpo a Corpo com Arma:")
    .replace(/Ranged Weapon Attack:/g, "Ataque à Distância com Arma:")
    .replace(/Melee Spell Attack:/g, "Ataque Corpo a Corpo com Magia:")
    .replace(/Ranged Spell Attack:/g, "Ataque à Distância com Magia:")
    .replace(/\+(\d+) to hit/g, "+$1 para acertar")
    .replace(
      /reach (\d+) ft\. or range (\d+)\/(\d+) ft\./g,
      (_, a, b, c) =>
        `alcance ${metros(a)} m ou distância ${metros(b)}/${metros(c)} m`,
    )
    .replace(/reach (\d+) ft\./g, (_, a) => `alcance ${metros(a)} m`)
    .replace(
      /range (\d+)\/(\d+) ft\./g,
      (_, b, c) => `distância ${metros(b)}/${metros(c)} m`,
    )
    .replace(/range (\d+) ft\./g, (_, b) => `distância ${metros(b)} m`)
    .replace(/\bone target\./g, "um alvo.")
    .replace(/\bone creature\./g, "uma criatura.")
    .replace(/_?Hit:_? /g, "Acerto: ")
    .replace(
      new RegExp(`(\\d+) \\(([^)]+)\\) (${DANO_RE}) damage`, "g"),
      (_, n, d, tipo) => `${n} (${d}) de dano ${DANO_FRASE[tipo]}`,
    )
    .replace(
      new RegExp(`(\\d+) (${DANO_RE}) damage`, "g"),
      (_, n, tipo) => `${n} de dano ${DANO_FRASE[tipo]}`,
    )
    .replace(/, plus /g, ", mais ")
    .replace(/ plus (\d+ \()/g, " mais $1")
    .replace(
      new RegExp(`DC (\\d+) (${ATR_RE}) saving throw`, "g"),
      (_, n, a) => `teste de resistência de ${ATRIBUTO[a]} CD ${n}`,
    )
    .replace(/\(Recharge (\d)[–-](\d)\)/g, "(Recarga $1–$2)")
    .replace(/\(Recharge (\d)\)/g, "(Recarga $1)")
    .replace(
      /\(Recharges after a Short or Long Rest\)/g,
      "(Recarrega após um Descanso Curto ou Longo)",
    )
    .replace(/\(Costs (\d) Actions\)/g, "(Custa $1 Ações)")
    .replace(/\((\d)\/Day\)/g, "($1/Dia)")
    .replace(/(\d+)(?:-\s*| )foot/g, (_, n) => `${metros(n)} metros`)
    .replace(/(\d+) feet/g, (_, n) => `${metros(n)} metros`)
    .replace(/(\d+) ft\./g, (_, n) => `${metros(n)} m`);
}

const NOMES_FIXOS = {
  Multiattack: "Ataques Múltiplos",
  Bite: "Mordida",
  Claw: "Garra",
  Claws: "Garras",
  Tail: "Cauda",
  Slam: "Pancada",
  Gore: "Chifrada",
  Hooves: "Cascos",
  Tentacle: "Tentáculo",
  Tentacles: "Tentáculos",
  Sting: "Ferrão",
  Talons: "Garras",
  Beak: "Bico",
  Fist: "Punho",
  Dagger: "Adaga",
  Shortsword: "Espada Curta",
  Longsword: "Espada Longa",
  Greatsword: "Espada Grande",
  Scimitar: "Cimitarra",
  Shortbow: "Arco Curto",
  Longbow: "Arco Longo",
  "Light Crossbow": "Besta Leve",
  "Heavy Crossbow": "Besta Pesada",
  Spear: "Lança",
  Javelin: "Azagaia",
  Greataxe: "Machado Grande",
  Handaxe: "Machadinha",
  Battleaxe: "Machado de Batalha",
  Greatclub: "Clava Grande",
  Club: "Clava",
  Mace: "Maça",
  Morningstar: "Maça Estrela",
  Warhammer: "Martelo de Guerra",
  Maul: "Marreta",
  Glaive: "Glaive",
  Halberd: "Alabarda",
  Pike: "Pique",
  Trident: "Tridente",
  Sling: "Funda",
  Rock: "Pedra",
  Quarterstaff: "Bordão",
  Rapier: "Rapieira",
  Flail: "Mangual",
  Lance: "Lança de Montaria",
  Net: "Rede",
  "Hand Crossbow": "Besta de Mão",
  Whip: "Chicote",
  Sickle: "Foice",
  Scythe: "Gadanha",
  Ram: "Aríete",
  Charge: "Investida",
  Pounce: "Bote",
  "Keen Smell": "Faro Aguçado",
  "Keen Hearing and Smell": "Audição e Olfato Aguçados",
  "Keen Sight": "Visão Aguçada",
  "Keen Hearing": "Audição Aguçada",
  "Keen Sight and Smell": "Visão e Olfato Aguçados",
  "Pack Tactics": "Táticas de Grupo",
  Amphibious: "Anfíbio",
  "Water Breathing": "Respirar na Água",
  "Spider Climb": "Escalada de Aranha",
  "Magic Resistance": "Resistência à Magia",
  "Legendary Resistance (3/Day)": "Resistência Lendária (3/Dia)",
  "Innate Spellcasting": "Conjuração Inata",
  Spellcasting: "Conjuração",
  "Sunlight Sensitivity": "Sensibilidade à Luz Solar",
  "Hold Breath": "Prender a Respiração",
  Flyby: "Voo Rasante",
  Parry: "Aparar",
  "Wing Attack (Costs 2 Actions)": "Ataque com as Asas (Custa 2 Ações)",
  Detect: "Detectar",
  "Tail Attack": "Ataque com a Cauda",
  "Frightful Presence": "Presença Aterradora",
  Swarm: "Enxame",
  "Magic Weapons": "Armas Mágicas",
  Shapechanger: "Metamorfo",
  "Nimble Escape": "Fuga Ágil",
  Brute: "Brutamontes",
  Aggressive: "Agressivo",
  "Trampling Charge": "Investida Atropeladora",
  "Standing Leap": "Salto Parado",
  Echolocation: "Ecolocalização",
  "Web Sense": "Sentir pela Teia",
  "Web Walker": "Andarilho da Teia",
  "False Appearance": "Aparência Falsa",
  "Undead Fortitude": "Fortitude de Morto-vivo",
  "Turn Resistance": "Resistência a Expulsão",
  "Turn Defiance": "Desafio à Expulsão",
  Regeneration: "Regeneração",
  Rampage: "Fúria Destruidora",
  "Siege Monster": "Monstro de Cerco",
  "Immutable Form": "Forma Imutável",
  "Devil's Sight": "Visão do Diabo",
  Mimicry: "Mímica",
  "Blood Frenzy": "Frenesi de Sangue",
  Grappler: "Agarrador",
  Reckless: "Imprudente",
  "Martial Advantage": "Vantagem Marcial",
  "Sneak Attack (1/Turn)": "Ataque Furtivo (1/Turno)",
  "Cunning Action": "Ação Ardilosa",
  "Leadership (Recharges after a Short or Long Rest)":
    "Liderança (Recarrega após um Descanso Curto ou Longo)",
};

/** Nomes de traços e ações que já saem em português pelo glossário. */
export const NOMES_PT = new Set(Object.values(NOMES_FIXOS))

export function traduzirNomeDeTexto(n) {
  return NOMES_FIXOS[n] ?? traduzirFrases(n);
}

/** Aplica o glossário a um esqueleto (preparar.mjs). Devolve uma cópia. */
export function pretraduzir(e, fonteSpeed) {
  const x = structuredClone(e);
  x.tamanho = TAMANHO[x.tamanho] ?? x.tamanho;
  x.tipo = TIPO[x.tipo] ?? x.tipo;
  x.subtipo = SUBTIPO[x.subtipo] ?? x.subtipo;
  x.tendencia = TENDENCIA[x.tendencia] ?? x.tendencia;
  x.caDescricao = traduzirArmadura(x.caDescricao);
  if (fonteSpeed) x.deslocamento = traduzirDeslocamento(fonteSpeed);
  x.pericias = x.pericias.map((p) => ({
    ...p,
    nome: PERICIA[p.nome] ?? p.nome,
  }));
  x.vulnerabilidades = traduzirDanos(x.vulnerabilidades);
  x.resistencias = traduzirDanos(x.resistencias);
  x.imunidades = traduzirDanos(x.imunidades);
  x.imunidadesACondicao = traduzirCondicoes(x.imunidadesACondicao);
  x.sentidos = traduzirSentidos(x.sentidos);
  x.idiomas = traduzirIdiomas(x.idiomas);
  for (const k of ["tracos", "acoes", "acoesBonus", "reacoes", "lendarias"])
    x[k] = x[k].map((t) => ({
      nome: traduzirNomeDeTexto(t.nome),
      texto: traduzirFrases(t.texto),
    }));
  x.descricaoLendaria = traduzirFrases(x.descricaoLendaria);
  return x;
}
