const { nanoid } = require('nanoid');
const fs = require('fs');
const path = require('path');

const booksDataPath = path.resolve(__dirname, '../data/books.json');

let books = [];

const loadBooksData = () => {
  try {
    const data = fs.readFileSync(booksDataPath, 'utf8');
    books = JSON.parse(data);
  } catch (error) {
    console.error('Error reading or parsing books data:', error.message);
    books = [];
  }
};

const saveBooksData = () => {
  try {
    const data = JSON.stringify(books, null, 2);
    fs.writeFileSync(booksDataPath, data);
  } catch (error) {
    console.error('Error saving books data:', error.message);
  }
};

const validateBookData = (data) => {
  if (!data.name) {
    return {
      isValid: false,
      message: 'Gagal menambahkan buku. Mohon isi nama buku',
    };
  }

  if (data.readPage > data.pageCount) {
    return {
      isValid: false,
      message: 'Gagal menambahkan buku. readPage tidak boleh lebih besar dari pageCount',
    };
  }

  return {
    isValid: true,
  };
};

const addBookHandler = (request, h) => {
  const { payload } = request;
  const { name, year, author, summary, publisher, pageCount, readPage, reading } = payload;

  const validationResult = validateBookData(payload);
  if (!validationResult.isValid) {
    return h.response({
      status: 'fail',
      message: validationResult.message,
    }).code(400);
  }

  const id = nanoid();
  const finished = pageCount === readPage;
  const insertedAt = new Date().toISOString();
  const updatedAt = insertedAt;

  const newBook = { id, name, year, author, summary, publisher, pageCount, readPage, finished, reading, insertedAt, updatedAt };
  books.push(newBook);

  saveBooksData();

  return h.response({
    status: 'success',
    message: 'Buku berhasil ditambahkan',
    data: {
      bookId: id,
    },
  }).code(201);
};

const getAllBooksHandler = (request, h) => {
  let filteredBooks = [...books];
  const { name, reading, finished } = request.query;

  if (name) {
    const searchName = name.toLowerCase();
    filteredBooks = filteredBooks.filter(book =>
      book.name.toLowerCase().includes(searchName)
    );
  }

  if (reading !== undefined) {
    const isReading = reading === '1';
    filteredBooks = filteredBooks.filter(book =>
      book.reading === isReading
    );
  }

  if (finished !== undefined) {
    const isFinished = finished === '1';
    filteredBooks = filteredBooks.filter(book =>
      book.finished === isFinished
    );
  }

  const responseBooks = filteredBooks.map(({ id, name, publisher }) => ({
    id,
    name,
    publisher,
  }));

  return {
    status: 'success',
    data: {
      books: responseBooks,
    },
  };
};

const getBookByIdHandler = (request, h) => {
  const { bookId } = request.params;
  const book = books.find(b => b.id === bookId);

  if (!book) {
    return h.response({
      status: 'fail',
      message: 'Buku tidak ditemukan',
    }).code(404);
  }

  return {
    status: 'success',
    data: {
      book,
    },
  };
};

const updateBookByIdHandler = (request, h) => {
  const { bookId } = request.params;
  const {
    name,
    year,
    author,
    summary,
    publisher,
    pageCount,
    readPage,
    reading,
  } = request.payload;
  const updatedAt = new Date().toISOString();

  if (!name) {
    return h.response({
      status: 'fail',
      message: 'Gagal memperbarui buku. Mohon isi nama buku',
    }).code(400);
  }

  if (readPage > pageCount) {
    return h.response({
      status: 'fail',
      message: 'Gagal memperbarui buku. readPage tidak boleh lebih besar dari pageCount',
    }).code(400);
  }

  const index = books.findIndex((book) => book.id === bookId);

  if (index !== -1) {
    books[index] = {
      ...books[index],
      name,
      year,
      author,
      summary,
      publisher,
      pageCount,
      readPage,
      reading,
      updatedAt,
    };

    saveBooksData();

    return h.response({
      status: 'success',
      message: 'Buku berhasil diperbarui',
    }).code(200);
  }

  return h.response({
    status: 'fail',
    message: 'Gagal memperbarui buku. Id tidak ditemukan',
  }).code(404);
};

const deleteBookByIdHandler = (request, h) => {
  const { bookId } = request.params;
  const initialLength = books.length;

  books = books.filter(b => b.id !== bookId);

  if (books.length === initialLength) {
    return h.response({
      status: 'fail',
      message: 'Buku gagal dihapus. Id tidak ditemukan',
    }).code(404);
  }

  saveBooksData();

  return h.response({
    status: 'success',
    message: 'Buku berhasil dihapus',
  });
};

module.exports = [
  { method: 'POST', path: '/books', handler: addBookHandler },
  { method: 'GET', path: '/books', handler: getAllBooksHandler },
  { method: 'GET', path: '/books/{bookId}', handler: getBookByIdHandler },
  { method: 'PUT', path: '/books/{bookId}', handler: updateBookByIdHandler },
  { method: 'DELETE', path: '/books/{bookId}', handler: deleteBookByIdHandler },
];
