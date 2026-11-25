import { useState } from "react";
import AnimatedContent from "@/components/AnimatedContent";
import ReaderCard from "@/components/ReaderCard";
import { Button, Container, Heading, Section } from "@/design-system";

// Patentes e cartões de exemplo (ilustrativos): mostram como o perfil de leitor evolui com os dados registrados.
const RANKS = [
  {
    id: "bronze",
    name: "Bronze",
    need: "Começando a jornada",
    books: 8,
    hours: 24,
    streak: 5,
    pages: 2100,
    xp: 62,
    next: "Prata",
    badges: ["Primeiro livro", "7 dias seguidos"],
  },
  {
    id: "prata",
    name: "Prata",
    need: "10 livros e 50 horas",
    books: 22,
    hours: 71,
    streak: 14,
    pages: 6400,
    xp: 48,
    next: "Ouro",
    badges: ["10 livros", "Leitor constante", "Maratona de fim de semana"],
  },
  {
    id: "ouro",
    name: "Ouro",
    need: "30 livros e 150 horas",
    books: 47,
    hours: 160,
    streak: 31,
    pages: 14200,
    xp: 71,
    next: "Diamante",
    badges: ["30 livros", "30 dias seguidos", "Explorador de gêneros", "Meta anual"],
  },
  {
    id: "diamante",
    name: "Diamante",
    need: "60 livros e 300 horas",
    books: 96,
    hours: 340,
    streak: 90,
    pages: 29800,
    xp: 100,
    next: null,
    badges: ["60 livros", "90 dias seguidos", "Mestre da constância", "Lenda da estante"],
  },
];

export default function ReaderCardShowcase({ onStart, ctaLabel }) {
  const [rankId, setRankId] = useState("ouro");
  const rank = RANKS.find((item) => item.id === rankId);

  return (
    <Section tone="inverse" className="welcome-section welcome-reader" aria-labelledby="welcome-reader-title">
      <Container size="wide">
        <div className="wr-grid">
          <AnimatedContent distance={32} duration={0.8}>
            <div className="wr-copy">
              <Heading level={2} id="welcome-reader-title">
                Seus livros viram um <span>cartão de leitor</span>
              </Heading>
              <p className="wr-lead">
                Livros lidos, horas de leitura e dias seguidos somam pontos no seu cartão. Com eles você sobe de patente:
                bronze, prata, ouro e diamante.
              </p>
              <div className="wr-ranks" role="group" aria-label="Escolha uma patente para ver o cartão">
                {RANKS.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={`wr-rank wr-rank--${item.id}${item.id === rankId ? " is-active" : ""}`}
                    aria-pressed={item.id === rankId}
                    onClick={() => setRankId(item.id)}
                  >
                    <span className="wr-rank__dot" aria-hidden="true" />
                    <span>
                      <strong>{item.name}</strong>
                      <small>{item.need}</small>
                    </span>
                  </button>
                ))}
              </div>
              <div className="wr-cta">
                <Button variant="secondary" size="lg" onClick={onStart}>{ctaLabel}</Button>
              </div>
            </div>
          </AnimatedContent>
          <AnimatedContent distance={40} duration={0.9}>
            <ReaderCard card={rank} title={`Leitor ${rank.name}`} profile="Explorador" />
          </AnimatedContent>
        </div>
      </Container>
    </Section>
  );
}
