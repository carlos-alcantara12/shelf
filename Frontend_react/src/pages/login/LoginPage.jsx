import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/app/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import StrokeText from "@/components/StrokeText";
import TextType from "@/components/TextType";
import { getStoredUsername } from "@/lib/api";
import AuthLayout from "./AuthLayout";
import LoginBook from "./LoginBook";

// Cor de destaque padrão do sistema (terracota), a mesma de --color-terracotta-600.
const ACCENT = "#98543f";

/** Entrar com uma conta existente. Quem não tem conta é levado ao diagnóstico, que termina no cadastro. */
export default function LoginPage() {
  const { isAuthenticated, signIn } = useAuth();
  const [username, setUsername] = useState(() => getStoredUsername());
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submitAccess(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signIn({ username, password });
      setPassword("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  if (isAuthenticated) return <Navigate to="/biblioteca" replace />;

  const aside = (
    <>
      <div className="login-story__art" aria-hidden="true">
        <LoginBook />
      </div>
      <h2>
        <TextType as="span" text={"Bom ver você de volta."} typingSpeed={46} initialDelay={350} loop={false} typeEffect="fade" cursorStyle="bar" cursorColor={ACCENT} cursorGlide />
      </h2>
      <p>
        <TextType as="span" text={"Seus livros e o ponto em que você parou estão aqui."} typingSpeed={34} initialDelay={1250} loop={false} typeEffect="fade" cursorStyle="bar" cursorColor={ACCENT} cursorGlide />
      </p>
    </>
  );

  return (
    <AuthLayout aside={aside}>
      <Card as="section" className="login-card" aria-labelledby="library-title">
        <CardHeader className="login-card__header">
          <CardTitle as="h1" id="library-title" className="login-title__single-line">
            <StrokeText text="Seja bem-vindo(a)" strokeColor={ACCENT} className="login-title__stroke" style={{ display: "inline-block", width: "var(--stroke-text-width)", verticalAlign: "baseline", lineHeight: 1 }} />
          </CardTitle>
        </CardHeader>

        <CardContent className="login-card__content">
          <form className="login-form" onSubmit={submitAccess} aria-describedby={error ? "login-error" : undefined}>
            <Field>
              <FieldLabel htmlFor="login-username">Nome de usuário</FieldLabel>
              <Input id="login-username" name="username" autoFocus autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="login-password">Senha</FieldLabel>
              <div className="password-field">
                <Input id="login-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
                <Button type="button" variant="ghost" size="sm" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-pressed={showPassword}>
                  {showPassword ? "Ocultar" : "Mostrar"}
                </Button>
              </div>
            </Field>
            {error && <Alert id="login-error" variant="destructive" className="login-alert"><AlertDescription>{error}</AlertDescription></Alert>}
            <Button className="login-submit-button" type="submit" size="lg" disabled={loading}>
              {loading ? "aguarde…" : "abrir minha estante"}
              {!loading && <span aria-hidden="true">↗</span>}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="login-card__footer">
          <span>Primeira visita?</span>
          <Link className="ui-button ui-button--link ui-button--sm" to="/diagnostico">
            Criar conta
          </Link>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
