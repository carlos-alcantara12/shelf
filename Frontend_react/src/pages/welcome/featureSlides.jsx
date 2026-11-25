import ProgressDemo from "./demos/ProgressDemo";
import SearchDemo from "./demos/SearchDemo";
import ShelfDemo from "./demos/ShelfDemo";
import TimerDemo from "./demos/TimerDemo";
import "./demos/demos.css";

// Recursos exibidos no carrossel da abertura. `media` é a prévia animada de cada um.
export const featureSlides = [
  {
    id: "estante",
    title: "Organize sua estante",
    description: "Separe o que você está lendo, o que quer ler e o que já terminou.",
    media: <ShelfDemo />,
  },
  {
    id: "progresso",
    title: "Registre as páginas que leu",
    description: "Informe onde parou e veja quanto falta para terminar o livro.",
    media: <ProgressDemo />,
  },
  {
    id: "sessoes",
    title: "Cronometre a leitura",
    description: "Ligue o cronômetro quando começar a ler e o Shelf soma o tempo de cada sessão.",
    media: <TimerDemo />,
  },
  {
    id: "descoberta",
    title: "Ache o próximo livro",
    description: "Busque por título, autor ou gênero e salve o livro na lista de desejos.",
    media: <SearchDemo />,
  },
];
