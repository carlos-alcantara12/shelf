import { useState } from "react";
import { Button, Container, Heading, Section } from "./index";
import "./design-page.css";

const COLORS = [
  ["Superfícies", ["--surface-page", "--surface-raised", "--surface-sunken", "--surface-inverse"]],
  ["Texto", ["--text-primary", "--text-secondary", "--text-tertiary", "--text-accent"]],
  ["Acento e estado", ["--accent", "--accent-strong", "--danger-color", "--success-color"]],
];
const TYPE = [
  ["display", "--text-display", "Biblioteca"],
  ["h1", "--text-h1", "Sua próxima leitura"],
  ["h2", "--text-h2", "Explore por gênero"],
  ["h3", "--text-h3", "Guarde cada história"],
];
const SPACES = ["--space-1", "--space-2", "--space-3", "--space-4", "--space-5", "--space-6", "--space-7", "--space-8", "--space-9"];
const RADII = ["--radius-sm", "--radius-md", "--radius-lg", "--radius-pill"];
const SHADOWS = ["--shadow-sm", "--shadow-md", "--shadow-lg"];

export default function DesignSystemPage() {
  const [dark, setDark] = useState(false);
  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    if (next) document.documentElement.dataset.theme = "dark";
    else delete document.documentElement.dataset.theme;
  };

  return (
    <main className="dsp">
      <Section>
        <Container>
          <p className="dsp__eyebrow">Somente em desenvolvimento · /dev/design</p>
          <Heading level={1} size="h1">Design system Shelf</Heading>
          <p className="dsp__lead">Tokens e componentes base. Tudo aqui lê de <code>src/styles/tokens.css</code>.</p>
          <Button variant="ghost" size="sm" onClick={toggleTheme}>{dark ? "Tema claro" : "Pré-visualizar tema escuro"}</Button>
        </Container>
      </Section>

      <Section tone="raised">
        <Container>
          <Heading level={2}>Cores</Heading>
          {COLORS.map(([group, tokens]) => (
            <div key={group} className="dsp__group">
              <h3 className="dsp__label">{group}</h3>
              <div className="dsp__swatches">
                {tokens.map((token) => (
                  <div key={token} className="dsp__swatch">
                    <span style={{ background: `var(${token})` }} />
                    <code>{token}</code>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Container>
      </Section>

      <Section>
        <Container>
          <Heading level={2}>Tipografia</Heading>
          {TYPE.map(([size, token, sample]) => (
            <div key={size} className="dsp__row">
              <code>{token}</code>
              <Heading level={3} size={size}>{sample}</Heading>
            </div>
          ))}
          <div className="dsp__row">
            <code>serif</code>
            <Heading level={3} size="h2" serif>O nome do vento</Heading>
          </div>
          <div className="dsp__row">
            <code>--text-body</code>
            <p className="dsp__body">Corpo de texto em Manrope: acompanhe seu ritmo, suas metas e o caminho até o fim do livro.</p>
          </div>
        </Container>
      </Section>

      <Section tone="raised">
        <Container>
          <Heading level={2}>Botões</Heading>
          {["primary", "secondary", "ghost"].map((variant) => (
            <div key={variant} className="dsp__buttons">
              <code>{variant}</code>
              <Button variant={variant} size="sm">Pequeno</Button>
              <Button variant={variant}>Médio</Button>
              <Button variant={variant} size="lg">Grande</Button>
              <Button variant={variant} disabled>Desabilitado</Button>
              <Button as="a" href="#" variant={variant}>Como link</Button>
            </div>
          ))}
        </Container>
      </Section>

      <Section>
        <Container>
          <Heading level={2}>Espaçamento, raios e sombras</Heading>
          <div className="dsp__group">
            <h3 className="dsp__label">Espaçamento</h3>
            {SPACES.map((token) => (
              <div key={token} className="dsp__space">
                <code>{token}</code>
                <span style={{ width: `var(${token})` }} />
              </div>
            ))}
          </div>
          <div className="dsp__group">
            <h3 className="dsp__label">Raios</h3>
            <div className="dsp__swatches">
              {RADII.map((token) => (
                <div key={token} className="dsp__swatch">
                  <span style={{ borderRadius: `var(${token})`, background: "var(--surface-sunken)", border: "1px solid var(--border-strong)" }} />
                  <code>{token}</code>
                </div>
              ))}
            </div>
          </div>
          <div className="dsp__group">
            <h3 className="dsp__label">Sombras</h3>
            <div className="dsp__swatches">
              {SHADOWS.map((token) => (
                <div key={token} className="dsp__swatch">
                  <span style={{ boxShadow: `var(${token})`, background: "var(--surface-raised)", borderRadius: "var(--radius-md)" }} />
                  <code>{token}</code>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="inverse">
        <Container size="narrow">
          <Heading level={2}>Seção inversa</Heading>
          <p className="dsp__body">Usada para chamadas de destaque, como o CTA final da landing.</p>
          <Button variant="secondary">Criar minha estante</Button>
        </Container>
      </Section>
    </main>
  );
}
