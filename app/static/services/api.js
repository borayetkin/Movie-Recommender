// API endpoints
const API = {
  popular: "/api/movies/popular",
  search: "/api/movies/search",
  details: (id) => `/api/movies/${id}`,
  recommendations: (userId) => `/api/movies/recommendations/${userId}`,
};

// Fetch popular movies
export const fetchPopularMovies = async (page = 1, perPage = 30) => {
  try {
    const response = await fetch(
      `${API.popular}?page=${page}&per_page=${perPage}`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch popular movies (status: ${response.status})`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching popular movies:", error);
    throw error;
  }
};

// Search movies
export const searchMovies = async (query) => {
  try {
    const response = await fetch(
      `${API.search}?query=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch search results");
    }

    const movies = await response.json();

    // Sort movies by vote_average (popularity) in descending order
    return movies.sort((a, b) => b.vote_average - a.vote_average);
  } catch (error) {
    console.error("Error searching movies:", error);
    throw error;
  }
};

// Get movie details
export const getMovieDetails = async (movieId) => {
  if (!movieId) {
    throw new Error("No movie ID provided");
  }

  try {
    const response = await fetch(API.details(movieId));

    if (!response.ok) {
      throw new Error(
        `Failed to fetch movie details (status: ${response.status})`
      );
    }

    const movie = await response.json();

    if (!movie || !movie.id) {
      throw new Error("Invalid movie data received");
    }

    // Ensure poster_url and backdrop_url are properly set
    if (movie.poster_path && !movie.poster_url) {
      movie.poster_url = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
    }

    if (movie.backdrop_path && !movie.backdrop_url) {
      movie.backdrop_url = `https://image.tmdb.org/t/p/original${movie.backdrop_path}`;
    }

    return movie;
  } catch (error) {
    console.error("Error loading movie details:", error);
    throw error;
  }
};

export default API;
