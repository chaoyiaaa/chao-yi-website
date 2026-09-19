(() => {
  "use strict";

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Sticky header shrink/solidify ---------- */
  const header = document.getElementById("siteHeader");
  const onScroll = () => {
    if (window.scrollY > 24) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile nav toggle ---------- */
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");

  const closeNav = () => {
    mainNav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  };

  navToggle.addEventListener("click", () => {
    const open = mainNav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      closeNav();
      document.body.style.overflow = "";
    });
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mainNav.classList.contains("open")) {
      closeNav();
      document.body.style.overflow = "";
    }
  });

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in-view"));
  }

  /* ---------- Booking form: validation + StaticForms submission ---------- */
  const form = document.getElementById("bookingForm");
  const successMsg = document.getElementById("formSuccess");
  const errorMsg = document.getElementById("formError");
  const STATICFORMS_ACCESS_KEY = "sf_a1c0c80f32ef09c9ab00e750";

  if (form) {
    const validators = {
      name: (v) => v.trim().length > 1 || "Please enter your name.",
      phone: (v) => v.trim().length > 6 || "Please enter a valid phone number.",
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || "Please enter a valid email address.",
      eventDate: (v) => v.trim().length > 0 || "Please select an event date.",
      eventType: (v) => v.trim().length > 0 || "Please select an event type.",
      location: (v) => v.trim().length > 1 || "Please enter the event location.",
    };

    const setFieldError = (field, msg) => {
      const wrapper = field.closest(".field");
      const errorEl = wrapper.querySelector(".field-error");
      if (msg) {
        wrapper.classList.add("has-error");
        errorEl.textContent = msg;
      } else {
        wrapper.classList.remove("has-error");
        errorEl.textContent = "";
      }
    };

    Object.keys(validators).forEach((name) => {
      const field = form.elements[name];
      field.addEventListener("blur", () => {
        const result = validators[name](field.value);
        setFieldError(field, result === true ? "" : result);
      });
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      successMsg.hidden = true;
      errorMsg.hidden = true;

      // Honeypot: real visitors never check this hidden field. If it's
      // checked, silently drop the submission without alerting the bot.
      if (form.elements["botcheck"] && form.elements["botcheck"].checked) {
        return;
      }

      let firstInvalid = null;
      let valid = true;

      Object.keys(validators).forEach((name) => {
        const field = form.elements[name];
        const result = validators[name](field.value);
        if (result !== true) {
          valid = false;
          setFieldError(field, result);
          if (!firstInvalid) firstInvalid = field;
        } else {
          setFieldError(field, "");
        }
      });

      const consent = form.elements["consent"];
      if (!consent.checked) {
        valid = false;
        if (!firstInvalid) firstInvalid = consent;
      }

      if (!valid) {
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const name = form.elements["name"].value.trim();
      const eventTypeSelect = form.elements["eventType"];
      const eventTypeText = eventTypeSelect.options[eventTypeSelect.selectedIndex]?.text || "";

      const payload = {
        accessKey: STATICFORMS_ACCESS_KEY,
        subject: `Booking enquiry from ${name}`,
        replyTo: form.elements["email"].value.trim(),
        name,
        email: form.elements["email"].value.trim(),
        phone: form.elements["phone"].value.trim(),
        event_date: form.elements["eventDate"].value,
        event_type: eventTypeSelect.value ? eventTypeText : "",
        event_location: form.elements["location"].value.trim(),
        message: form.elements["message"].value.trim(),
      };

      const submitBtn = form.querySelector("button[type='submit']");
      const btnLabel = submitBtn.querySelector(".btn-label");
      submitBtn.disabled = true;
      btnLabel.textContent = "Sending...";

      try {
        const res = await fetch("https://api.staticforms.xyz/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await res.json();

        if (result.success) {
          successMsg.hidden = false;
          successMsg.scrollIntoView({ behavior: "smooth", block: "nearest" });
          form.reset();
        } else {
          throw new Error(result.message || "Submission failed");
        }
      } catch (err) {
        errorMsg.hidden = false;
        errorMsg.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } finally {
        submitBtn.disabled = false;
        btnLabel.textContent = "Send Enquiry";
      }
    });
  }

  /* ---------- Join form: validation + StaticForms submission ---------- */
  const joinForm = document.getElementById("joinForm");
  const joinSuccessMsg = document.getElementById("joinFormSuccess");
  const joinErrorMsg = document.getElementById("joinFormError");
  const JOIN_STATICFORMS_ACCESS_KEY = "sf_92a07295e3cd0e8835640d65";

  if (joinForm) {
    const joinValidators = {
      name: (v) => v.trim().length > 1 || "Please enter your name.",
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || "Please enter a valid email address.",
    };

    const setJoinFieldError = (field, msg) => {
      const wrapper = field.closest(".field");
      const errorEl = wrapper.querySelector(".field-error");
      if (msg) {
        wrapper.classList.add("has-error");
        errorEl.textContent = msg;
      } else {
        wrapper.classList.remove("has-error");
        errorEl.textContent = "";
      }
    };

    Object.keys(joinValidators).forEach((name) => {
      const field = joinForm.elements[name];
      field.addEventListener("blur", () => {
        const result = joinValidators[name](field.value);
        setJoinFieldError(field, result === true ? "" : result);
      });
    });

    joinForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      joinSuccessMsg.hidden = true;
      joinErrorMsg.hidden = true;

      // Honeypot: real visitors never check this hidden field. If it's
      // checked, silently drop the submission without alerting the bot.
      if (joinForm.elements["botcheck"] && joinForm.elements["botcheck"].checked) {
        return;
      }

      let firstInvalid = null;
      let valid = true;

      Object.keys(joinValidators).forEach((name) => {
        const field = joinForm.elements[name];
        const result = joinValidators[name](field.value);
        if (result !== true) {
          valid = false;
          setJoinFieldError(field, result);
          if (!firstInvalid) firstInvalid = field;
        } else {
          setJoinFieldError(field, "");
        }
      });

      if (!valid) {
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const name = joinForm.elements["name"].value.trim();

      const payload = {
        accessKey: JOIN_STATICFORMS_ACCESS_KEY,
        subject: `Membership enquiry from ${name}`,
        replyTo: joinForm.elements["email"].value.trim(),
        name,
        email: joinForm.elements["email"].value.trim(),
        message: joinForm.elements["message"].value.trim(),
      };

      const submitBtn = joinForm.querySelector("button[type='submit']");
      const btnLabel = submitBtn.querySelector(".btn-label");
      submitBtn.disabled = true;
      btnLabel.textContent = "Sending...";

      try {
        const res = await fetch("https://api.staticforms.xyz/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await res.json();

        if (result.success) {
          joinSuccessMsg.hidden = false;
          joinSuccessMsg.scrollIntoView({ behavior: "smooth", block: "nearest" });
          joinForm.reset();
        } else {
          throw new Error(result.message || "Submission failed");
        }
      } catch (err) {
        joinErrorMsg.hidden = false;
        joinErrorMsg.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } finally {
        submitBtn.disabled = false;
        btnLabel.textContent = "Enquire About Joining";
      }
    });
  }

  /* ---------- Gallery lightbox ---------- */
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const lightboxClose = document.getElementById("lightboxClose");
  let lastFocused = null;

  const openLightbox = (src, caption) => {
    lastFocused = document.activeElement;
    lightboxImg.src = src;
    lightboxImg.alt = caption || "";
    lightboxCaption.textContent = caption || "";
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    lightboxClose.focus();
  };

  const closeLightbox = () => {
    lightbox.hidden = true;
    lightboxImg.src = "";
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  };

  document.querySelectorAll("button.gallery-item[data-full]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openLightbox(btn.dataset.full, btn.dataset.caption);
    });
  });

  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
  });
})();
