import { useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/app/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { answeredCount, clearDraft, loadDraft, saveProfile } from "@/lib/diagnostic";
import AuthLayout from "../login/AuthLayout";
import LoginBook from "../login/LoginBook";
import "./signup.css";

/**
 * Último passo do fluxo de "Criar conta": cria a conta e, se a pessoa respondeu o
 * diagnóstico, envia o perfil ao servidor. Quem pulou o diagnóstico cria a conta direto.
 */
export default function SignUpPage() {
  const navigate = useNavigate();
  const { isAuthenticated, signIn } = useAuth();
  const alreadySignedIn = useRef(isAuthenticated);
  const [draft] = useState(loadDraft);
  const hasProfile = answeredCount(draft) > 0;
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profileError, setProfileError] = useState("");

  async function finish() {
    await saveProfile({ answers: draft.answers });
    clearDraft();
    navigate("/biblioteca", { replace: true });
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signIn({ username, email, password, register: true });
    } catch (requestError) {
      setError(requestError.message);
      setLoading(false);
      return;
    }
    // A conta já existe; se o perfil falhar, a pessoa pode tentar de novo sem perder as respostas.
    try {
      if (hasProfile) await finish();
      else navigate("/biblioteca", { replace: true });
    } catch (profileFailure) {
      setProfileError(profileFailure.message);
      setLoading(false);
    }
  }

  async function retryProfile() {
    setLoading(true);
    setProfileError("");
    try {
      await finish();
    } catch (profileFailure) {
      setProfileError(profileFailure.message);
      setLoading(false);
    }
  }

  if (alreadySignedIn.current) return <Navigate to="/biblioteca" replace />;

  const aside = hasProfile ? (
    <div className="signup-aside">
      <div className="login-story__art login-story__art--small" aria-hidden="true">
        <LoginBook />
      </div>
      <p className="signup-aside__eyebrow">Seu perfil de leitor está pronto</p>
      <h2>Falta só criar a conta para guardá-lo.</h2>
      <p>Suas respostas são enviadas ao servidor somente agora, junto com a criação da conta.</p>
    </div>
  ) : (
    <div className="signup-aside">
      <div className="login-story__art" aria-hidden="true">
        <LoginBook />
      </div>
      <h2>Comece a sua estante.</h2>
      <p>
        Quer indicações que combinam com você? <Link to="/diagnostico">Faça o perfil de leitor</Link>, leva poucos minutos.
      </p>
    </div>
  );

  return (
    <AuthLayout aside={aside} asideLabel="Sobre o seu perfil de leitor">
      <Card as="section" className="login-card" aria-labelledby="signup-title">
        <CardHeader className="login-card__header">
          <CardTitle as="h1" id="signup-title">Abra sua primeira estante.</CardTitle>
        </CardHeader>

        <CardContent className="login-card__content">
          {profileError ? (
            <div className="signup-retry" role="alert">
              <Alert variant="destructive" className="login-alert"><AlertDescription>Sua conta foi criada, mas não foi possível salvar o perfil agora: {profileError}</AlertDescription></Alert>
              <Button className="login-submit-button" size="lg" onClick={retryProfile} disabled={loading}>
                {loading ? "salvando…" : "tentar salvar de novo"}
              </Button>
              <button type="button" className="signup-linkbutton" onClick={() => navigate("/biblioteca", { replace: true })}>
                Continuar sem salvar o perfil
              </button>
            </div>
          ) : (
            <form className="login-form" onSubmit={submit} aria-describedby={error ? "signup-error" : undefined}>
              <Field>
                <FieldLabel htmlFor="signup-username">Nome de usuário</FieldLabel>
                <Input id="signup-username" name="username" autoFocus autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="signup-email">E-mail</FieldLabel>
                <Input id="signup-email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="signup-password">Senha</FieldLabel>
                <div className="password-field">
                  <Input id="signup-password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} aria-describedby="signup-password-hint" />
                  <Button type="button" variant="ghost" size="sm" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-pressed={showPassword}>
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </Button>
                </div>
                <FieldDescription id="signup-password-hint" className="password-hint">Use pelo menos 8 caracteres.</FieldDescription>
              </Field>
              {error && <Alert id="signup-error" variant="destructive" className="login-alert"><AlertDescription>{error}</AlertDescription></Alert>}
              <Button className="login-submit-button" type="submit" size="lg" disabled={loading}>
                {loading ? "aguarde…" : hasProfile ? "criar conta e salvar perfil" : "criar minha conta"}
                {!loading && <span aria-hidden="true">↗</span>}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="login-card__footer">
          <span>Já tem uma conta?</span>
          <Link className="ui-button ui-button--link ui-button--sm" to="/entrar">
            Entrar
          </Link>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
