// Format movie rating
export const formatRating = (rating) => {
  return rating ? rating.toFixed(1) : "N/A";
};

// Format date string
export const formatDate = (dateString) => {
  if (!dateString) return "Unknown";

  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Format genres list
export const formatGenres = (genres) => {
  if (!genres || !genres.length) return "Unknown";
  return genres.map((g) => g.name).join(", ");
};
