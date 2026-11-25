"""Leitores-modelo completos (40 respostas) usados nos testes da pontuação.

Cada um descreve um tipo de leitor; o resultado esperado é o tipo principal.
"""

_BLANK = {"q08": [], "q40": []}


def _persona(**answers):
    return {**_BLANK, **answers}


PERSONAS = {
    "explorador": _persona(
        q01=["g1", "g2", "g4", "g7", "g8"], q02="quatro_seis", q03="ideias", q04=3, q05="emocionante",
        q06="aprender", q07="de_200_a_350", q09="varia", q10="abandono", q11=4, q12=4, q13="tanto_faz",
        q14="surpreendentes", q15=4, q16="detalhista",
        q17=["tecnologia", "misterios", "aventura", "guerra", "sociedade"], q18="trilogia", q19=4,
        q20="ideias", q21="noite", q22="de_30_a_60", q23="varios", q24=3, q25="um_mes", q26="resenhas",
        q27="nunca", q28=3, q29="qualquer", q30="biblioteca", q31=5, q32="pt_en", q33="procura_autor",
        q34=3, q35=3, q36="ciencia", q37="desafio", q38=["surpreendente", "inteligente", "envolvente"],
        q39="curiosidade",
    ),
    "imersivo": _persona(
        q01=["g1", "g2"], q02="quatro_seis", q03="personagens", q04=2, q05="emocionante", q06="escapar",
        q07="mais_de_500", q09="fisico", q10="insisto", q11=5, q12=1, q13="mudam", q14="fechados", q15=3,
        q16="detalhista", q17=["aventura", "amizade", "poder", "guerra", "natureza"], q18="serie_longa",
        q19=3, q20="epica", q21="noite", q22="mais_de_60", q23="dois_tres", q24=4, q25="um_mes",
        q26="amigos", q27="as_vezes", q28=4, q29="casa", q30="compro", q31=3, q32="pt_en",
        q33="fica_pensando", q34=4, q35=3, q36="nenhuma", q37="fuga",
        q38=["epico", "envolvente", "intimo"], q39="curiosidade",
    ),
    "estudioso": _persona(
        q01=["g7", "g8", "g9", "g6"], q02="dois_tres", q03="ideias", q04=2, q05="reflexivo",
        q06="aprender", q07="de_350_a_500", q09="ebook", q10="insisto", q11=1, q12=5, q13="firmes",
        q14="abertos", q15=5, q16="detalhista",
        q17=["guerra", "poder", "sociedade", "natureza", "misterios"], q18="unicos", q19=2, q20="ideias",
        q21="manha", q22="de_30_a_60", q23="varios", q24=4, q25="anual", q26="resenhas", q27="as_vezes",
        q28=3, q29="casa", q30="biblioteca", q31=3, q32="pt_en", q33="anota", q34=2, q35=2,
        q36="ciencia", q37="ensine", q38=["profundo", "inteligente", "inspirador"], q39="adoro",
    ),
    "contemplativo": _persona(
        q01=["g6", "g10", "g3"], q02="um", q03="escrita", q04=1, q05="reflexivo", q06="relaxar",
        q07="de_200_a_350", q08=["violencia_explicita"], q09="fisico", q10="cinquenta", q11=3, q12=3,
        q13="mudam", q14="abertos", q15=3, q16="poetico",
        q17=["natureza", "amor", "familia", "autodescoberta", "amizade"], q18="unicos", q19=2,
        q20="romance", q21="noite", q22="de_15_a_30", q23="um", q24=4, q25="sem_meta",
        q26="capa_sinopse", q27="nunca", q28=2, q29="casa", q30="biblioteca", q31=4, q32="pt",
        q33="fica_pensando", q34=4, q35=1, q36="nenhuma", q37="conforto",
        q38=["poetico", "intimo", "profundo"], q39="adoro",
    ),
    "maratonista": _persona(
        q01=["g4", "g5", "g2", "g1"], q02="sete_mais", q03="trama", q04=5, q05="sombrio", q06="escapar",
        q07="de_350_a_500", q09="ebook", q10="abandono", q11=3, q12=2, q13="varios", q14="surpreendentes",
        q15=3, q16="simples", q17=["misterios", "poder", "aventura", "guerra", "tecnologia"],
        q18="serie_longa", q19=5, q20="suspense", q21="noite", q22="mais_de_60", q23="varios", q24=5,
        q25="um_semana", q26="app_loja", q27="nunca", q28=3, q29="qualquer", q30="digital", q31=3,
        q32="pt_en", q33="procura_autor", q34=2, q35=5, q36="nenhuma", q37="fuga",
        q38=["envolvente", "surpreendente", "sombrio"], q39="contemporaneos",
    ),
    "sentimental": _persona(
        q01=["g3", "g6"], q02="dois_tres", q03="personagens", q04=2, q05="emocionante", q06="sentir",
        q07="de_200_a_350", q08=["violencia_explicita"], q09="fisico", q10="insisto", q11=2, q12=4,
        q13="mudam", q14="fechados", q15=2, q16="poetico",
        q17=["amor", "familia", "amizade", "autodescoberta", "sociedade"], q18="unicos", q19=2,
        q20="romance", q21="noite", q22="de_30_a_60", q23="dois_tres", q24=4, q25="um_mes",
        q26="amigos", q27="frequente", q28=4, q29="casa", q30="compro", q31=2, q32="pt", q33="indica",
        q34=5, q35=1, q36="biografias", q37="conforto", q38=["emocionante", "intimo", "poetico"],
        q39="curiosidade",
    ),
    "curador": _persona(
        q01=["g6", "g7", "g3", "g10"], q02="dois_tres", q03="ideias", q04=3, q05="leve",
        q06="relaxar", q07="de_350_a_500", q09="fisico", q10="insisto", q11=2, q12=4, q13="firmes",
        q14="fechados", q15=4, q16="detalhista",
        q17=["guerra", "poder", "amor", "familia", "misterios"], q18="unicos", q19=2, q20="romance",
        q21="noite", q22="de_30_a_60", q23="um", q24=5, q25="anual", q26="autor_conhecido",
        q27="frequente", q28=3, q29="casa", q30="compro", q31=1, q32="pt_en", q33="procura_autor",
        q34=3, q35=2, q36="historia", q37="conforto", q38=["profundo", "inteligente", "envolvente"],
        q39="adoro",
    ),
    "pragmatico": _persona(
        q01=["g9", "g8", "g7"], q02="quatro_seis", q03="ideias", q04=4, q05="reflexivo", q06="aprender",
        q07="ate_200", q08=["livros_longos", "temas_pesados"], q09="audio", q10="abandono", q11=1,
        q12=5, q13="tanto_faz", q14="fechados", q15=2, q16="simples",
        q17=["autodescoberta", "poder", "tecnologia", "sociedade", "espiritualidade"], q18="unicos",
        q19=3, q20="ideias", q21="deslocamento", q22="de_15_a_30", q23="dois_tres", q24=4,
        q25="um_mes", q26="resenhas", q27="nunca", q28=3, q29="movimento", q30="digital", q31=4,
        q32="pt_en", q33="anota", q34=2, q35=1, q36="negocios", q37="ensine",
        q38=["inteligente", "inspirador", "leve"], q39="respeito",
    ),
}
