import { useCallback, useState } from "react";
import OptionWheel from "./OptionWheel";
import "./GenreExplorer.css";

const GENRES = [
  {
    name: "Terror",
    palette: "horror",
    books: [
      { title: "Frankenstein", author: "Mary Shelley", mark: "1818" },
      { title: "Drácula", author: "Bram Stoker", mark: "1897" },
      { title: "O Médico e o Monstro", author: "R. L. Stevenson", mark: "1886" },
    ],
  },
  {
    name: "Suspense",
    palette: "suspense",
    books: [
      { title: "O Cão dos Baskervilles", author: "Arthur Conan Doyle", mark: "SHERLOCK HOLMES" },
      { title: "Os Crimes da Rua Morgue", author: "Edgar Allan Poe", mark: "1841" },
      { title: "A Paciente Silenciosa", author: "Alex Michaelides", mark: "UM THRILLER" },
    ],
  },
  {
    name: "Biografias",
    palette: "biography",
    books: [
      { title: "O Diário de Anne Frank", author: "Anne Frank", mark: "1947" },
      { title: "Educada", author: "Tara Westover", mark: "MEMÓRIAS" },
      { title: "Longa Caminhada até a Liberdade", author: "Nelson Mandela", mark: "AUTOBIOGRAFIA" },
    ],
  },
  {
    name: "Clássicos",
    palette: "classic",
    books: [
      { title: "Dom Casmurro", author: "Machado de Assis", mark: "1899" },
      { title: "O Grande Gatsby", author: "F. Scott Fitzgerald", mark: "1925" },
      { title: "A Metamorfose", author: "Franz Kafka", mark: "1915" },
    ],
  },
  {
    name: "Romance",
    palette: "romance",
    books: [
      { title: "Orgulho e Preconceito", author: "Jane Austen", mark: "1813" },
      { title: "Persuasão", author: "Jane Austen", mark: "1817" },
      { title: "Jane Eyre", author: "Charlotte Brontë", mark: "1847" },
    ],
  },
  {
    name: "Fantasia",
    palette: "fantasy",
    books: [
      { title: "O Hobbit", author: "J. R. R. Tolkien", mark: "1937" },
      { title: "Alice no País das Maravilhas", author: "Lewis Carroll", mark: "1865" },
      { title: "O Feiticeiro de Terramar", author: "Ursula K. Le Guin", mark: "1968" },
    ],
  },
];
const GENRE_NAMES = GENRES.map((genre) => genre.name);

function BookObject({ book, index }) {
  return (
    <article className={`genre-book genre-book--${index + 1}`} role="img" aria-label={`${book.title}, de ${book.author}`}>
      <div className="genre-book__object">
        <span className="genre-book__pages" aria-hidden="true" />
        <span className="genre-book__spine" aria-hidden="true" />
        <div className="genre-book__cover">
          <span className="genre-book__mark">{book.mark}</span>
          <span className="genre-book__art" aria-hidden="true"><i /><i /><i /></span>
          <span className="genre-book__title">{book.title}</span>
          <span className="genre-book__author">{book.author}</span>
          <span className="genre-book__publisher" aria-hidden="true">SHELF · EDIÇÕES</span>
        </div>
      </div>
    </article>
  );
}

export default function GenreExplorer({ sectionRef }) {
  const [selectedIndex, setSelectedIndex] = useState(2);
  const activeGenre = GENRES[selectedIndex];
  const handleChange = useCallback((index) => setSelectedIndex(index), []);

  return (
    <section ref={sectionRef} className="genre-explorer" aria-labelledby="genre-explorer-title">
      <div className="genre-explorer__left">
        <h2 id="genre-explorer-title">Explore por gênero</h2>
        <div className="genre-explorer__wheel">
          <OptionWheel
            items={GENRE_NAMES}
            defaultSelected={2}
            onChange={handleChange}
            textColor="#cbc9c6"
            activeColor="#161519"
            side="left"
            fontSize={2.55}
            spacing={1.36}
            curve={1.05}
            tilt={6}
            blur={1.2}
            fade={0.23}
            minOpacity={0.12}
            smoothing={210}
            inset={0}
            loop={false}
            draggable
            className="genre-explorer__option-wheel"
          />
        </div>
      </div>

      <div className={`genre-books genre-books--${activeGenre.palette}`} role="region" aria-live="polite" aria-label={`Livros de ${activeGenre.name}`}>
        <div key={activeGenre.name} className="genre-books__stage">
          <span className="genre-books__halo" aria-hidden="true" />
          <span className="genre-books__floor" aria-hidden="true" />
          {activeGenre.books.map((book, index) => <BookObject key={book.title} book={book} index={index} />)}
        </div>
      </div>
    </section>
  );
}
