// API endpoints
const API = {
  popular: "/api/movies/popular",
  search: "/api/movies/search",
  details: (id) => `/api/movies/${id}`,
  recommendations: (userId) => `/api/movies/recommendations/${userId}`,
};

// Add cache variables
const movieCache = {
  popular: {},
  search: {},
  details: {},
  credits: {},
};

// Cache expiration time (15 minutes)
const CACHE_EXPIRATION = 15 * 60 * 1000;

// Fetch popular movies
export const fetchPopularMovies = async (page = 1, perPage = 30) => {
  try {
    // Check cache first
    const cacheKey = `${page}-${perPage}`;
    const cached = movieCache.popular[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRATION) {
      console.log("Using cached popular movies");
      return cached.data;
    }

    const response = await fetch(
      `${API.popular}?page=${page}&per_page=${perPage}`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch popular movies (status: ${response.status})`
      );
    }

    const data = await response.json();

    // Cache the result
    movieCache.popular[cacheKey] = {
      data,
      timestamp: Date.now(),
    };

    return data;
  } catch (error) {
    console.error("Error fetching popular movies:", error);
    throw error;
  }
};

// Search movies
export const searchMovies = async (query) => {
  try {
    // Check cache first
    const cacheKey = query.toLowerCase().trim();
    const cached = movieCache.search[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRATION) {
      console.log("Using cached search results");
      return cached.data;
    }

    const response = await fetch(
      `${API.search}?query=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch search results");
    }

    const movies = await response.json();

    // Sort movies by vote_average (popularity) in descending order
    const sortedMovies = movies.sort((a, b) => b.vote_average - a.vote_average);

    // Cache the result
    movieCache.search[cacheKey] = {
      data: sortedMovies,
      timestamp: Date.now(),
    };

    return sortedMovies;
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
    // Check cache first
    const cached = movieCache.details[movieId];
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRATION) {
      console.log("Using cached movie details");
      return cached.data;
    }

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

    // Cache the result
    movieCache.details[movieId] = {
      data: movie,
      timestamp: Date.now(),
    };

    return movie;
  } catch (error) {
    console.error("Error loading movie details:", error);
    throw error;
  }
};

// Get movie credits
export const getMovieCredits = async (movieId) => {
  try {
    // Check cache first
    const cached = movieCache.credits[movieId];
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRATION) {
      console.log("Using cached movie credits");
      return cached.data;
    }

    const response = await fetch(`/api/movies/${movieId}/credits`);
    if (!response.ok)
      throw new Error(`Failed to fetch credits (status: ${response.status})`);

    const data = await response.json();

    // Cache the result
    movieCache.credits[movieId] = {
      data,
      timestamp: Date.now(),
    };

    return data;
  } catch (error) {
    console.error("Error fetching movie credits:", error);
    throw error;
  }
};

// Get recommendations for a movie (TMDB item-based)
export const getMovieRecommendations = async (movieId) => {
  try {
    const response = await fetch(`/api/movies/${movieId}/recommendations`);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch recommendations (status: ${response.status})`
      );
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching movie recommendations:", error);
    throw error;
  }
};

export default API;
