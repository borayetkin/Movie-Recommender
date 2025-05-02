export default {
  name: "MovieCard",
  props: {
    movie: {
      type: Object,
      required: true,
    },
  },
  computed: {
    posterUrl() {
      return this.movie.poster_url && this.movie.poster_url.includes("http")
        ? this.movie.poster_url
        : "/static/no-poster.jpg";
    },
    formattedRating() {
      return this.movie.vote_average
        ? this.movie.vote_average.toFixed(1)
        : "N/A";
    },
    movieYear() {
      if (!this.movie.release_date) return "";
      return new Date(this.movie.release_date).getFullYear();
    },
    truncatedOverview() {
      if (!this.movie.overview) return "";
      return this.movie.overview.length > 150
        ? this.movie.overview.substring(0, 150) + "..."
        : this.movie.overview;
    },
  },
  methods: {
    handleImageError(event) {
      event.target.src = "/static/no-poster.jpg";
    },
    handleClick(event) {
      // Prevent event from bubbling up to avoid double fires
      event.stopPropagation();
      this.$emit("click");
    },
  },
  template: `
    <div
      class="movie-card"
      @click.prevent="handleClick"
      role="button"
      tabindex="0"
    >
      <div class="poster-container">
        <img
          :src="posterUrl"
          :alt="movie.title"
          class="movie-poster"
          @error="handleImageError"
        />
        <div class="movie-info">
          <h3 class="movie-title">{{ movie.title }}</h3>
          <div class="movie-meta">
            <div class="movie-year">{{ movieYear }}</div>
            <div class="movie-rating">
              <i class="fas fa-star"></i>
              {{ formattedRating }}
            </div>
          </div>
        </div>
        <div class="movie-description" v-if="movie.overview">
          <h3 class="hover-title">{{ movie.title }}</h3>
          {{ truncatedOverview }}
        </div>
      </div>
    </div>
  `,
};
