import MovieCard from "/static/components/MovieCard.js";
import {
  fetchPopularMovies,
  searchMovies,
  getMovieDetails,
  getMovieCredits,
  getMovieRecommendations,
} from "/static/services/api.js";
import {
  formatRating,
  formatDate,
  formatGenres,
} from "/static/utils/formatting.js";

// API endpoints
const API = {
  popular: "/api/movies/popular",
  search: "/api/movies/search",
  details: (id) => `/api/movies/${id}`,
  recommendations: (userId) => `/api/movies/recommendations/${userId}`,
};

// Main Vue app
const app = Vue.createApp({
  components: {
    "movie-card": MovieCard,
  },
  data() {
    return {
      // State
      currentPage: 1,
      isLoadingMore: false,
      isDarkTheme: true,
      heroBackgroundUrl: "",
      totalPages: 10,
      showingRecommendationsView: false,

      // Movies data
      popularMovies: [],
      recommendedMovies: [],
      searchResults: [],
      movieRecommendations: [],

      // UI state
      searchQuery: "",
      showSearchResults: false,
      isSearchLoading: false,
      isRecommendationsLoading: false,
      loadingError: false,
      recommendationsError: false,

      // Search debounce
      searchTimeout: null,

      // Add a cache for movie details
      movieDetailsCache: {},

      // Modal and selected movie
      selectedMovie: null,
      isMovieDetailsLoading: false,
      movieDetailsError: false,
      isInitialLoading: false,
    };
  },
  computed: {
    heroBackgroundStyle() {
      return this.heroBackgroundUrl
        ? { backgroundImage: `url('${this.heroBackgroundUrl}')` }
        : {};
    },
    selectedMovieBackdrop() {
      if (!this.selectedMovie) return {};

      const backdropUrl = this.selectedMovie.backdrop_url
        ? this.selectedMovie.backdrop_url
        : this.selectedMovie.backdrop_path
        ? `https://image.tmdb.org/t/p/original${this.selectedMovie.backdrop_path}`
        : null;

      if (!backdropUrl) return {};
      return { backgroundImage: `url('${backdropUrl}')` };
    },
    selectedMoviePoster() {
      if (!this.selectedMovie) return "/static/no-poster.jpg";

      let posterUrl = null;

      // Try to get the poster URL from various possible sources
      if (
        this.selectedMovie.poster_url &&
        this.selectedMovie.poster_url.includes("http")
      ) {
        posterUrl = this.selectedMovie.poster_url;
      } else if (this.selectedMovie.poster_path) {
        posterUrl = `https://image.tmdb.org/t/p/w500${this.selectedMovie.poster_path}`;
      }

      return posterUrl || "/static/no-poster.jpg";
    },
    paginationPages() {
      const pages = [];
      const maxVisible = 7; // Maximum number of page buttons to show

      if (this.totalPages <= maxVisible) {
        // If we have fewer pages than max visible, show all of them
        for (let i = 1; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Always show first page
        pages.push(1);

        // Calculate start and end of the visible page range
        let start = Math.max(2, this.currentPage - 2);
        let end = Math.min(this.totalPages - 1, this.currentPage + 2);

        // Adjust start and end to ensure we show maxVisible - 2 pages (excluding first and last)
        const visibleCount = maxVisible - 2; // Number of pages to show between first and last

        if (end - start + 1 < visibleCount) {
          if (start === 2) {
            // We're close to the start, so extend the end
            end = Math.min(start + visibleCount - 1, this.totalPages - 1);
          } else if (end === this.totalPages - 1) {
            // We're close to the end, so extend the start
            start = Math.max(end - visibleCount + 1, 2);
          } else {
            // We're in the middle, so center around current page
            const half = Math.floor(visibleCount / 2);
            start = Math.max(this.currentPage - half, 2);
            end = Math.min(this.currentPage + half, this.totalPages - 1);
          }
        }

        // Add ellipsis if needed
        if (start > 2) {
          pages.push("...");
        }

        // Add visible pages
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }

        // Add ellipsis if needed
        if (end < this.totalPages - 1) {
          pages.push("...");
        }

        // Always show last page
        pages.push(this.totalPages);
      }

      return pages;
    },
    directors() {
      if (!this.selectedMovie || !this.selectedMovie.credits) {
        return "";
      }
      const crew = this.selectedMovie.credits.crew || [];
      const directors = crew.filter((member) => member.job === "Director");
      return directors.map((d) => d.name).join(", ");
    },
  },
  async mounted() {
    this.isInitialLoading = true;
    try {
      await this.loadPopularMovies();
      await this.setHeroBackground();
    } finally {
      this.isInitialLoading = false;
      this.setupSearchWatcher();
    }
  },
  methods: {
    // Format utilities
    formatRating,
    formatDate,
    formatGenres,

    // Data loading methods
    async loadPopularMovies() {
      // Add transition class to movie grid if it exists
      const movieGrid = document.querySelector(".movie-grid");
      if (movieGrid) {
        movieGrid.style.opacity = "0";
        setTimeout(() => {
          movieGrid.style.opacity = "1";
        }, 100);
      }

      this.isLoadingMore = true;
      this.loadingError = false;

      // Clear previous movies when changing pages
      this.popularMovies = [];

      try {
        console.log(`Loading page ${this.currentPage} of popular movies`);
        this.popularMovies = await fetchPopularMovies(this.currentPage, 30);

        // Update total pages if needed (limited to reasonable number)
        // This assumes the API tells us there are at least 10 pages
      } catch (error) {
        console.error("Error loading popular movies:", error);
        this.loadingError = true;
      } finally {
        this.isLoadingMore = false;

        // Only smooth scroll to movies section when changing pages
        if (this.currentPage > 1) {
          this.$nextTick(() => {
            const movieSection = document.getElementById("popularMovies");
            if (movieSection) {
              movieSection.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }
          });
        }
      }
    },

    async handleSearch() {
      const query = this.searchQuery.trim();
      if (!query) {
        this.showSearchResults = false;
        this.searchResults = [];
        return;
      }

      this.isSearchLoading = true;
      // Apply searching class to the search container for animation
      const heroSearchContainer = document.querySelector(
        ".hero-section .search-container"
      );
      if (heroSearchContainer) {
        heroSearchContainer.classList.add("searching");
      }

      this.showSearchResults = true;

      // Scroll to search results if we're submitting via button or enter key
      setTimeout(() => {
        // Add smooth transition to search results
        document
          .getElementById("searchResults")
          .scrollIntoView({ behavior: "smooth" });
      }, 300);

      try {
        this.searchResults = await searchMovies(query);
      } catch (error) {
        console.error("Error searching movies:", error);
        this.searchResults = [];
      } finally {
        this.isSearchLoading = false;
        // Remove searching class after loading
        if (heroSearchContainer) {
          heroSearchContainer.classList.remove("searching");
        }
      }
    },

    async showMovieDetails(movieId) {
      try {
        // Reset state first
        const previousMovie = this.selectedMovie;
        this.movieDetailsError = false;
        this.isMovieDetailsLoading = true;
        this.showingRecommendationsView = false;

        // If we're already viewing a movie, reset the selected movie first
        // to avoid showing the previous movie while loading
        if (previousMovie && previousMovie.id !== movieId) {
          // Create a temporary clone with only essential info
          this.selectedMovie = {
            id: movieId,
            title: "Loading...",
            poster_url: null,
            backdrop_url: null,
          };
        }

        document.body.style.overflow = "hidden";

        // Check if we have this movie in cache
        if (this.movieDetailsCache[movieId]) {
          this.selectedMovie = this.movieDetailsCache[movieId];
          this.isMovieDetailsLoading = false;

          // Pre-load recommendations without showing them
          if (!this.showingRecommendationsView) {
            this.loadMovieRecommendations(movieId);
          }
          return;
        }

        // Fetch details and credits in parallel
        const [movieData, creditsData] = await Promise.all([
          getMovieDetails(movieId),
          getMovieCredits(movieId),
        ]);
        movieData.credits = creditsData;

        // Extract director information
        if (creditsData && creditsData.crew) {
          const directors = creditsData.crew
            .filter((person) => person.job === "Director")
            .map((director) => director.name);

          if (directors.length > 0) {
            movieData.director = directors.join(", ");
          }
        }

        this.selectedMovie = movieData;
        // Cache the movie details for future use
        this.movieDetailsCache[movieId] = movieData;

        // Pre-load recommendations without showing them
        if (!this.showingRecommendationsView) {
          this.loadMovieRecommendations(movieId);
        }

        console.log("Loading movie details for ID:", movieId);
      } catch (error) {
        console.error("Error loading movie details:", error);
        this.movieDetailsError = true;
      } finally {
        this.isMovieDetailsLoading = false;
      }
    },

    // Load item-based movie recommendations without switching view
    async loadMovieRecommendations(movieId) {
      this.isRecommendationsLoading = true;
      this.recommendationsError = false;
      try {
        const recs = await getMovieRecommendations(movieId);
        this.movieRecommendations = recs.slice(0, 4);
      } catch (error) {
        console.error("Error fetching item-based recommendations:", error);
        this.recommendationsError = true;
      } finally {
        this.isRecommendationsLoading = false;
      }
    },

    // Show the recommendations view
    showRecommendations(movieId) {
      // If we already have recommendations, just show them
      if (this.movieRecommendations.length > 0) {
        this.showingRecommendationsView = true;
        return;
      }

      // Otherwise load and then show
      this.loadMovieRecommendations(movieId).then(() => {
        this.showingRecommendationsView = true;
      });
    },

    // UI interaction methods
    clearSearch() {
      this.showSearchResults = false;
      this.searchQuery = "";
      this.searchResults = [];

      // Make sure hero section is displayed
      this.$nextTick(() => {
        document.querySelector(".hero-section").style.display = "flex";
      });
    },

    retryLoading() {
      this.loadingError = false;
      this.loadPopularMovies();
    },

    closeModal() {
      this.selectedMovie = null;
      this.showingRecommendationsView = false;
      document.body.style.overflow = "auto";
    },

    toggleTheme() {
      this.isDarkTheme = !this.isDarkTheme;

      if (this.isDarkTheme) {
        document.documentElement.style.setProperty(
          "--primary-color",
          "#121212"
        );
        document.documentElement.style.setProperty(
          "--secondary-color",
          "#1e1e1e"
        );
        document.documentElement.style.setProperty("--text-color", "#ffffff");
      } else {
        document.documentElement.style.setProperty(
          "--primary-color",
          "#f5f5f5"
        );
        document.documentElement.style.setProperty(
          "--secondary-color",
          "#ffffff"
        );
        document.documentElement.style.setProperty("--text-color", "#333333");
      }
    },

    // Utility methods
    handleImageError(event) {
      event.target.src = "/static/no-poster.jpg";
    },

    // Pagination methods
    goToPage(page) {
      if (page === "..." || page === this.currentPage) return;

      this.currentPage = page;
      this.loadPopularMovies();
    },

    async setHeroBackground() {
      try {
        const movies = await fetchPopularMovies(1);

        if (movies && movies.length > 0) {
          // Find a movie with a good backdrop
          const featuredMovie =
            movies.find(
              (movie) =>
                movie.backdrop_url && movie.backdrop_url.includes("https")
            ) || movies[0];
          if (featuredMovie.backdrop_url) {
            this.heroBackgroundUrl = featuredMovie.backdrop_url;
          }
        }
      } catch (error) {
        console.error("Could not set hero background:", error);
      }
    },

    setupSearchWatcher() {
      // Watch for changes in the search input
      this.$watch("searchQuery", (newQuery) => {
        // Clear any existing timeout
        if (this.searchTimeout) {
          clearTimeout(this.searchTimeout);
        }

        if (!newQuery.trim()) {
          this.showSearchResults = false;
          this.searchResults = [];
          return;
        }

        // Set a new timeout to debounce the API call
        this.searchTimeout = setTimeout(() => {
          this.handleSearch();
        }, 300); // 300ms debounce
      });
    },

    showDetailsView() {
      this.showingRecommendationsView = false;
    },
  },
});

// Mount Vue app
app.mount("#app");
