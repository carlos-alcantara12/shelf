"""Eixos do perfil de leitor e tipos de leitor (ver Docs/perfil-de-leitor.md, seções 3 e 4)."""

# Gêneros: afinidade de 0 a 100.
GENRES = {
    "G1": "Fantasia",
    "G2": "Ficção científica",
    "G3": "Romance",
    "G4": "Mistério e suspense",
    "G5": "Terror",
    "G6": "Clássicos",
    "G7": "História e biografias",
    "G8": "Ciência e conhecimento",
    "G9": "Desenvolvimento pessoal",
    "G10": "Poesia e crônicas",
    "G11": "Humor",
    "G12": "Quadrinhos e graphic novels",
}

# Estilo: dois polos, de 0 (primeiro) a 100 (segundo); 50 é neutro.
STYLE = {
    "S1": ("Ritmo", "Contemplativo", "Acelerado"),
    "S2": ("Foco", "Personagens", "Trama"),
    "S3": ("Tom", "Leve", "Sombrio"),
    "S4": ("Complexidade", "Acessível", "Desafiador"),
    "S5": ("Realidade", "Realista", "Imaginativo"),
    "S6": ("Extensão", "Curto", "Longo"),
}

# Hábitos: dois polos.
HABITS = {
    "H1": ("Volume", "Lê pouco", "Lê muito"),
    "H2": ("Constância", "Em ondas", "Todos os dias"),
    "H4": ("Leituras simultâneas", "Um por vez", "Vários ao mesmo tempo"),
    "H5": ("Persistência", "Abandona fácil", "Termina sempre"),
    "H6": ("Exploração", "Fiel ao conhecido", "Aventureiro"),
    "H7": ("Sociabilidade", "Solitária", "Compartilha"),
}

# Motivações: afinidade de 0 a 100.
MOTIVATIONS = {
    "M1": "Escapar",
    "M2": "Aprender",
    "M3": "Sentir",
    "M4": "Relaxar",
    "M5": "Desafiar-se",
    "M6": "Pertencer e conversar",
}

AFFINITY_AXES = set(GENRES) | set(MOTIVATIONS)
BIPOLAR_AXES = set(STYLE) | set(HABITS)
ALL_AXES = AFFINITY_AXES | BIPOLAR_AXES

AXIS_LABELS = {
    **GENRES,
    **{code: name for code, (name, _low, _high) in STYLE.items()},
    **{code: name for code, (name, _low, _high) in HABITS.items()},
    **MOTIVATIONS,
}

# Restrições que a pessoa pode pedir para evitar (Q8).
RESTRICTIONS = {
    "violencia_explicita": "Violência explícita",
    "romance_previsivel": "Romance muito previsível",
    "finais_tristes": "Finais tristes",
    "linguagem_antiga": "Linguagem antiga",
    "livros_longos": "Livros muito longos",
    "temas_pesados": "Temas muito pesados",
    "terror": "Terror",
}

# Tipos de leitor: cada um é um "centro" em alguns eixos (0 a 100). Um eixo pode vir como
# (valor, peso) para dar mais importância ao que define o tipo; inteiro vale peso 1.
ARCHETYPES = {
    "explorador": {
        "description": 'Você lê para descobrir. Muda de gênero, de época e de autor com facilidade, e se entedia quando tudo parece conhecido. Seu risco é começar muito e terminar pouco; seu talento é encontrar o que ninguém indicou.',
        "reading_tip": 'Alterne um livro fora da sua zona de conforto a cada três leituras e anote o que surpreendeu.',
        "label": "Explorador",
        "summary": "Curioso, varia muito de gênero e adora descobrir autores novos.",
        "centroid": {"H6": (85, 3), "S5": 65, "H1": 70, "S4": 55},
    },
    "imersivo": {
        "description": 'Você quer morar dentro do livro. Mundos grandes, personagens que crescem e histórias que duram semanas são o seu território. Despedir-se do último capítulo costuma ser a parte mais difícil.',
        "reading_tip": 'Reserve blocos longos de leitura e prefira séries ou sagas; um livro curto no meio ajuda a respirar.',
        "label": "Imersivo",
        "summary": "Gosta de mundos grandes e longos, onde mora por semanas.",
        "centroid": {"S6": (85, 2), "M1": (80, 2), "S2": 30, "S5": (85, 2), "G1": 70, "H4": 45},
    },
    "estudioso": {
        "description": 'Para você, ler é investigar. Você compara fontes, anota, volta ao trecho e conecta ideias entre livros. A leitura rende mais quando tem um tema para seguir.',
        "reading_tip": 'Monte uma trilha por assunto e registre trechos e dúvidas; um caderno de leitura ajuda bastante.',
        "label": "Estudioso",
        "summary": "Lê para entender: anota, compara e aprofunda.",
        "centroid": {"M2": (85, 3), "M5": 70, "S4": (80, 2), "S5": 25, "G8": 70, "G7": 60},
    },
    "contemplativo": {
        "description": 'Você lê devagar e com atenção ao detalhe. A beleza da frase e a vida interior das personagens importam mais que o ritmo da trama.',
        "reading_tip": 'Leia em horários tranquilos, sem pressa de terminar, e releia os trechos que tocaram você.',
        "label": "Contemplativo",
        "summary": "Lê devagar, saboreia a escrita e prefere o íntimo ao espetáculo.",
        "centroid": {"S1": (20, 3), "S2": (25, 2), "G6": 80, "G10": 75, "M4": 65, "S3": 45, "H1": 40},
    },
    "maratonista": {
        "description": 'Você devora histórias. Ritmo, tensão e reviravoltas te mantêm virando páginas, e um bom gancho vale mais que a descrição mais bonita. Séries combinam com você.',
        "reading_tip": 'Tenha sempre o próximo volume à mão e defina uma meta semanal; vale testar também um livro mais lento de vez em quando.',
        "label": "Maratonista",
        "summary": "Devora livros e séries; precisa de ritmo e reviravoltas.",
        "centroid": {"H1": (85, 2), "S1": (85, 3), "S2": (80, 2), "G4": 70, "S3": 65, "H2": 70},
    },
    "sentimental": {
        "description": 'Você lê para sentir. As personagens, os vínculos e as emoções contam mais que a engrenagem da trama. Os livros que mexem com você ficam na memória.',
        "reading_tip": 'Procure obras com personagens complexas e guarde as frases que te marcaram; conversar sobre o que sentiu ajuda a fixar a leitura.',
        "label": "Sentimental",
        "summary": "Lê para sentir; as personagens importam mais que a trama.",
        "centroid": {"M3": (85, 3), "S2": (20, 2), "G3": 90, "S1": 40},
    },
    "curador": {
        "description": 'Você é seletivo e fiel. Conhece seus autores, relê os favoritos e cuida da estante como quem cuida de uma coleção. Prefere profundidade a novidade.',
        "reading_tip": 'Aprofunde a obra dos autores que ama e reserve uma leitura por trimestre fora do seu cânone.',
        "label": "Curador",
        "summary": "Seletivo e fiel: relê, ama a estante e os clássicos.",
        "centroid": {"H6": (10, 3), "G6": (90, 2), "H5": (90, 2), "S4": 60, "H2": 80},
    },
    "pragmatico": {
        "description": 'Você lê com um objetivo: aprender algo que dá para aplicar. Livros curtos, claros e diretos funcionam melhor do que grandes volumes, e o áudio cabe na sua rotina.',
        "reading_tip": 'Escolha um livro por tema que você precisa dominar e termine cada um com uma ação concreta.',
        "label": "Pragmático",
        "summary": "Busca ideias aplicáveis, em livros curtos e objetivos.",
        "centroid": {"G9": (75, 2), "S6": (25, 2), "S4": 30, "M2": 65, "S5": 20, "H1": 60},
    },
}

# Pares de características que raramente andam juntas; revelam a "tensão interna" do perfil.
# (eixo A, polo A, eixo B, polo B, título, texto). Polo "low" = nota até 35; "high" = nota a partir de 65.
TENSIONS = [
    ("S1", "low", "S2", "high", "Calma com suspense", "Você lê devagar, mas quer que a trama surpreenda. Procure livros bem escritos com mistério."),
    ("S1", "high", "S4", "high", "Desafio com fôlego", "Você gosta de livros exigentes, mas lidos de uma vez, sem pausas."),
    ("S2", "low", "S1", "high", "Personagens em movimento", "Você quer personagens profundas numa história que não para."),
    ("S3", "low", "S4", "high", "Leveza e profundidade", "Você aprecia ideias complexas contadas com leveza."),
    ("S3", "high", "S4", "low", "Sombrio e acessível", "Você gosta de temas pesados, desde que em linguagem fácil de ler."),
    ("H6", "high", "H5", "high", "Curiosidade com disciplina", "Você experimenta muito e, mesmo assim, termina o que começa."),
    ("H2", "high", "H1", "low", "Constante, sem pressa", "Você lê todos os dias, mas em ritmo tranquilo."),
    ("H7", "high", "H4", "low", "Sociável, um livro por vez", "Você gosta de conversar sobre leituras, mas se dedica a uma de cada vez."),
    ("S6", "high", "H1", "low", "Livros grandes, poucos por ano", "Você lê pouco, mas prefere histórias longas."),
]

