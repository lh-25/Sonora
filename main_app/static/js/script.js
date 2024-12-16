
document.addEventListener("DOMContentLoaded", function () {
  const genreFilter = document.getElementById("genre-filter");
  const genreForm = document.getElementById("genre-filter-form");

  if (genreFilter && genreForm) {
    genreFilter.addEventListener("change", function () {
      genreForm.submit();
    });
  }
});


function toggleReplyForm(formId) {
  const replyForm = document.getElementById(formId);
  replyForm.style.display = replyForm.style.display === "none" || replyForm.style.display === "" ? "block" : "none";
}
