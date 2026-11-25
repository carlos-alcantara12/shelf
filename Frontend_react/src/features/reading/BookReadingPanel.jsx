import { useCallback, useEffect, useState } from "react";
import SpringCheck from "@/components/SpringCheck";
import { apiRequest } from "@/lib/api";
import { formatDuration } from "@/lib/books";
import "./reading-panel.css";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);

/**
 * Momento de leitura de um livro, em duas visões que compartilham o mesmo estado (por isso as duas ficam
 * montadas e só uma aparece): `read` (cronômetro, meta do dia e objetivos da sessão) e `notes` (anotações
 * da sessão e tarefas do livro). A página Progresso só mostra a evolução.
 */
export default function BookReadingPanel({ book, view = "read", onSessionStarted }) {
  const [session, setSession] = useState(null);
  const [goal, setGoal] = useState(30);
  const [goalInput, setGoalInput] = useState("30");
  const [editingGoal, setEditingGoal] = useState(false);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [minutes, setMinutes] = useState("");
  const [pages, setPages] = useState("");
  const [notes, setNotes] = useState({ chapters: "", pages: "" });
  const [taskTitle, setTaskTitle] = useState("");
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [lastSaved, setLastSaved] = useState(null);

  const loadToday = useCallback(
    () => apiRequest("/reading-stats/").then((stats) => setTodayMinutes(stats.daily?.at(-1)?.minutes || 0)),
    [],
  );

  useEffect(() => {
    let active = true;
    Promise.all([
      apiRequest("/reading-sessions/"),
      apiRequest("/reading-goal/"),
      apiRequest(`/reading-tasks/?book=${book.id}`),
      apiRequest("/reading-stats/"),
    ])
      .then(([sessionData, goalData, taskData, stats]) => {
        if (!active) return;
        setSession(sessionData.active);
        setGoal(goalData.target_minutes);
        setGoalInput(String(goalData.target_minutes));
        setTasks(asList(taskData));
        setTodayMinutes(stats.daily?.at(-1)?.minutes || 0);
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [book.id]);

  useEffect(() => {
    if (!session) return undefined;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [session]);

  const elsewhere = Boolean(session && session.book && session.book !== book.id);
  const elapsed = session ? Math.max(0, Math.floor((now - new Date(session.started_at).getTime()) / 1000)) : 0;
  const todaySeconds = todayMinutes * 60 + (session ? elapsed : 0);
  const goalPercent = Math.min(100, Math.round((todaySeconds / (goal * 60)) * 100));
  const sessionPercent = session?.target_minutes ? Math.min(100, Math.round((elapsed / (session.target_minutes * 60)) * 100)) : 0;
  const doneTasks = tasks.filter((task) => task.completed).length;
  const running = Boolean(session) && !elsewhere;

  async function run(action) {
    setSaving(true);
    setError("");
    try {
      await action();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  const start = () => {
    const targetMinutes = minutes === "" ? null : Number(minutes);
    const targetPages = pages === "" ? null : Number(pages);
    if (
      (targetMinutes !== null && (!Number.isInteger(targetMinutes) || targetMinutes < 1 || targetMinutes > 1440)) ||
      (targetPages !== null && (!Number.isInteger(targetPages) || targetPages < 1 || targetPages > 10000))
    ) {
      setError("Confira os objetivos: tempo entre 1 e 1440 minutos e páginas entre 1 e 10000.");
      return;
    }
    run(async () => {
      const data = await apiRequest("/reading-sessions/start/", {
        method: "POST",
        body: JSON.stringify({
          book: book.id,
          target_minutes: targetMinutes,
          target_pages: targetPages,
          chapter_notes: notes.chapters.trim(),
          page_notes: notes.pages.trim(),
        }),
      });
      setSession(data.active);
      setLastSaved(null);
      setNow(Date.now());
      onSessionStarted?.();
    });
  };

  const stop = () =>
    run(async () => {
      const data = await apiRequest("/reading-sessions/stop/", { method: "POST" });
      setSession(null);
      setLastSaved(Math.max(1, Math.round(data.session.duration_seconds / 60)));
      setMinutes("");
      setPages("");
      setNotes({ chapters: "", pages: "" });
      await loadToday();
    });

  const saveGoal = (event) => {
    event.preventDefault();
    const value = Number(goalInput);
    if (!Number.isInteger(value) || value < 1 || value > 1440) {
      setError("Escolha uma meta entre 1 e 1440 minutos por dia.");
      return;
    }
    run(async () => {
      const data = await apiRequest("/reading-goal/", { method: "PATCH", body: JSON.stringify({ target_minutes: value }) });
      setGoal(data.target_minutes);
      setEditingGoal(false);
    });
  };

  const addTask = (event) => {
    event.preventDefault();
    const title = taskTitle.trim();
    if (!title || saving) return;
    run(async () => {
      const task = await apiRequest("/reading-tasks/", { method: "POST", body: JSON.stringify({ title, book: book.id }) });
      setTasks((current) => [task, ...current]);
      setTaskTitle("");
    });
  };

  const toggleTask = (task) =>
    run(async () => {
      const updated = await apiRequest(`/reading-tasks/${task.id}/`, { method: "PATCH", body: JSON.stringify({ completed: !task.completed }) });
      setTasks((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    });

  const removeTask = (task) =>
    run(async () => {
      await apiRequest(`/reading-tasks/${task.id}/`, { method: "DELETE" });
      setTasks((current) => current.filter((item) => item.id !== task.id));
    });

  const hasTargets = session && (session.target_minutes || session.target_pages);
  const hasSessionNotes = session && (session.chapter_notes || session.page_notes);

  return (
    <section className="rp" aria-label={`Momento de leitura de ${book.title}`} aria-busy={loading}>
      <div className="rp-view" hidden={view !== "read"}>
        <div className={`rp-timer${running ? " is-running" : ""}`}>
          <div>
            <p className="rp-kicker">{running ? "lendo agora" : "pronto para ler"}</p>
            <div className="rp-clock" role="timer" aria-live="off">{formatDuration(elsewhere ? 0 : elapsed)}</div>
          </div>
          {elsewhere ? (
            <button type="button" className="rp-btn rp-btn--ink" disabled={saving} onClick={stop}>Encerrar a outra leitura</button>
          ) : (
            <button
              type="button"
              className={`rp-btn rp-btn--main${session ? " is-stop" : ""}`}
              disabled={loading || saving}
              onClick={session ? stop : start}
            >
              {saving ? "…" : session ? "Encerrar" : "Iniciar leitura"}
            </button>
          )}
        </div>

        {elsewhere && <p className="rp-note" role="status">Há uma sessão em andamento em outro livro. Encerre-a para começar esta.</p>}
        {lastSaved && !session && <p className="rp-note rp-note--ok" role="status">Sessão salva: {lastSaved} {lastSaved === 1 ? "minuto" : "minutos"} de leitura.</p>}

        <div className="rp-daily">
          <div className="rp-meter" role="progressbar" aria-label="Meta diária" aria-valuemin={0} aria-valuemax={100} aria-valuenow={goalPercent}>
            <i style={{ width: `${goalPercent}%` }} />
          </div>
          <p>
            <span><strong>{Math.floor(todaySeconds / 60)}</strong> de {goal} min hoje</span>
            <button type="button" className="rp-link" aria-expanded={editingGoal} onClick={() => setEditingGoal((value) => !value)}>Editar meta</button>
          </p>
          {editingGoal && (
            <form className="rp-inline" onSubmit={saveGoal}>
              <label htmlFor="rp-goal">Meta diária</label>
              <input id="rp-goal" type="number" min="1" max="1440" value={goalInput} onChange={(event) => setGoalInput(event.target.value)} />
              <span>min</span>
              <button type="submit" className="rp-btn rp-btn--small" disabled={saving}>Salvar</button>
            </form>
          )}
        </div>

        {!elsewhere && (
          <div className="rp-goals">
            <h4 className="rp-heading">Objetivos da sessão</h4>
            {running ? (
              <ul className="rp-focus" aria-label="Objetivos desta sessão">
                {session.target_minutes && (
                  <li>
                    <span>Tempo: {Math.min(Math.floor(elapsed / 60), session.target_minutes)} / {session.target_minutes} min</span>
                    <div className="rp-meter"><i style={{ width: `${sessionPercent}%` }} /></div>
                  </li>
                )}
                {session.target_pages && <li><span>Páginas: ler {session.target_pages}</span></li>}
                {!hasTargets && <li><span className="rp-muted">Leitura livre, sem metas nesta sessão.</span></li>}
              </ul>
            ) : (
              <div className="rp-fields">
                <label>
                  Tempo
                  <span><input type="number" min="1" max="1440" placeholder={String(goal)} value={minutes} onChange={(event) => setMinutes(event.target.value)} /> min</span>
                </label>
                <label>
                  Páginas
                  <span><input type="number" min="1" max="10000" placeholder="20" value={pages} onChange={(event) => setPages(event.target.value)} /> págs.</span>
                </label>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rp-view" hidden={view !== "notes"}>
        <div className="rp-goals rp-goals--first">
          <h4 className="rp-heading">Anotações da sessão</h4>
          {running ? (
            hasSessionNotes ? (
              <ul className="rp-focus" aria-label="Anotações desta sessão">
                {session.chapter_notes && <li><span><strong>Capítulos:</strong> {session.chapter_notes}</span></li>}
                {session.page_notes && <li><span><strong>Páginas:</strong> {session.page_notes}</span></li>}
              </ul>
            ) : (
              <p className="rp-muted">Nenhuma anotação nesta sessão.</p>
            )
          ) : !elsewhere ? (
            <div className="rp-notes">
              <textarea rows="2" maxLength="5000" aria-label="Anotações de capítulos" placeholder="Capítulo e ideia que deseja guardar…" value={notes.chapters} onChange={(event) => setNotes((current) => ({ ...current, chapters: event.target.value }))} />
              <textarea rows="2" maxLength="5000" aria-label="Anotações de páginas" placeholder="Página e sua anotação…" value={notes.pages} onChange={(event) => setNotes((current) => ({ ...current, pages: event.target.value }))} />
            </div>
          ) : (
            <p className="rp-muted">Encerre a outra leitura para anotar nesta.</p>
          )}
        </div>

        <div className="rp-goals">
          <div className="rp-tasks-head">
            <h4 className="rp-heading">Tarefas deste livro</h4>
            {tasks.length > 0 && <span className="rp-count">{doneTasks} de {tasks.length}</span>}
          </div>
          <form className="rp-inline rp-inline--task" onSubmit={addTask}>
            <label className="rp-sr-only" htmlFor="rp-task">Nova tarefa para {book.title}</label>
            <input id="rp-task" maxLength="160" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Ex.: terminar o capítulo 3" />
            <button type="submit" className="rp-btn rp-btn--small" disabled={saving || !taskTitle.trim()}>Adicionar</button>
          </form>
          {tasks.length > 0 ? (
            <ul className="rp-tasks">
              {tasks.map((task) => (
                <li key={task.id}>
                  <SpringCheck
                    label={task.title}
                    checked={task.completed}
                    disabled={saving}
                    onChange={() => toggleTask(task)}
                    color="#45372b"
                    fillColor="#98543f"
                    checkColor="#ffffff"
                    boxSize={18}
                    boxRadius={5}
                    fontSize={14}
                    doneOpacity={0.45}
                    strike="left"
                  />
                  <button type="button" className="rp-x" aria-label={`Excluir tarefa: ${task.title}`} disabled={saving} onClick={() => removeTask(task)}>×</button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rp-muted">Nenhuma tarefa ainda.</p>
          )}
        </div>
      </div>

      {error && <p className="rp-error" role="alert">{error}</p>}
    </section>
  );
}
