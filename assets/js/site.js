(function () {
  var doc = document.documentElement;
  doc.classList.add("js");

  // Mobile navigation
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.querySelector("span").textContent = open ? "Close" : "Menu";
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.querySelector("span").textContent = "Menu";
      }
    });
  }

  // Reveal on scroll
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("is-in"); });
  }

  // Footer year
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // Consultation form: composes an email to Diane (no backend required on Vercel)
  var form = document.getElementById("consult-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var d = new FormData(form);
      var lines = [
        "Name: " + (d.get("name") || ""),
        "Phone: " + (d.get("phone") || ""),
        "Email: " + (d.get("email") || ""),
        "Looking to: " + (d.get("goal") || ""),
        "Area: " + (d.get("area") || ""),
        "",
        d.get("message") || ""
      ];
      var subject = "Consultation request — " + (d.get("name") || "New client");
      window.location.href = "mailto:" + form.dataset.to +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(lines.join("\n"));
    });
  }

  // Google review prompt (bottom-left): appears after a short delay, dismissible per session
  var review = document.getElementById("g-review");
  if (review) {
    var dismissed = false;
    try { dismissed = sessionStorage.getItem("gReviewDismissed") === "1"; } catch (e) {}
    if (!dismissed) {
      review.hidden = false;
      setTimeout(function () { review.classList.add("is-in"); }, 2500);
      review.querySelector(".g-review__close").addEventListener("click", function () {
        review.classList.remove("is-in");
        setTimeout(function () { review.hidden = true; }, 500);
        try { sessionStorage.setItem("gReviewDismissed", "1"); } catch (e) {}
      });
    }
  }
})();
