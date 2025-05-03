import MovieCard from "/static/components/MovieCard.js";
import {
  fetchPopularMovies,
  searchMovies,
  getMovieDetails,
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

      // Movies data
      popularMovies: [],
      recommendedMovies: [],
      searchResults: [],

      // UI state
      searchQuery: "",
      showSearchResults: false,
      isSearchLoading: false,
      isRecommendationsLoading: false,
      loadingError: false,

      // Search debounce
      searchTimeout: null,

      // Modal and selected movie
      selectedMovie: null,
      isMovieDetailsLoading: false,
      movieDetailsError: false,
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
  },
  mounted() {
    this.loadPopularMovies();
    this.setHeroBackground();
    this.setupSearchWatcher();
  },
  methods: {
    // Format utilities
    formatRating,
    formatDate,
    formatGenres,

    // Data loading methods
    async loadPopularMovies() {
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
      this.showSearchResults = true;

      // Scroll to search results if we're submitting via button or enter key
      setTimeout(() => {
        document
          .getElementById("searchResults")
          .scrollIntoView({ behavior: "smooth" });
      }, 100);

      try {
        this.searchResults = await searchMovies(query);
      } catch (error) {
        console.error("Error searching movies:", error);
        this.searchResults = [];
      } finally {
        this.isSearchLoading = false;
      }
    },

    async showMovieDetails(movieId) {
      try {
        // First show the modal with loading state
        this.movieDetailsError = false;
        this.isMovieDetailsLoading = true;
        this.selectedMovie = {
          id: movieId,
          title: "Loading...",
          poster_path: null,
          backdrop_path: null,
          poster_url: null,
          backdrop_url: null,
        };
        document.body.style.overflow = "hidden";

        console.log("Loading movie details for ID:", movieId);

        this.selectedMovie = await getMovieDetails(movieId);
      } catch (error) {
        console.error("Error loading movie details:", error);
        this.movieDetailsError = true;
      } finally {
        this.isMovieDetailsLoading = false;
      }
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
  },
});

// Mount Vue app
app.mount("#app");
