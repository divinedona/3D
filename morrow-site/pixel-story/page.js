const video = document.querySelector("#story-video");
const status = document.querySelector("#player-status");
if (
  ["127.0.0.1", "localhost"].includes(location.hostname) &&
  location.port === "5182"
) {
  document.querySelectorAll(".landing-link").forEach((link) => {
    link.href = "http://127.0.0.1:5180/";
  });
}
document.querySelector("#year").textContent = `© ${new Date().getFullYear()}`;
document.querySelector("#replay").addEventListener("click", async () => {
  video.currentTime = 0;
  try {
    await video.play();
    status.textContent = "";
  } catch {
    status.textContent = "Use the video's Play button to start the story.";
  }
});
video.addEventListener("error", () => {
  status.textContent = "The video could not load. Try the Download MP4 link.";
});
