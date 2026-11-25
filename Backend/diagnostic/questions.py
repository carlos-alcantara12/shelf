"""Banco de 40 perguntas do perfil de leitor (Docs/perfil-de-leitor.md, seção 5).

Cada opção carrega *efeitos*:
  - {"axis": "S1", "weight": 2}  soma pontos a um eixo (-2 a +2);
  - {"restriction": "..."}       acrescenta algo a evitar;
  - {"language": [...]}          define os idiomas de leitura;
  - {"trait": ("chave", "valor")} registra uma característica categórica;
  - {"theme": "..."}             registra um tema de interesse.

Perguntas de escala (1 a 5) têm `effects` na própria pergunta; o peso é
multiplicado por (valor - 3) / 2, de -1 a +1.

Níveis: perguntas 1 a 10 formam o nível 1; 1 a 20, o nível 2; 1 a 40, o nível 3.
"""

from .axes import GENRES, RESTRICTIONS

BANK_VERSION = "2026.1"

SCALE_LABELS = [
    "Discordo totalmente",
    "Discordo",
    "Nem concordo nem discordo",
    "Concordo",
    "Concordo totalmente",
]

BLOCKS = {
    1: "O essencial",
    2: "Gosto fino",
    3: "Hábitos e contexto",
    4: "Nuances",
}


def ax(axis, weight):
    return {"axis": axis, "weight": weight}


def opt(option_id, label, *effects):
    return {"id": option_id, "label": label, "effects": list(effects)}


def single(number, text, options):
    return {"number": number, "type": "single", "text": text, "options": options}


def checklist(number, text, options, max_choices=None, min_choices=1, hint="Marque todos que se aplicam."):
    return {
        "number": number,
        "type": "checklist",
        "text": text,
        "hint": hint,
        "max_choices": max_choices,
        "min_choices": min_choices,
        "options": options,
    }


def scale(number, text, *effects):
    return {"number": number, "type": "scale", "text": text, "effects": list(effects)}


def pick3(number, text, options):
    return {
        "number": number,
        "type": "pick3",
        "text": text,
        "hint": "Escolha até 3.",
        "max_choices": 3,
        "min_choices": 1,
        "options": options,
    }


def free_text(number, text):
    return {
        "number": number,
        "type": "text",
        "text": text,
        "hint": "Opcional. Até 3 títulos.",
        "max_items": 3,
        "max_length": 200,
        "optional": True,
    }


# ---------- Bloco 1: o essencial (nível 1) ----------

Q01 = checklist(
    1,
    "Quais gêneros você costuma gostar de ler?",
    [opt(f"g{index}", label, ax(code, 2)) for index, (code, label) in enumerate(GENRES.items(), start=1)],
    max_choices=5,
    hint="Escolha até 5.",
)

Q02 = single(2, "Quantos livros você lê, em média, por mês?", [
    opt("quase_nenhum", "Quase nenhum", ax("H1", -2)),
    opt("um", "1", ax("H1", -1)),
    opt("dois_tres", "2 a 3", ax("H1", 0)),
    opt("quatro_seis", "4 a 6", ax("H1", 1)),
    opt("sete_mais", "7 ou mais", ax("H1", 2)),
])

Q03 = single(3, "O que mais te atrai em um livro?", [
    opt("trama", "A trama", ax("S2", 2)),
    opt("personagens", "Os personagens", ax("S2", -2)),
    opt("ideias", "As ideias", ax("M2", 2), ax("S4", 1), ax("G8", 1)),
    opt("escrita", "O estilo da escrita", ax("S1", -1), ax("G10", 1), ax("S4", 1)),
])

Q04 = scale(4, "Prefiro histórias de ritmo rápido, que me prendem logo nas primeiras páginas.", ax("S1", 2))

Q05 = single(5, "Que tom você procura com mais frequência?", [
    opt("leve", "Leve e divertido", ax("S3", -2), ax("M4", 1), ax("G11", 1)),
    opt("emocionante", "Emocionante", ax("M3", 2), ax("S1", 1)),
    opt("reflexivo", "Reflexivo", ax("S1", -1), ax("S4", 1), ax("M5", 1)),
    opt("sombrio", "Sombrio e tenso", ax("S3", 2), ax("S1", 1), ax("G4", 1), ax("G5", 1)),
])

Q06 = single(6, "Por que você lê, principalmente?", [
    opt("escapar", "Para escapar da rotina", ax("M1", 2), ax("S5", 1)),
    opt("aprender", "Para aprender", ax("M2", 2), ax("G8", 1), ax("G7", 1)),
    opt("sentir", "Para sentir emoções", ax("M3", 2), ax("S2", -1)),
    opt("relaxar", "Para relaxar", ax("M4", 2), ax("S3", -1), ax("S4", -1)),
    opt("desafiar", "Para me desafiar", ax("M5", 2), ax("S4", 2)),
])

Q07 = single(7, "Que tamanho de livro você prefere?", [
    opt("ate_200", "Até 200 páginas", ax("S6", -2)),
    opt("de_200_a_350", "De 200 a 350", ax("S6", -1)),
    opt("de_350_a_500", "De 350 a 500", ax("S6", 1)),
    opt("mais_de_500", "500 ou mais, sem problema", ax("S6", 2)),
])

Q08 = checklist(
    8,
    "O que você prefere evitar?",
    [
        opt("violencia_explicita", RESTRICTIONS["violencia_explicita"], {"restriction": "violencia_explicita"}),
        opt("romance_previsivel", RESTRICTIONS["romance_previsivel"], {"restriction": "romance_previsivel"}),
        opt("finais_tristes", RESTRICTIONS["finais_tristes"], {"restriction": "finais_tristes"}, ax("S3", -1)),
        opt("linguagem_antiga", RESTRICTIONS["linguagem_antiga"], {"restriction": "linguagem_antiga"}),
        opt("livros_longos", RESTRICTIONS["livros_longos"], {"restriction": "livros_longos"}, ax("S6", -1)),
        opt("temas_pesados", RESTRICTIONS["temas_pesados"], {"restriction": "temas_pesados"}),
        opt("terror", RESTRICTIONS["terror"], {"restriction": "terror"}),
    ],
    min_choices=0,
    hint="Marque quantos quiser. Se nada te incomoda, siga em frente.",
)

Q09 = single(9, "Em que formato você mais lê?", [
    opt("fisico", "Livro físico", {"trait": ("format", "fisico")}),
    opt("ebook", "E-book", {"trait": ("format", "ebook")}),
    opt("audio", "Audiolivro", {"trait": ("format", "audio")}),
    opt("varia", "Varia", {"trait": ("format", "varia")}),
])

Q10 = single(10, "Quando um livro não te prende, o que você faz?", [
    opt("insisto", "Insisto até o fim", ax("H5", 2)),
    opt("cinquenta", "Dou umas 50 páginas", ax("H5", 0)),
    opt("abandono", "Abandono sem culpa", ax("H5", -2)),
    opt("pulo", "Pulo trechos", ax("H5", -1)),
])

# ---------- Bloco 2: gosto fino (nível 2) ----------

Q11 = scale(
    11,
    "Gosto de mundos imaginários, com magia, tecnologia ou regras diferentes das nossas.",
    ax("S5", 2), ax("G1", 1), ax("G2", 1),
)

Q12 = scale(12, "Gosto de livros baseados em fatos reais.", ax("S5", -2), ax("G7", 1), ax("G8", 1))

Q13 = single(13, "Você prefere personagens…", [
    opt("mudam", "Que mudam muito ao longo da história", ax("S2", -2)),
    opt("firmes", "Marcantes e firmes desde o início", ax("S2", -1)),
    opt("varios", "Vários pontos de vista", ax("S6", 1)),
    opt("tanto_faz", "Tanto faz"),
])

Q14 = single(14, "Como você gosta de finais?", [
    opt("fechados", "Fechados e satisfatórios", ax("S4", -1), ax("S3", -1)),
    opt("abertos", "Abertos, que fazem pensar", ax("S4", 2)),
    opt("surpreendentes", "Surpreendentes", ax("S2", 2), ax("G4", 1)),
    opt("felizes", "Felizes", ax("S3", -2)),
])

Q15 = scale(15, "Gosto de livros que me desafiam, com linguagem ou ideias complexas.", ax("S4", 2), ax("M5", 1))

Q16 = single(16, "Que estilo de escrita você prefere?", [
    opt("simples", "Simples e direto", ax("S4", -2), ax("S1", 1)),
    opt("poetico", "Poético e cuidadoso", ax("G10", 2), ax("S1", -2), ax("S4", 1)),
    opt("humor", "Com humor e ironia", ax("G11", 2), ax("S3", -1)),
    opt("detalhista", "Detalhista e descritivo", ax("S1", -1), ax("S4", 1), ax("S6", 1)),
    opt("visual", "Visual, com imagens e quadros", ax("G12", 2), ax("S1", 1), ax("S4", -1)),
])

Q17 = checklist(
    17,
    "Que temas te interessam?",
    [
        opt("amizade", "Amizade", {"theme": "amizade"}),
        opt("amor", "Amor", {"theme": "amor"}, ax("G3", 1)),
        opt("familia", "Família", {"theme": "familia"}),
        opt("poder", "Poder e política", {"theme": "poder"}, ax("G7", 1)),
        opt("guerra", "Guerra e história", {"theme": "guerra"}, ax("G7", 1)),
        opt("natureza", "Natureza", {"theme": "natureza"}, ax("G8", 1)),
        opt("misterios", "Mistérios do passado", {"theme": "misterios"}, ax("G4", 1), ax("G7", 1)),
        opt("tecnologia", "Tecnologia e futuro", {"theme": "tecnologia"}, ax("G2", 1)),
        opt("espiritualidade", "Espiritualidade", {"theme": "espiritualidade"}, ax("G9", 1)),
        opt("autodescoberta", "Autodescoberta", {"theme": "autodescoberta"}, ax("G9", 1)),
        opt("sociedade", "Sociedade e desigualdade", {"theme": "sociedade"}),
        opt("aventura", "Viagem e aventura", {"theme": "aventura"}),
    ],
    max_choices=5,
    hint="Escolha até 5.",
)

Q18 = single(18, "Séries ou volumes únicos?", [
    opt("serie_longa", "Série longa", ax("S6", 2), ax("H4", 1)),
    opt("trilogia", "Trilogia ou duologia", ax("S6", 1)),
    opt("unicos", "Sempre volumes únicos", ax("S6", -1)),
    opt("tanto_faz", "Tanto faz"),
])

Q19 = scale(19, "Gosto de me surpreender com reviravoltas.", ax("S2", 2), ax("G4", 1), ax("S1", 1))

# Q20 usa trechos curtos originais (a escrever) apenas como apoio de interface;
# o que importa para o perfil é o gênero escolhido.
Q20 = single(20, "Qual destes começos de livro mais chamaria a sua atenção?", [
    opt("epica", "Um reino em ruínas e uma profecia que ninguém quer cumprir.",
        ax("G1", 2), ax("S5", 2), ax("S6", 1)),
    opt("suspense", "Uma carta sem remetente chega na noite em que alguém desaparece.",
        ax("G4", 2), ax("S1", 2), ax("S3", 1), ax("S2", 1)),
    opt("romance", "Dois estranhos dividem um guarda-chuva e, sem saber, uma vida inteira.",
        ax("G3", 2), ax("M3", 1), ax("S2", -1)),
    opt("ideias", "Como o hábito de contar histórias moldou tudo o que chamamos de civilização.",
        ax("G8", 2), ax("S4", 1), ax("M2", 1)),
])
# Gênero associado a cada opção do Q20, usado na checagem de consistência com o Q1.
Q20_GENRES = {"epica": "g1", "suspense": "g4", "romance": "g3", "ideias": "g8"}

# ---------- Bloco 3: hábitos e contexto (nível 3, parte A) ----------

Q21 = single(21, "Quando você costuma ler?", [
    opt("manha", "De manhã", {"trait": ("reading_time", "manha")}),
    opt("tarde", "À tarde", {"trait": ("reading_time", "tarde")}),
    opt("noite", "À noite, antes de dormir", {"trait": ("reading_time", "noite")}, ax("H2", 1)),
    opt("deslocamento", "Em deslocamentos", {"trait": ("reading_time", "deslocamento")}),
    opt("fim_de_semana", "Nos fins de semana", {"trait": ("reading_time", "fim_de_semana")}, ax("H2", -1)),
])

Q22 = single(22, "Por quanto tempo você lê de cada vez?", [
    opt("ate_15", "Até 15 minutos", ax("H1", -1), ax("S6", -1)),
    opt("de_15_a_30", "De 15 a 30 minutos", ax("H1", 0)),
    opt("de_30_a_60", "De 30 a 60 minutos", ax("H1", 1)),
    opt("mais_de_60", "Mais de 1 hora", ax("H1", 2), ax("S6", 1)),
])

Q23 = single(23, "Você lê um livro por vez?", [
    opt("um", "Um por vez", ax("H4", -2)),
    opt("dois_tres", "Dois ou três juntos", ax("H4", 1)),
    opt("varios", "Vários ao mesmo tempo", ax("H4", 2)),
])

Q24 = scale(24, "Leio todos os dias, mesmo que sejam poucas páginas.", ax("H2", 2))

Q25 = single(25, "Qual é a sua meta de leitura?", [
    opt("sem_meta", "Não tenho meta", ax("H2", -1), ax("H1", -1), {"trait": ("goal", "sem_meta")}),
    opt("um_mes", "1 livro por mês", ax("H1", 0), {"trait": ("goal", "um_por_mes")}),
    opt("um_semana", "1 livro por semana", ax("H1", 2), {"trait": ("goal", "um_por_semana")}),
    opt("anual", "Uma meta anual específica", ax("H5", 1), ax("H2", 1), {"trait": ("goal", "anual")}),
])

Q26 = single(26, "Como você escolhe o próximo livro?", [
    opt("amigos", "Indicação de amigos", ax("H7", 2), ax("H6", 1)),
    opt("resenhas", "Resenhas e listas", ax("H6", 1), ax("H7", 1)),
    opt("autor_conhecido", "Autor que já conheço", ax("H6", -2)),
    opt("capa_sinopse", "Capa e sinopse", ax("H6", 1)),
    opt("app_loja", "Sugestão de loja ou aplicativo", ax("H7", -1)),
])

Q27 = single(27, "Você relê livros?", [
    opt("nunca", "Nunca", ax("H6", 1)),
    opt("as_vezes", "Às vezes, os favoritos", ax("H6", -1)),
    opt("frequente", "Com frequência", ax("H6", -2)),
])

Q28 = scale(28, "Gosto de conversar sobre o que li, em clubes ou com amigos.", ax("H7", 2), ax("M6", 2))

Q29 = single(29, "Onde você lê?", [
    opt("casa", "Em casa, em silêncio", {"trait": ("place", "casa")}),
    opt("movimento", "Em movimento", {"trait": ("place", "movimento")}),
    opt("publico", "Em locais públicos", {"trait": ("place", "publico")}),
    opt("qualquer", "Em qualquer lugar", {"trait": ("place", "qualquer")}),
])

Q30 = single(30, "Como você costuma conseguir seus livros?", [
    opt("compro", "Compro", {"trait": ("access", "compra")}),
    opt("biblioteca", "Biblioteca", {"trait": ("access", "biblioteca")}),
    opt("emprestimo", "Empréstimo", {"trait": ("access", "emprestimo")}),
    opt("digital", "Assinatura ou digital", {"trait": ("access", "digital")}),
])

# ---------- Bloco 4: nuances (nível 3, parte B) ----------

Q31 = scale(31, "Prefiro descobrir autores novos a reler os que já conheço.", ax("H6", 2))

Q32 = single(32, "Em que idioma você lê?", [
    opt("pt", "Só português", {"language": ["pt"]}),
    opt("pt_en", "Português e inglês", {"language": ["pt", "en"]}),
    opt("pt_en_es", "Também espanhol", {"language": ["pt", "en", "es"]}),
    opt("outros", "Outros idiomas também", {"language": ["pt", "en", "es", "outros"]}),
])

Q33 = single(33, "Quando um livro te emociona muito, você…", [
    opt("anota", "Anota trechos", ax("M2", 1), ax("S4", 1)),
    opt("indica", "Indica a alguém", ax("M6", 2), ax("H7", 1)),
    opt("procura_autor", "Procura mais do autor", ax("H6", -1)),
    opt("fica_pensando", "Fica pensando nele", ax("M3", 1), ax("S1", -1)),
])

Q34 = scale(34, "Gosto de livros que me fazem chorar ou sentir muito.", ax("M3", 2), ax("S2", -1))

Q35 = scale(35, "Gosto de livros que me deixam em tensão, com medo ou ansiedade.", ax("S3", 2), ax("G4", 1), ax("G5", 2))

Q36 = single(36, "Que tipo de não ficção mais te atrai?", [
    opt("ciencia", "Ciência e natureza", ax("G8", 2)),
    opt("historia", "História e política", ax("G7", 2)),
    opt("biografias", "Biografias e memórias", ax("G7", 2)),
    opt("psicologia", "Psicologia e comportamento", ax("G9", 2), ax("G8", 1)),
    opt("negocios", "Negócios e carreira", ax("G9", 2), ax("M2", 1)),
    opt("nenhuma", "Nenhuma"),
])

Q37 = single(37, "O que você quer ler agora?", [
    opt("conforto", "Algo que me conforte", ax("M4", 2), ax("S3", -1)),
    opt("desafio", "Algo que me desafie", ax("M5", 2), ax("S4", 1)),
    opt("fuga", "Algo que me faça fugir", ax("M1", 2), ax("S5", 1)),
    opt("ensine", "Algo que me ensine", ax("M2", 2)),
])

Q38 = pick3(38, "Escolha até 3 palavras para descrever o livro dos seus sonhos.", [
    opt("envolvente", "Envolvente", ax("S1", 1), ax("M1", 1)),
    opt("profundo", "Profundo", ax("S4", 1), ax("S1", -1)),
    opt("leve", "Leve", ax("S3", -2), ax("M4", 1)),
    opt("surpreendente", "Surpreendente", ax("S2", 2)),
    opt("poetico", "Poético", ax("G10", 2), ax("S1", -1)),
    opt("inteligente", "Inteligente", ax("S4", 1), ax("M5", 1)),
    opt("emocionante", "Emocionante", ax("M3", 2)),
    opt("inspirador", "Inspirador", ax("G9", 1), ax("M2", 1)),
    opt("divertido", "Divertido", ax("G11", 2), ax("S3", -1)),
    opt("sombrio", "Sombrio", ax("S3", 2)),
    opt("epico", "Épico", ax("G1", 1), ax("S6", 1), ax("S5", 1)),
    opt("intimo", "Íntimo", ax("S2", -1), ax("S1", -1)),
])

Q39 = single(39, "Qual é a sua relação com os clássicos?", [
    opt("adoro", "Adoro", ax("G6", 2), ax("S4", 1)),
    opt("respeito", "Respeito, mas evito", ax("G6", -1), ax("S4", -1)),
    opt("curiosidade", "Tenho curiosidade", ax("G6", 1)),
    opt("contemporaneos", "Prefiro contemporâneos", ax("G6", -1)),
])

Q40 = free_text(40, "Cite até 3 livros que marcaram você.")

QUESTIONS = [
    Q01, Q02, Q03, Q04, Q05, Q06, Q07, Q08, Q09, Q10,
    Q11, Q12, Q13, Q14, Q15, Q16, Q17, Q18, Q19, Q20,
    Q21, Q22, Q23, Q24, Q25, Q26, Q27, Q28, Q29, Q30,
    Q31, Q32, Q33, Q34, Q35, Q36, Q37, Q38, Q39, Q40,
]


# ---------- Tema de cada pergunta (chip no cartão) e textos "Entenda" ----------

# número -> (rótulo, ícone, cor). Ícones e cores são chaves que o frontend traduz em desenho e paleta.
TOPICS = {
    1: ("Gêneros", "book", "genres"),
    2: ("Volume de leitura", "gauge", "H1"),
    3: ("Foco", "target", "S2"),
    4: ("Ritmo", "gauge", "S1"),
    5: ("Tom", "mask", "S3"),
    6: ("Motivação", "heart", "motivation"),
    7: ("Extensão", "ruler", "S6"),
    8: ("O que evitar", "shield", "avoid"),
    9: ("Formato", "device", "format"),
    10: ("Persistência", "repeat", "H5"),
    11: ("Mundos imaginários", "sparkle", "S5"),
    12: ("Fatos reais", "sparkle", "S5"),
    13: ("Personagens", "target", "S2"),
    14: ("Finais", "mask", "S3"),
    15: ("Complexidade", "puzzle", "S4"),
    16: ("Estilo de escrita", "puzzle", "S4"),
    17: ("Temas", "book", "genres"),
    18: ("Séries", "repeat", "S6"),
    19: ("Reviravoltas", "sparkle", "S2"),
    20: ("Primeiras linhas", "book", "genres"),
    21: ("Rotina", "calendar", "H2"),
    22: ("Tempo de leitura", "gauge", "H1"),
    23: ("Leituras simultâneas", "repeat", "H4"),
    24: ("Constância", "calendar", "H2"),
    25: ("Meta", "target", "H1"),
    26: ("Como você escolhe", "compass", "H6"),
    27: ("Releitura", "repeat", "H6"),
    28: ("Conversa", "people", "H7"),
    29: ("Onde você lê", "globe", "format"),
    30: ("Como você consegue", "device", "format"),
    31: ("Descoberta", "compass", "H6"),
    32: ("Idioma", "globe", "language"),
    33: ("Reação", "heart", "motivation"),
    34: ("Emoção", "heart", "motivation"),
    35: ("Tensão", "mask", "S3"),
    36: ("Não ficção", "book", "genres"),
    37: ("Agora", "heart", "motivation"),
    38: ("Palavras", "sparkle", "motivation"),
    39: ("Clássicos", "book", "genres"),
    40: ("Seus livros", "star", "books"),
}
TOPIC_ICONS = {"book", "gauge", "mask", "heart", "ruler", "shield", "device", "repeat", "sparkle", "puzzle", "calendar", "people", "compass", "globe", "star", "target"}
TOPIC_COLORS = {"genres", "S1", "S2", "S3", "S4", "S5", "S6", "H1", "H2", "H4", "H5", "H6", "H7", "motivation", "avoid", "format", "language", "books"}


def explain(agree, disagree, note):
    return {"agree": agree, "disagree": disagree, "note": note}


# Textos do botão "Entenda" das perguntas de escala: o que significa concordar, discordar e o que a pergunta mede.
EXPLAIN = {
    4: explain(
        "Você gosta de começar já com ação ou mistério, capítulos curtos e uma trama que não dá trégua. Exemplo: thrillers, aventuras e romances policiais.",
        "Você aprecia aberturas lentas, com descrição e atmosfera, e não se incomoda de esperar a história engrenar. Exemplo: romances clássicos e livros introspectivos.",
        "Mede o ritmo que você prefere no começo do livro, não o que você acha de livros longos.",
    ),
    11: explain(
        "Você curte universos com magia, naves, criaturas ou regras próprias. Exemplo: fantasia épica e ficção científica.",
        "Você prefere histórias que poderiam acontecer no mundo real, com lugares e personagens reconhecíveis.",
        "Vale para livros inteiros passados em outro mundo, não para um toque de fantasia numa história realista.",
    ),
    12: explain(
        "Você gosta de saber que aconteceu de verdade: biografias, histórias de uma época, grandes reportagens em formato de livro.",
        "Você prefere a liberdade da ficção, mesmo quando a história é inspirada em fatos.",
        "Fala do gosto por livros baseados em acontecimentos reais, não de acreditar mais num tipo de livro do que no outro.",
    ),
    15: explain(
        "Você gosta de ler devagar para entender, reler trechos e enfrentar ideias ou linguagem difíceis.",
        "Você prefere uma leitura fluida, de linguagem direta, que não exige esforço para ser compreendida.",
        "Não é sobre inteligência: é sobre quanto esforço você gosta de ter na leitura.",
    ),
    19: explain(
        "Você gosta de ser pego de surpresa e de reler o começo depois de descobrir o final.",
        "Você prefere histórias previsíveis no bom sentido, em que o prazer está no caminho e não no susto.",
        "Mede o gosto por surpresas na trama, não por finais tristes ou felizes.",
    ),
    24: explain(
        "Ler faz parte da sua rotina diária, mesmo que sejam poucas páginas, como um hábito.",
        "Você lê em períodos: semanas sem abrir um livro e depois muitas horas seguidas.",
        "Conta a constância, não a quantidade: ler 5 minutos por dia já vale como concordar.",
    ),
    28: explain(
        "Você gosta de comentar o que leu, trocar indicações e participar de clubes de leitura ou grupos.",
        "Para você a leitura é um momento só seu, que não precisa ser compartilhado.",
        "Pode ser pessoalmente ou na internet; o que importa é o gosto de conversar sobre o livro.",
    ),
    31: explain(
        "Você prefere descobrir autores e estilos que não conhece, mesmo com o risco de errar.",
        "Você se sente mais à vontade com autores que já conhece e em quem confia, e volta a eles.",
        "Mede a vontade de explorar; reler favoritos é uma pergunta à parte.",
    ),
    34: explain(
        "Você procura livros que mexem com você, daqueles em que é fácil se emocionar até as lágrimas.",
        "Você prefere livros que mantêm a emoção mais contida, ou que divertem sem pesar.",
        "Emoção aqui inclui tristeza, mas também comoção, saudade e alegria intensa.",
    ),
    35: explain(
        "Você gosta de suspense, terror e livros que deixam o coração acelerado.",
        "Você prefere histórias mais calmas, sem cenas de medo ou angústia.",
        "Mede o gosto por tensão e medo, não por violência explícita (essa você marca em \"O que evitar\").",
    ),
}

